import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useProfile, type Persona } from "@/hooks/useProfile";
import { SkillInput } from "@/components/SkillInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — ProjectMatch" },
      {
        name: "description",
        content: "Keep your skills, department and weekly availability up to date for better matches.",
      },
      { property: "og:title", content: "Your profile — ProjectMatch" },
      { property: "og:description", content: "Tune your skills to improve your project match scores." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    persona: "student" as Persona,
    full_name: "",
    department: "",
    year_of_study: "",
    company: "",
    job_title: "",
    institution: "",
    research_focus: "",
    bio: "",
    weekly_hours: 10,
  });
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      persona: profile.persona ?? "student",
      full_name: profile.full_name ?? "",
      department: profile.department ?? "",
      year_of_study: profile.year_of_study ?? "",
      company: profile.company ?? "",
      job_title: profile.job_title ?? "",
      institution: profile.institution ?? "",
      research_focus: profile.research_focus ?? "",
      bio: profile.bio ?? "",
      weekly_hours: profile.weekly_hours ?? 10,
    });
    setSkills(profile.skills ?? []);
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user!.id, ...form, skills })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading profile…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your profile</h1>
        <p className="mt-1 text-muted-foreground">
          Your skills drive every match score you see across ProjectMatch.
        </p>
      </div>

      <form
        className="panel space-y-6 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="space-y-3">
          <Label>I am a</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={form.persona}
            onValueChange={(value) => {
              if (value) setForm({ ...form, persona: value as Persona });
            }}
            className="flex w-full flex-wrap justify-start gap-2"
          >
            <ToggleGroupItem value="student" className="flex-1 px-4 sm:flex-none">
              Student
            </ToggleGroupItem>
            <ToggleGroupItem value="professional" className="flex-1 px-4 sm:flex-none">
              Working Professional
            </ToggleGroupItem>
            <ToggleGroupItem value="researcher" className="flex-1 px-4 sm:flex-none">
              Researcher
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {form.persona === "student" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Computer Science"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year of study</Label>
                <Input
                  id="year"
                  placeholder="3rd year"
                  value={form.year_of_study}
                  onChange={(e) => setForm({ ...form, year_of_study: e.target.value })}
                />
              </div>
            </>
          )}

          {form.persona === "professional" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="company">Company / Organization</Label>
                <Input
                  id="company"
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Current Role</Label>
                <Input
                  id="job_title"
                  placeholder="Software Engineer"
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                />
              </div>
            </>
          )}

          {form.persona === "researcher" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  placeholder="MIT"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="research_focus">Research Focus</Label>
                <Input
                  id="research_focus"
                  placeholder="Machine learning, NLP"
                  value={form.research_focus}
                  onChange={(e) => setForm({ ...form, research_focus: e.target.value })}
                />
              </div>
            </>
          )}
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Weekly hours available</Label>
            <Input
              id="hours"
              type="number"
              min={0}
              max={80}
              value={form.weekly_hours}
              onChange={(e) => setForm({ ...form, weekly_hours: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={4}
            placeholder="What do you like building?"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Skills</Label>
          <SkillInput value={skills} onChange={setSkills} />
        </div>

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
