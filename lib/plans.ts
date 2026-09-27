export type PlanId = "free" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  limits: { chat: number; writing: number; study: number; image: number; voice: number; files: number; agents: number };
};

export const plans: Record<PlanId, Plan> = {
  free: { id: "free", name: "Free", limits: { chat: 30, writing: 15, study: 15, image: 3, voice: 10, files: 10, agents: 3 } },
  pro: { id: "pro", name: "Pro", limits: { chat: 1000, writing: 500, study: 500, image: 100, voice: 300, files: 250, agents: 100 } },
};

export type UsageCategory = keyof Plan["limits"];

export function getPlan(value: unknown): Plan {
  return value === "pro" ? plans.pro : plans.free;
}

export function planAllows(plan: Plan, category: UsageCategory, used: number) {
  return used < plan.limits[category];
}