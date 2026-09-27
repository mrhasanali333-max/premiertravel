export type ImageAction = "generate" | "describe" | "remove-background" | "enhance";
export type GeneratedImage = { url: string; prompt: string; createdAt?: unknown };