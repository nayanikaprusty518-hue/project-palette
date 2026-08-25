import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Lock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { computeMatchBreakdown, matchScore, projectMatchBreakdown } from "@/lib/match";
import { MatchBreakdownBadge } from "@/components/MatchBreakdown";
import { SkillRadar } from "@/components/SkillRadar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project details — ProjectMatch" },
      {
        name: "description",
        content: "See open and filled roles, required skills, and apply with a one-click pitch.",
      },
      { property: "og:title", content: "Project details — ProjectMatch" },
      { property: "og:description", content: "Open roles, required skills and your match score." },
    ],
  }),
  component: ProjectDetail,
});

type Role = {
  id: string;
  role_name: string;
  required_skills: string[];
  slots_total: number;
  slots_filled: number;
  is_open: boolean;
};

type Project = {
  id: string;
  owner_id: string;
  title: string;
  tagline: string | null;
  description: string | null;
  domain: string;
  deadline: string | null;
  roles: Role[];
  profiles: { full_name: string; department: string | null } | null;
};

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [applyRole, setApplyRole] = useState<Role | null>(null);
  const [pitch, setPitch] = useState("");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, roles(*), profiles!projects_owner_id_fkey(full_name, department)")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data as unknown as Project;
    },
  });

  const { data: myApplications } = useQuery({
    queryKey: ["my-applications", projectId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, role_id, status")
        .eq("project_id", projectId)
        .eq("applicant_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").insert({
        project_id: projectId,
        role_id: applyRole!.id,
        applicant_id: user!.id,
        pitch_note: pitch || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application sent");
      setApplyRole(null);
      setPitch("");
      queryClient.invalidateQueries({ queryKey: ["my-applications", projectId] });
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("duplicate") ? "You already applied to this role" : e.message),
  });

  if (isLoading || !project) return <p className="text-muted-foreground">Loading project…</p>;

  const roles = project.roles ?? [];
  const filled = roles.reduce((n, r) => n + r.slots_filled, 0);
  const total = roles.reduce((n, r) => n + r.slots_total, 0);
  const isOwner = project.owner_id === user?.id;
  const appliedRoleIds = new Set((myApplications ?? []).map((a) => a.role_id));
  const overallBreakdown = projectMatchBreakdown(profile ?? null, project.domain, roles);

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="mb-3 bg-primary/15 text-primary hover:bg-primary/20">
              {project.domain}
            </Badge>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            {project.tagline && <p className="mt-2 text-muted-foreground">{project.tagline}</p>}
          </div>
          <MatchBreakdownBadge breakdown={overallBreakdown} label="overall match" />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-4" /> {filled}/{total} seats filled
          </span>
          {project.deadline && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              Deadline {new Date(project.deadline).toLocaleDateString()}
            </span>
          )}
          <span>Led by {project.profiles?.full_name ?? "Unknown"}</span>
          {isOwner && (
            <Button asChild size="sm" variant="secondary" className="ml-auto">
              <Link to="/my-projects">Review applicants</Link>
            </Button>
          )}
        </div>

        <Progress className="mt-4" value={total ? (filled / total) * 100 : 0} />

        {project.description && (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {project.description}
          </p>
        )}
      </div>

      <SkillRadar
        requiredSkills={roles.flatMap((r) => r.required_skills)}
        userSkills={profile?.skills}
      />

      <div>
        <h2 className="mb-4 text-xl font-semibold">Roles</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => {
            const roleBreakdown = computeMatchBreakdown(
              profile ?? null,
              project.domain,
              role.required_skills,
              [role],
            );
            const applied = appliedRoleIds.has(role.id);
            const seatsLeft = role.slots_total - role.slots_filled;
            return (
              <div key={role.id} className="panel space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{role.role_name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {role.slots_filled}/{role.slots_total} filled
                      {role.is_open ? ` · ${seatsLeft} open` : " · closed"}
                    </p>
                  </div>
                  <MatchBreakdownBadge breakdown={roleBreakdown} align="start" />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {role.required_skills.map((s) => {
                    const has = (profile?.skills ?? []).some(
                      (m) => m.toLowerCase() === s.toLowerCase(),
                    );
                    return (
                      <Badge key={s} variant={has ? "default" : "secondary"}>
                        {s}
                      </Badge>
                    );
                  })}
                  {role.required_skills.length === 0 && (
                    <span className="text-xs text-muted-foreground">No specific skills listed</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {Array.from({ length: role.slots_total }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 flex-1 rounded-full ${
                        i < role.slots_filled ? "bg-success" : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>

                {isOwner ? (
                  <Button variant="secondary" className="w-full" disabled>
                    You own this project
                  </Button>
                ) : applied ? (
                  <Button variant="secondary" className="w-full" disabled>
                    <CheckCircle2 className="size-4" /> Applied
                  </Button>
                ) : !role.is_open ? (
                  <Button variant="secondary" className="w-full" disabled>
                    <Lock className="size-4" /> Role closed
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => setApplyRole(role)}>
                    Apply to role
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!applyRole} onOpenChange={(o) => !o && setApplyRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply as {applyRole?.role_name}</DialogTitle>
            <DialogDescription>
              Your skill match is {matchScore(profile?.skills, applyRole?.required_skills ?? [])}%.
              Add a short note for the project lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pitch">Pitch note</Label>
            <Textarea
              id="pitch"
              rows={4}
              placeholder="Why you're a great fit, and what you'd bring."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApplyRole(null)}>
              Cancel
            </Button>
            <Button onClick={() => apply.mutate()} disabled={apply.isPending}>
              {apply.isPending ? "Sending…" : "Send application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
