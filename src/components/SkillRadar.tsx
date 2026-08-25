import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export function SkillRadar({
  requiredSkills,
  userSkills,
}: {
  requiredSkills: string[];
  userSkills: string[] | null | undefined;
}) {
  const mine = new Set((userSkills ?? []).map((s) => s.trim().toLowerCase()));
  const seen = new Set<string>();
  const axes = requiredSkills
    .map((s) => s.trim())
    .filter((s) => {
      const k = s.toLowerCase();
      if (!s || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 8);

  if (axes.length < 3) return null;

  const data = axes.map((skill) => ({
    skill,
    required: 100,
    you: mine.has(skill.toLowerCase()) ? 100 : 15,
  }));

  return (
    <div className="panel p-5">
      <h2 className="text-base font-semibold">Skill gap radar</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Your profile skills compared with everything this project needs.
      </p>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Radar
              name="Required"
              dataKey="required"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.12}
            />
            <Radar
              name="You"
              dataKey="you"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
