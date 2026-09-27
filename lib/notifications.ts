import type { Firestore } from "firebase-admin/firestore";

export async function createNotification(db: Firestore, userId: string, title: string, message: string, href: string) {
  try {
    await db.collection("notifications").add({ userId, title: title.slice(0, 120), message: message.slice(0, 400), href, read: false, createdAt: new Date() });
  } catch (error) {
    console.error("NEXORA notification write failed", error);
  }
}