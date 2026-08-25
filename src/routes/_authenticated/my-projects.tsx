import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { matchScore } from "@/lib/match";
import { MatchScore } from "@/components/MatchScore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/my-projects")({
  head: () => ({
    meta: [
      { title: "My projects & applicants — ProjectMatch" },
      {
        name: "description",
        content: "Review applicants with match scores, accept or reject, and track your own applications.",
      },
      { property: "og:title", content: "My projects & applicants — ProjectMatch" },
      {
        property: "og:description",
        content: "Accept or reject applicants and keep your team roster on track.",
      },
    ],
  }),
  component: MyProjects,
});

type Applicant = {
  id: string;
  pitch_note: string | null;
  status: string;
  created_at: string;
  role_id: string;
  roles: { role_name: string; required_skills: string[] } | null;
  profiles: {
    full_name: string;
    department: string | null;
    year_of_study: string | null;
    skills: string[];
  } | null;
};

type OwnedProject = {
  id: string;
  title: string;
  domain: string;
  roles: { id: string; role_name: string; slots_total: number; slots_filled: number; is_open: boolean }[];
};

function MyProjects() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data: owned } = useQuery({
    queryKey: ["owned-projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, domain, roles(id, role_name, slots_total, slots_filled, is_open)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OwnedProject[];
    },
  });

  const { data: applicants } = useQuery({
    queryKey: ["applicants", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(
          "id, pitch_note, status, created_at, role_id, project_id, roles(role_name, required_skills), profiles!applications_applicant_id_fkey(full_name, department, year_of_study, skills)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (Applicant & { project_id: string })[];
    },
  });

  const { data: mine } = useQuery({
    queryKey: ["sent-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, pitch_note, created_at, roles(role_name), projects(id, title, domain)")
        .eq("applicant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as {
        id: string;
        status: string;
        created_at: string;
        roles: { role_name: string } | null;
        projects: { id: string; title: string; domain: string } | null;
      }[];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.status === "accepted" ? "Applicant accepted" : "Applicant rejected");
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      queryClient.invalidateQueries({ queryKey: ["owned-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ownedIds = new Set((owned ?? []).map((p) => p.id));
  const incoming = (applicants ?? []).filter((a) => ownedIds.has(a.project_id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My projects</h1>
        <p className="mt-1 text-muted-foreground">
          Review applicants by fit, and track the roles you applied to.
        </p>
      </div>

      <Tabs defaultValue="applicants">
        <TabsList>
          <TabsTrigger value="applicants">Applicants ({incoming.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({owned?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="sent">My applications ({mine?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="applicants" className="space-y-4 pt-6">
          {incoming.length === 0 && <EmptyState label="No applications yet." />}
          {incoming.map((a) => {
            const score = matchScore(a.profiles?.skills, a.roles?.required_skills ?? []);
            return (
              <div key={a.id} className="panel space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{a.profiles?.full_name ?? "Applicant"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {[a.profiles?.department, a.profiles?.year_of_study].filter(Boolean).join(" · ") ||
                        "No department listed"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{a.roles?.role_name}</Badge>
                    <MatchScore score={score} />
                    <StatusBadge status={a.status} />
                  </div>
                </div>

                {a.pitch_note && (
                  <p className="rounded-lg bg-secondary/40 p-3 text-sm text-foreground/90">
                    {a.pitch_note}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {(a.profiles?.skills ?? []).map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>

                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => decide.mutate({ id: a.id, status: "accepted" })}
                      disabled={decide.isPending}
                    >
                      <Check className="size-4" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => decide.mutate({ id: a.id, status: "rejected" })}
                      disabled={decide.isPending}
                    >
                      <X className="size-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4 pt-6">
          {(owned ?? []).length === 0 && <EmptyState label="You haven't created a project yet." />}
          {(owned ?? []).map((p) => (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              className="panel block space-y-3 p-5 transition hover:border-primary/50"
            >
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold">{p.title}</h3>
                <Badge className="bg-primary/15 text-primary hover:bg-primary/20">{p.domain}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(p.roles ?? []).map((r) => (
                  <Badge key={r.id} variant="secondary">
                    {r.role_name} · {r.slots_filled}/{r.slots_total}
                    {r.is_open ? "" : " · closed"}
                  </Badge>
                ))}
              </div>
            </Link>
          ))}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 pt-6">
          {(mine ?? []).length === 0 && <EmptyState label="You haven't applied anywhere yet." />}
          {(mine ?? []).map((a) => (
            <div key={a.id} className="panel flex flex-wrap items-center gap-3 p-5">
              <div>
                <h3 className="text-base font-semibold">{a.projects?.title}</h3>
                <p className="text-xs text-muted-foreground">Applied as {a.roles?.role_name}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="secondary">{a.projects?.domain}</Badge>
                <StatusBadge status={a.status} />
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "accepted"
      ? "bg-success/15 text-success"
      : status === "rejected"
        ? "bg-destructive/15 text-destructive"
        : "bg-secondary text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{status}</span>;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="panel flex flex-col items-center gap-2 p-12 text-center">
      <Inbox className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
