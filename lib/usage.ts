import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

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