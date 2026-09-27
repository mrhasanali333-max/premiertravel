import { ApiError } from "@/lib/firebase-admin";

export type ImageOptions = { style: string; aspectRatio: "square" | "portrait" | "landscape"; quality: "standard" | "high"; count: number };

function config() {
  const apiKey = process.env.IMAGE_PROVIDER_API_KEY;
  const baseUrl = process.env.IMAGE_PROVIDER_BASE_URL?.replace(/\/+$/, "");
  if (!apiKey || !baseUrl) throw new ApiError("Image generation is not configured. Set IMAGE_PROVIDER_API_KEY and IMAGE_PROVIDER_BASE_URL.", 503);
  return { apiKey, baseUrl };
}

export async function generateImage(prompt: string, options: ImageOptions) {
  const { apiKey, baseUrl } = config();
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ prompt: `${prompt}\nStyle: ${options.style}`, n: options.count, size: options.aspectRatio === "square" ? "1024x1024" : options.aspectRatio === "portrait" ? "1024x1536" : "1536x1024", quality: options.quality }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new ApiError(`Image provider returned an error (${response.status}).`, 502);
  const payload = await response.json() as { data?: { url?: string; b64_json?: string }[] };
  const images = payload.data?.map((item) => item.url || (item.b64_json ? `data:image/png;base64,${item.b64_json}` : "")).filter(Boolean) || [];
  if (!images.length) throw new ApiError("Image provider returned no usable images.", 502);
  return images;
}

export async function processImage(action: "describe" | "remove-background" | "enhance", file: File, instruction?: string) {
  const { apiKey, baseUrl } = config();
  const form = new FormData();
  form.append("image", file, file.name);
  if (instruction) form.append("prompt", instruction);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/images/${action}`, { method: "POST", headers: { authorization: `Bearer ${apiKey}` }, body: form, signal: AbortSignal.timeout(120_000) });
  } catch {
    throw new ApiError("The configured image provider could not be reached.", 502);
  }
  if (!response.ok) throw new ApiError(`Image provider does not support ${action} or returned an error (${response.status}).`, 502);
  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("image/")) {
    const bytes = Buffer.from(await response.arrayBuffer());
    return { image: `data:${contentType};base64,${bytes.toString("base64")}` };
  }
  const payload = await response.json() as { url?: string; data?: { url?: string }[]; prompt?: string; description?: string };
  return { image: payload.url || payload.data?.[0]?.url, prompt: payload.prompt || payload.description };
}