import { NextRequest } from "next/server";
import { handleSpecialtyTool } from "@/lib/specialty-tools";
export const runtime = "nodejs";
export function POST(request: NextRequest) { return handleSpecialtyTool(request, "travel"); }