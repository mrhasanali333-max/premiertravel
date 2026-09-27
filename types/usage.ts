import type { UsageCategory } from "@/lib/plans";

export type DailyUsage = { userId: string; date: string; counts: Partial<Record<UsageCategory, number>>; updatedAt?: unknown };
export type UsageSnapshot = { planId: "free" | "pro"; limits: Record<UsageCategory, number>; counts: Partial<Record<UsageCategory, number>>; date: string };