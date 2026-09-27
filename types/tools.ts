export type WritingTool = "article" | "blog" | "email" | "cv" | "cover-letter" | "rewriter" | "grammar" | "translator" | "summarizer";
export type WritingOptions = { tool: WritingTool; tone: string; length: string; language: string };
export type StudyTool = "homework" | "notes" | "mcq" | "quiz" | "planner" | "explain";