export type AgentId = "research" | "content" | "study" | "business" | "multi-task";
export type AgentDefinition = { id: AgentId; name: string; description: string; tasks: string[] };

export const agents: AgentDefinition[] = [
  { id: "research", name: "Research Agent", description: "Structure a research request and produce a careful brief from the information you provide.", tasks: ["Research brief", "Key findings", "Open questions"] },
  { id: "content", name: "Content Agent", description: "Turn a subject into an outline, draft, metadata and social copy.", tasks: ["Topic and outline", "Article draft", "Title and meta description", "Social posts"] },
  { id: "study", name: "Study Agent", description: "Create a study outline, explanation, practice questions and a plan.", tasks: ["Study outline", "Concept explanation", "Practice questions", "Study plan"] },
  { id: "business", name: "Business Agent", description: "Shape an idea into a plan, market strategy and immediate next actions.", tasks: ["Idea assessment", "Market and revenue model", "Marketing strategy", "Risks and next steps"] },
  { id: "multi-task", name: "Multi-Task Agent", description: "Create a bounded multi-part deliverable with a visible task trail.", tasks: ["Understand and outline", "Draft main deliverable", "Create supporting assets", "Review and finalize"] },
];

export function getAgent(value: string) {
  return agents.find((agent) => agent.id === value);
}