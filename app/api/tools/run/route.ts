import { NextRequest } from "next/server";
export const runtime = "nodejs";
import { handleSpecialtyTool } from "@/lib/specialty-tools";

export function POST(request: NextRequest) { return handleSpecialtyTool(request); }