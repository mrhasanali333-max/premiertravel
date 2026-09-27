import { NextRequest } from "next/server";
import { apiErrorResponse, requireUser } from "@/lib/firebase-admin";
import { getPlan } from "@/lib/plans";
import type { UsageCategory } from "@/lib/plans";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    const date = new Date().toISOString().slice(0, 10);
    const [profile, usage] = await Promise.all([
      services.db.collection("users").doc(userId).get(),
      services.db.collection("usage").doc(userId).collection("daily").doc(date).get(),
    ]);
    const plan = getPlan(profile.data()?.planId);
    const counts = usage.data()?.counts || {};
    return Response.json({ planId: plan.id, planName: plan.name, limits: plan.limits, counts: Object.fromEntries(Object.keys(plan.limits).map((key) => [key, Number(counts[key as UsageCategory] || 0)])), date });
  } catch (error) {
    return apiErrorResponse(error);
  }
}