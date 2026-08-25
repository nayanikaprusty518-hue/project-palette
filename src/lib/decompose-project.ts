import { DOMAINS, SKILL_SUGGESTIONS } from "@/lib/match";

export type DecomposedRole = {
  role_name: string;
  role_description: string;
  required_skills: string[];
  slots_total: number;
};

export type DecomposedProject = {
  title: string;
  tagline: string;
  description: string;
  domain: string;
  roles: DecomposedRole[];
};

type RoleTemplate = {
  role_name: string;
  role_description: string;
  skills: string[];
  slots_total: number;
  keywords: string[];
};

const DOMAIN_HINTS: Record<string, string[]> = {
  "AI/ML": ["ai", "ml", "machine learning", "deep learning", "nlp", "llm", "vision", "model", "neural", "classifier", "gpt"],
  Robotics: ["robot", "robotics", "rov", "drone", "autonomous", "hardware", "embedded", "mechanical", "underwater", "sensor"],
  Web3: ["web3", "blockchain", "crypto", "solidity", "defi", "nft", "smart contract", "token"],
  FinTech: ["fintech", "finance", "payment", "banking", "trading", "ledger", "wallet"],
  HealthTech: ["health", "medical", "clinical", "patient", "diagnosis", "biotech", "hospital"],
  "Web Dev": ["web", "website", "dashboard", "portal", "saas", "frontend", "backend", "full-stack"],
  Mobile: ["mobile", "app", "ios", "android", "flutter", "react native"],
  Research: ["research", "study", "paper", "thesis", "experiment", "analysis", "survey"],
  Sustainability: ["sustain", "climate", "green", "eco", "environment", "trash", "waste", "ocean", "carbon", "renewable", "clean"],
};

const ROLE_LIBRARY: RoleTemplate[] = [
  {
    role_name: "ML Engineer",
    role_description: "Design and train models, run experiments, and ship inference pipelines.",
    skills: ["Python", "PyTorch", "TensorFlow", "Data Analysis"],
    slots_total: 1,
    keywords: ["ai", "ml", "model", "vision", "nlp", "learning", "classifier", "detection"],
  },
  {
    role_name: "Computer Vision Engineer",
    role_description: "Build perception systems for object detection, tracking, and scene understanding.",
    skills: ["Python", "PyTorch", "TensorFlow", "Data Analysis"],
    slots_total: 1,
    keywords: ["vision", "camera", "detection", "image", "video", "underwater", "trash", "object"],
  },
  {
    role_name: "Robotics Engineer",
    role_description: "Integrate sensors, actuators, and autonomy stacks for physical systems.",
    skills: ["ROS", "C++", "Python", "Rust"],
    slots_total: 1,
    keywords: ["robot", "robotics", "autonomous", "navigation", "rov", "drone", "hardware", "underwater"],
  },
  {
    role_name: "Hardware Engineer",
    role_description: "Prototype enclosures, power systems, and field-ready mechanical assemblies.",
    skills: ["C++", "ROS", "Rust"],
    slots_total: 1,
    keywords: ["hardware", "mechanical", "embedded", "prototype", "device", "collector", "sensor"],
  },
  {
    role_name: "Full-Stack Developer",
    role_description: "Ship the product UI, APIs, and integrations that users interact with daily.",
    skills: ["React", "TypeScript", "Node.js", "Postgres"],
    slots_total: 1,
    keywords: ["web", "dashboard", "portal", "app", "platform", "saas", "full-stack", "frontend"],
  },
  {
    role_name: "Mobile Developer",
    role_description: "Build polished native or cross-platform mobile experiences.",
    skills: ["Flutter", "React", "TypeScript"],
    slots_total: 1,
    keywords: ["mobile", "ios", "android", "app", "flutter"],
  },
  {
    role_name: "UI/UX Designer",
    role_description: "Own user flows, visual design, and usability testing for the product.",
    skills: ["Figma", "UI/UX", "Product"],
    slots_total: 1,
    keywords: ["design", "ux", "ui", "user", "interface", "experience"],
  },
  {
    role_name: "Blockchain Developer",
    role_description: "Implement smart contracts, on-chain logic, and wallet integrations.",
    skills: ["Solidity", "Rust", "TypeScript"],
    slots_total: 1,
    keywords: ["web3", "blockchain", "solidity", "defi", "crypto", "token", "smart contract"],
  },
  {
    role_name: "Data Analyst",
    role_description: "Turn raw signals into dashboards, insights, and decision-ready metrics.",
    skills: ["Python", "Data Analysis", "Postgres"],
    slots_total: 1,
    keywords: ["data", "analytics", "metrics", "insights", "report", "analysis"],
  },
  {
    role_name: "Research Lead",
    role_description: "Define hypotheses, run studies, and document findings for the team.",
    skills: ["Data Analysis", "Python", "Product"],
    slots_total: 1,
    keywords: ["research", "study", "experiment", "thesis", "paper", "survey"],
  },
  {
    role_name: "Product Manager",
    role_description: "Prioritize roadmap, align stakeholders, and keep delivery on track.",
    skills: ["Product", "UI/UX", "Data Analysis"],
    slots_total: 1,
    keywords: ["product", "roadmap", "strategy", "pm", "manager"],
  },
];

const normalize = (s: string) => s.trim().toLowerCase();

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function inferDomain(idea: string): string {
  const lower = normalize(idea);
  let best = DOMAINS[0];
  let bestScore = 0;

  for (const domain of DOMAINS) {
    const hints = DOMAIN_HINTS[domain] ?? [];
    const score = hints.filter((hint) => lower.includes(hint)).length;
    if (score > bestScore) {
      bestScore = score;
      best = domain;
    }
  }

  return best;
}

function pickSkills(requested: string[]): string[] {
  const allowed = new Set(SKILL_SUGGESTIONS.map(normalize));
  const picked = requested.filter((skill) => allowed.has(normalize(skill)));
  return picked.length > 0 ? picked.slice(0, 5) : ["Product"];
}

function scoreRole(template: RoleTemplate, idea: string): number {
  const lower = normalize(idea);
  return template.keywords.filter((keyword) => lower.includes(keyword)).length;
}

function buildDescription(idea: string, domain: string, roles: DecomposedRole[]): string {
  const roleList = roles.map((role) => `• ${role.role_name}: ${role.role_description}`).join("\n");

  return [
    `${titleCase(idea)} is a ${domain.toLowerCase()} initiative focused on turning the concept into a shippable MVP.`,
    "",
    "Success looks like a working prototype with clear ownership across engineering, design, and delivery — validated with real users or field tests.",
    "",
    "Recommended team structure:",
    roleList,
  ].join("\n");
}

function buildTagline(idea: string, domain: string): string {
  const snippets: Record<string, string> = {
    "AI/ML": "Intelligent automation built for real-world impact.",
    Robotics: "Autonomous systems engineered for the physical world.",
    Web3: "On-chain infrastructure with a polished user experience.",
    FinTech: "Modern financial tooling that users trust.",
    HealthTech: "Health outcomes powered by thoughtful software.",
    "Web Dev": "A fast, reliable web product your team can scale.",
    Mobile: "Mobile-first experiences users reach for every day.",
    Research: "Rigorous research translated into actionable results.",
    Sustainability: "Climate-positive tech with measurable impact.",
  };

  const base = snippets[domain] ?? "A focused team project ready to ship.";
  return `${titleCase(idea)} — ${base}`;
}

function selectRoles(idea: string, domain: string): DecomposedRole[] {
  const lower = normalize(idea);

  const ranked = ROLE_LIBRARY.map((template) => ({
    template,
    score: scoreRole(template, idea) + (template.keywords.some((k) => DOMAIN_HINTS[domain]?.includes(k)) ? 1 : 0),
  }))
    .sort((a, b) => b.score - a.score)
    .map(({ template }) => template);

  const chosen: RoleTemplate[] = [];
  const usedNames = new Set<string>();

  for (const template of ranked) {
    if (chosen.length >= 4) break;
    if (usedNames.has(template.role_name)) continue;
    if (scoreRole(template, idea) > 0 || chosen.length < 2) {
      chosen.push(template);
      usedNames.add(template.role_name);
    }
  }

  if (chosen.length < 3) {
    for (const fallback of ROLE_LIBRARY) {
      if (chosen.length >= 3) break;
      if (usedNames.has(fallback.role_name)) continue;
      chosen.push(fallback);
      usedNames.add(fallback.role_name);
    }
  }

  const contextualize = (description: string, roleName: string) => {
    if (lower.includes("underwater") || lower.includes("ocean")) {
      return `${description} Emphasis on marine environments, waterproof hardware, and robust field deployment.`;
    }
    if (lower.includes("trash") || lower.includes("waste") || lower.includes("collector")) {
      return `${description} Focus on detection, collection workflows, and operational reliability.`;
    }
    if (lower.includes("ai") && roleName.includes("ML")) {
      return `${description} Tailored to the core AI capabilities described in the project idea.`;
    }
    return `${description} Scoped directly to "${idea.trim()}".`;
  };

  return chosen.slice(0, 4).map((template) => ({
    role_name: template.role_name,
    role_description: contextualize(template.role_description, template.role_name),
    required_skills: pickSkills(template.skills),
    slots_total: template.slots_total,
  }));
}

/** Simulated AI decomposition — maps a free-text idea into project details and roles. */
export async function decomposeProjectIdea(idea: string): Promise<DecomposedProject> {
  const trimmed = idea.trim();
  if (trimmed.length < 3) {
    throw new Error("Describe your project idea in a few words first.");
  }

  // Brief delay so the interaction feels like an AI call.
  await new Promise((resolve) => setTimeout(resolve, 900));

  const domain = inferDomain(trimmed);
  const roles = selectRoles(trimmed, domain);
  const title = titleCase(trimmed);

  return {
    title,
    tagline: buildTagline(trimmed, domain),
    description: buildDescription(trimmed, domain, roles),
    domain,
    roles,
  };
}
