import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { NextRequest } from "next/server";

export class ApiError extends Error {
  constructor(message: string, readonly status = 500) {
    super(message);
  }
}

function adminApp() {
  if (getApps().length) return getApp();
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawServiceAccount) {
    try {
      const serviceAccount = JSON.parse(rawServiceAccount) as Parameters<typeof cert>[0];
      return initializeApp({ credential: cert(serviceAccount), storageBucket });
    } catch {
      throw new ApiError("FIREBASE_SERVICE_ACCOUNT_JSON is not valid service-account JSON.", 503);
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    return initializeApp({ credential: applicationDefault(), storageBucket, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }
  return null;
}

export function adminServices() {
  const app = adminApp();
  if (!app) return null;
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || app.options.storageBucket;
  return { auth: getAuth(app), db: getFirestore(app), bucket: bucketName ? getStorage(app).bucket(bucketName) : null };
}

export async function requireUser(request: NextRequest) {
  const services = adminServices();
  if (!services) throw new ApiError("Server authentication is not configured. Add FIREBASE_SERVICE_ACCOUNT_JSON.", 503);
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new ApiError("Sign in to use this endpoint.", 401);
  try {
    const decoded = await services.auth.verifyIdToken(token);
    return { userId: decoded.uid, services };
  } catch {
    throw new ApiError("Your session has expired. Sign in again.", 401);
  }
}

export function apiErrorResponse(error: unknown) {
  const message = error instanceof ApiError ? error.message : "The request could not be completed. Please try again.";
  const status = error instanceof ApiError ? error.status : 500;
  return Response.json({ error: message }, { status });
}