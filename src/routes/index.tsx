import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, Target, Users, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProjectMatch — Build the right team, faster" },
      {
        name: "description",
        content:
          "ProjectMatch pairs students with university projects, hackathons and research teams using skill-based match scores and open role listings.",
      },
      { property: "og:title", content: "ProjectMatch — Build the right team, faster" },
      {
        property: "og:description",
        content: "Skill-matched team formation for university projects and hackathons.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Gauge,
    title: "Dynamic match scores",
    body: "Every project card shows how closely your skills line up with the roles still open.",
  },
  {
    icon: Target,
    title: "Role-level applications",
    body: "Apply to a specific role with a short pitch. Owners see the fit percentage instantly.",
  },
  {
    icon: Users,
    title: "Slots that manage themselves",
    body: "Accepting an applicant fills the slot and closes the role once the team is complete.",
  },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/explore", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold">ProjectMatch</span>
        </div>
        <div className="ml-auto">
          <Button asChild variant="secondary">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
          For hackathons, coursework and research labs
        </span>
        <h1 className="mt-6 text-5xl font-bold leading-[1.05] sm:text-6xl">
          Build the right team,
          <span className="block text-primary">not just any team.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Post a project, define the roles you need, and let skill-based match scores surface the
          teammates who actually fit.
        </p>
        <div className="mt-9 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/explore">Explore projects</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="panel p-6">
            <Icon className="size-5 text-primary" />
            <h2 className="mt-4 text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
