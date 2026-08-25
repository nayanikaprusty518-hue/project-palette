import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { DOMAINS } from "@/lib/match";
import { SkillInput } from "@/components/SkillInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({
    meta: [
      { title: "Create a project — ProjectMatch" },
      {
        name: "description",
        content: "Launch a project, define up to five open roles and start receiving applications.",
      },
      { property: "og:title", content: "Create a project — ProjectMatch" },
      { property: "og:description", content: "Define your team's open roles in a couple of steps." },
    ],
  }),
  component: CreateStudio,
});

type DraftRole = { role_name: string; required_skills: string[]; slots_total: number };

const emptyRole = (): DraftRole => ({ role_name: "", required_skills: [], slots_total: 1 });

function CreateStudio() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({
    title: "",
    tagline: "",
    description: "",
    domain: DOMAINS[0] as string,
    deadline: "",
  });
  const [roles, setRoles] = useState<DraftRole[]>([emptyRole()]);

  const create = useMutation({
    mutationFn: async () => {
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          owner_id: user!.id,
          title: details.title,
          tagline: details.tagline || null,
          description: details.description || null,
          domain: details.domain,
          deadline: details.deadline || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const payload = roles
        .filter((r) => r.role_name.trim())
        .map((r) => ({
          project_id: project.id,
          role_name: r.role_name.trim(),
          required_skills: r.required_skills,
          slots_total: Math.max(1, r.slots_total),
        }));

      if (payload.length) {
        const { error: roleError } = await supabase.from("roles").insert(payload);
        if (roleError) throw roleError;
      }
      return project.id as string;
    },
    onSuccess: (id) => {
      toast.success("Project published");
      navigate({ to: "/projects/$projectId", params: { projectId: id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canContinue = details.title.trim().length > 2;
  const canPublish = roles.some((r) => r.role_name.trim());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create project studio</h1>
        <p className="mt-1 text-muted-foreground">Two quick steps and your roles go live.</p>
      </div>

      <div className="flex gap-2">
        {["Project details", "Open roles"].map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex-1 rounded-lg border px-4 py-2 text-sm",
              i === step
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            <span className="font-semibold">{i + 1}.</span> {label}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div className="panel space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project title</Label>
            <Input
              id="title"
              placeholder="Campus AI study buddy"
              value={details.title}
              onChange={(e) => setDetails({ ...details, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              placeholder="One line that sells the idea"
              value={details.tagline}
              onChange={(e) => setDetails({ ...details, tagline: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Domain</Label>
              <Select
                value={details.domain}
                onValueChange={(v) => setDetails({ ...details, domain: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={details.deadline}
                onChange={(e) => setDetails({ ...details, deadline: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              placeholder="What are you building, and what does success look like?"
              value={details.description}
              onChange={(e) => setDetails({ ...details, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <Button disabled={!canContinue} onClick={() => setStep(1)}>
              Next: roles <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role, i) => (
            <div key={i} className="panel space-y-4 p-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Role {i + 1}
                </span>
                {roles.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    aria-label="Remove role"
                    onClick={() => setRoles(roles.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <div className="space-y-2">
                  <Label>Role name</Label>
                  <Input
                    placeholder="ML Engineer"
                    value={role.role_name}
                    onChange={(e) =>
                      setRoles(
                        roles.map((r, idx) => (idx === i ? { ...r, role_name: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slots</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={role.slots_total}
                    onChange={(e) =>
                      setRoles(
                        roles.map((r, idx) =>
                          idx === i ? { ...r, slots_total: Number(e.target.value) } : r,
                        ),
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Required skills</Label>
                <SkillInput
                  value={role.required_skills}
                  onChange={(next) =>
                    setRoles(roles.map((r, idx) => (idx === i ? { ...r, required_skills: next } : r)))
                  }
                />
              </div>
            </div>
          ))}

          {roles.length < 5 && (
            <Button variant="secondary" onClick={() => setRoles([...roles, emptyRole()])}>
              <Plus className="size-4" /> Add another role
            </Button>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button disabled={!canPublish || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? "Publishing…" : "Publish project"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
