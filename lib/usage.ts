import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { ApiError } from "@/lib/firebase-admin";
import { getPlan, planAllows } from "@/lib/plans";
import type { UsageCategory } from "@/lib/plans";

function periodKeys(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return { day, month: day.slice(0, 7) };
}

export async function recordAIRequest(db: Firestore, userId: string) {
  const reference = db.collection("usage").doc(userId);
  const { day, month } = periodKeys();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    const data = snapshot.data();
    transaction.set(reference, {
      userId,
      dailyDate: day,
      dailyRequests: data?.dailyDate === day ? Number(data.dailyRequests || 0) + 1 : 1,
      monthlyPeriod: month,
      monthlyRequests: data?.monthlyPeriod === month ? Number(data.monthlyRequests || 0) + 1 : 1,
      uploadedFiles: Number(data?.uploadedFiles || 0),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

export async function recordUploadedFile(db: Firestore, userId: string) {
  const reference = db.collection("usage").doc(userId);
  await reference.set({ userId, uploadedFiles: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function reserveUsage(db: Firestore, userId: string, category: UsageCategory) {
  const { day, month } = periodKeys();
  const usageRef = db.collection("usage").doc(userId);
  const dailyRef = usageRef.collection("daily").doc(day);
  return db.runTransaction(async (transaction) => {
    const [profile, daily, legacy] = await Promise.all([
      transaction.get(db.collection("users").doc(userId)),
      transaction.get(dailyRef),
      transaction.get(usageRef),
    ]);
    const plan = getPlan(profile.data()?.planId);
    const counts = daily.data()?.counts || {};
    const used = Number(counts[category] || 0);
    if (!planAllows(plan, category, used)) {
      throw new ApiError(`Your ${plan.name} plan has reached today's ${category} limit (${plan.limits[category]}).`, 429);
    }
    transaction.set(dailyRef, {
      userId,
      date: day,
      counts: { [category]: used + 1 },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(usageRef, {
      userId,
      dailyDate: day,
      dailyRequests: legacy.data()?.dailyDate === day ? Number(legacy.data()?.dailyRequests || 0) + 1 : 1,
      monthlyPeriod: month,
      monthlyRequests: legacy.data()?.monthlyPeriod === month ? Number(legacy.data()?.monthlyRequests || 0) + 1 : 1,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { plan, used: used + 1, remaining: Math.max(0, plan.limits[category] - used - 1) };
  });
}