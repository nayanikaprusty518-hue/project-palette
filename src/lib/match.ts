export const DOMAINS = [
  "AI/ML",
  "Robotics",
  "Web3",
  "FinTech",
  "HealthTech",
  "Web Dev",
  "Mobile",
  "Research",
  "Sustainability",
] as const;

export const SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Python",
  "PyTorch",
  "TensorFlow",
  "Figma",
  "UI/UX",
  "Node.js",
  "Solidity",
  "Rust",
  "ROS",
  "C++",
  "Data Analysis",
  "Product",
  "Flutter",
  "Postgres",
];

const normalize = (s: string) => s.trim().toLowerCase();

/** Percentage of required skills that the user already has (0-100). */
export function matchScore(userSkills: string[] | null | undefined, requiredSkills: string[]): number {
  const required = requiredSkills.map(normalize).filter(Boolean);
  if (required.length === 0) return 0;
  const mine = new Set((userSkills ?? []).map(normalize));
  const hits = required.filter((s) => mine.has(s)).length;
  return Math.round((hits / required.length) * 100);
}

/** Best match across a set of roles (used for project cards). */
export function projectMatchScore(
  userSkills: string[] | null | undefined,
  roles: { required_skills: string[] }[],
): number {
  const all = roles.flatMap((r) => r.required_skills);
  return matchScore(userSkills, all);
}

export function matchTone(score: number): "high" | "mid" | "low" {
  if (score >= 66) return "high";
  if (score >= 33) return "mid";
  return "low";
}
