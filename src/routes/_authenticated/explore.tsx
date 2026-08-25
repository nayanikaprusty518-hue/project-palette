import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { DOMAINS, projectMatchBreakdown } from "@/lib/match";
import { MatchBar } from "@/components/MatchScore";
import { MatchBreakdownBadge } from "@/components/MatchBreakdown";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({
    meta: [
      { title: "Explore projects — ProjectMatch" },
      {
        name: "description",
        content: "Browse open university projects and hackathon teams matched to your skills.",
      },
      { property: "og:title", content: "Explore projects — ProjectMatch" },
      { property: "og:description", content: "Find projects that need your exact skill set." },
    ],
  }),
  component: Explore,
});

export type RoleRow = {
  id: string;
  role_name: string;
  required_skills: string[];
  slots_total: number;
  slots_filled: number;
  is_open: boolean;
};

export type ProjectRow = {
  id: string;
  title: string;
  tagline: string | null;
  domain: string;
  deadline: string | null;
  created_at: string;
  owner_id: string;
  roles: RoleRow[];
  profiles: { full_name: string } | null;
};

function Explore() {
  const { data: profile } = useProfile();
  const [domain, setDomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openOnly, setOpenOnly] = useState(true);
  const [skillMatchOnly, setSkillMatchOnly] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, roles(*), profiles!projects_owner_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ProjectRow[];
    },
  });

  const filtered = useMemo(() => {
    const list = projects ?? [];
    return list
      .map((p) => ({
        p,
        breakdown: projectMatchBreakdown(profile ?? null, p.domain, p.roles ?? []),
      }))
      .filter(({ p, breakdown }) => {
        if (domain && p.domain !== domain) return false;
        if (openOnly && !(p.roles ?? []).some((r) => r.is_open)) return false;
        if (skillMatchOnly && breakdown.skillsMatch === 0) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const hay = [p.title, p.tagline ?? "", p.domain, ...(p.roles ?? []).flatMap((r) => [r.role_name, ...r.required_skills])]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.breakdown.overall - a.breakdown.overall);
  }, [projects, profile, domain, openOnly, skillMatchOnly, search]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Explore projects</h1>
        <p className="mt-1 text-muted-foreground">
          {profile?.skills?.length
            ? "Ranked by how well your skills match the open roles."
            : "Add skills to your profile to unlock personalised match scores."}
        </p>
      </div>

      <div className="panel space-y-4 p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search projects, roles or skills"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={domain === null} onClick={() => setDomain(null)}>
            All domains
          </FilterChip>
          {DOMAINS.map((d) => (
            <FilterChip key={d} active={domain === d} onClick={() => setDomain(d)}>
              {d}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1">
          <div className="flex items-center gap-2">
            <Switch id="open" checked={openOnly} onCheckedChange={setOpenOnly} />
            <Label htmlFor="open" className="text-sm text-muted-foreground">
              Only projects with open roles
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="match" checked={skillMatchOnly} onCheckedChange={setSkillMatchOnly} />
            <Label htmlFor="match" className="text-sm text-muted-foreground">
              Only skill matches
            </Label>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel p-12 text-center">
          <p className="text-muted-foreground">No projects match these filters yet.</p>
          <Link to="/create" className="mt-3 inline-block text-sm font-medium text-primary">
            Start your own project →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(({ p, breakdown }) => (
            <ProjectCard key={p.id} project={p} breakdown={breakdown} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ProjectCard({
  project,
  breakdown,
}: {
  project: ProjectRow;
  breakdown: ReturnType<typeof projectMatchBreakdown>;
}) {
  const roles = project.roles ?? [];
  const missing = roles.filter((r) => r.is_open);
  const filled = roles.reduce((n, r) => n + r.slots_filled, 0);
  const total = roles.reduce((n, r) => n + r.slots_total, 0);

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="panel group flex flex-col gap-4 p-5 transition hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge className="mb-2 bg-primary/15 text-primary hover:bg-primary/20">{project.domain}</Badge>
          <h2 className="text-lg font-semibold leading-tight group-hover:text-primary">
            {project.title}
          </h2>
          {project.tagline && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.tagline}</p>
          )}
        </div>
        <MatchBreakdownBadge breakdown={breakdown} />
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
          {missing.length > 0 ? "Roles still needed" : "Team complete"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {missing.slice(0, 4).map((r) => (
            <Badge key={r.id} variant="secondary">
              {r.role_name} · {r.slots_total - r.slots_filled} left
            </Badge>
          ))}
          {missing.length === 0 && <Badge variant="secondary">All roles filled</Badge>}
        </div>
      </div>

      <MatchBar score={breakdown.overall} />

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" /> {filled}/{total} seats filled
        </span>
        {project.deadline && (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {new Date(project.deadline).toLocaleDateString()}
          </span>
        )}
        <span className="ml-auto">by {project.profiles?.full_name ?? "Unknown"}</span>
      </div>
    </Link>
  );
}
