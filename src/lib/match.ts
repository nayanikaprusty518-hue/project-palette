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

export type DomainAlignment = "strong" | "partial" | "low";

export type MatchBreakdown = {
  overall: number;
  skillsMatch: number;
  availabilityFit: number;
  domainAlignment: number;
  domainLabel: DomainAlignment;
  matchedSkills: string[];
  missingSkills: string[];
  userHours: number;
  requiredHours: number;
};

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "AI/ML": ["ai", "ml", "machine", "learning", "pytorch", "tensorflow", "nlp", "vision", "data"],
  Robotics: ["robot", "ros", "hardware", "embedded", "mechanical", "automation", "c++"],
  Web3: ["web3", "blockchain", "solidity", "crypto", "defi"],
  FinTech: ["finance", "fintech", "payment", "trading", "data"],
  HealthTech: ["health", "medical", "clinical", "bio", "research"],
  "Web Dev": ["react", "typescript", "node", "web", "frontend", "backend", "postgres"],
  Mobile: ["mobile", "flutter", "ios", "android", "app"],
  Research: ["research", "analysis", "data", "python", "study"],
  Sustainability: ["sustain", "climate", "environment", "green", "data", "hardware"],
};

type ProfileContext = {
  skills?: string[] | null;
  weekly_hours?: number;
  persona?: string | null;
  department?: string | null;
  company?: string | null;
  job_title?: string | null;
  institution?: string | null;
  research_focus?: string | null;
  bio?: string | null;
};

/** Percentage of required skills that the user already has (0-100). */
export function matchScore(userSkills: string[] | null | undefined, requiredSkills: string[]): number {
  return computeSkillsMatch(userSkills, requiredSkills).score;
}

function computeSkillsMatch(userSkills: string[] | null | undefined, requiredSkills: string[]) {
  const required = [...new Set(requiredSkills.map(normalize).filter(Boolean))];
  if (required.length === 0) {
    return { score: 0, matched: [] as string[], missing: [] as string[] };
  }
  const mine = new Set((userSkills ?? []).map(normalize));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of required) {
    (mine.has(skill) ? matched : missing).push(skill);
  }
  const score = Math.round((matched.length / required.length) * 100);
  return { score, matched, missing };
}

/** Estimate weekly hours a project expects based on open roles. */
export function estimateProjectWeeklyHours(
  roles: { slots_total: number; slots_filled: number; is_open?: boolean }[],
): number {
  const openSlots = roles.reduce((total, role) => {
    if (role.is_open === false) return total;
    return total + Math.max(0, role.slots_total - role.slots_filled);
  }, 0);
  const slots = openSlots || roles.length || 1;
  return Math.min(30, Math.max(8, slots * 6));
}

export function availabilityFitScore(userHours: number, requiredHours: number): number {
  if (requiredHours <= 0) return 100;
  if (userHours <= 0) return 0;
  const ratio = userHours / requiredHours;
  if (ratio >= 1) return 100;
  if (ratio >= 0.75) return 85;
  if (ratio >= 0.5) return 65;
  if (ratio >= 0.25) return 40;
  return 20;
}

export function domainAlignmentScore(
  profile: ProfileContext | null | undefined,
  projectDomain: string,
): { score: number; label: DomainAlignment } {
  if (!profile) return { score: 0, label: "low" };

  const keywords = DOMAIN_KEYWORDS[projectDomain] ?? [];
  const profileText = [
    profile.department,
    profile.company,
    profile.job_title,
    profile.institution,
    profile.research_focus,
    profile.bio,
    ...(profile.skills ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;

  if (profile.persona === "student" && profile.department) score += 25;
  if (profile.persona === "professional" && (profile.company || profile.job_title)) score += 30;
  if (profile.persona === "researcher" && (profile.institution || profile.research_focus)) score += 35;

  const keywordHits = keywords.filter((keyword) => profileText.includes(keyword)).length;
  score += Math.min(40, keywordHits * 12);

  const skillHits = (profile.skills ?? []).filter((skill) =>
    keywords.some(
      (keyword) =>
        normalize(skill).includes(keyword) || keyword.includes(normalize(skill)),
    ),
  ).length;
  score += Math.min(35, skillHits * 15);

  score = Math.min(100, score);
  const label: DomainAlignment = score >= 66 ? "strong" : score >= 33 ? "partial" : "low";
  return { score, label };
}

export function computeMatchBreakdown(
  profile: ProfileContext | null | undefined,
  projectDomain: string,
  requiredSkills: string[],
  roles: { slots_total: number; slots_filled: number; is_open?: boolean }[],
): MatchBreakdown {
  const skills = computeSkillsMatch(profile?.skills, requiredSkills);
  const userHours = profile?.weekly_hours ?? 0;
  const requiredHours = estimateProjectWeeklyHours(roles);
  const availability = availabilityFitScore(userHours, requiredHours);
  const domain = domainAlignmentScore(profile, projectDomain);

  const overall = Math.round(
    skills.score * 0.55 + availability * 0.25 + domain.score * 0.2,
  );

  return {
    overall,
    skillsMatch: skills.score,
    availabilityFit: availability,
    domainAlignment: domain.score,
    domainLabel: domain.label,
    matchedSkills: skills.matched,
    missingSkills: skills.missing,
    userHours,
    requiredHours,
  };
}

/** Best match across a set of roles (used for project cards). */
export function projectMatchScore(
  userSkills: string[] | null | undefined,
  roles: { required_skills: string[] }[],
): number {
  const all = roles.flatMap((r) => r.required_skills);
  return matchScore(userSkills, all);
}

export function projectMatchBreakdown(
  profile: ProfileContext | null | undefined,
  projectDomain: string,
  roles: { required_skills: string[]; slots_total: number; slots_filled: number; is_open?: boolean }[],
): MatchBreakdown {
  const allSkills = roles.flatMap((r) => r.required_skills);
  return computeMatchBreakdown(profile, projectDomain, allSkills, roles);
}

export function matchTone(score: number): "high" | "mid" | "low" {
  if (score >= 66) return "high";
  if (score >= 33) return "mid";
  return "low";
}
