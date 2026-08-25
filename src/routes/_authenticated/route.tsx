import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Compass, FolderKanban, PlusCircle, UserRound, LogOut, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const NAV = [
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/my-projects", label: "My projects", icon: FolderKanban },
  { to: "/create", label: "New project", icon: PlusCircle },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Link to="/explore" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">ProjectMatch</span>
          </Link>

          <nav className="ml-auto flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
