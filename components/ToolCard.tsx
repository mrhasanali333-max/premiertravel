import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function ToolCard({ title, description, href, icon: Icon }: Readonly<{ title: string; description: string; href: string; icon: LucideIcon }>) {
  return <Link className="tool-card" href={href}><span className="tool-icon"><Icon size={18} /></span><h3>{title}</h3><p>{description}</p></Link>;
}