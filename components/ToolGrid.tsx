"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { arrayRemove, arrayUnion, doc, onSnapshot, setDoc } from "firebase/firestore";
import { ArrowUpRight, Search, Star } from "lucide-react";
import { tools, type AITool } from "@/lib/tools";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";

const categories = ["All", ...Array.from(new Set(tools.map((tool) => tool.category)))];

export function ToolGrid() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !db) { setFavorites([]); return; }
    return onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      const list = snapshot.data()?.favoriteTools;
      setFavorites(Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : []);
    }, () => setFavorites([]));
  }, [user]);

  const filtered = useMemo(() => tools.filter((tool) => (category === "All" || tool.category === category) && `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(search.trim().toLowerCase())), [category, search]);

  async function toggleFavorite(tool: AITool) {
    if (!user || !db) return;
    const reference = doc(db, "users", user.uid);
    const isFavorite = favorites.includes(tool.id);
    await setDoc(reference, { userId: user.uid, favoriteTools: isFavorite ? arrayRemove(tool.id) : arrayUnion(tool.id), updatedAt: new Date() }, { merge: true });
  }

  return <>
    <div className="tool-discovery"><label className="tool-search"><Search size={16} /><input aria-label="Search AI tools" placeholder="Search tools" value={search} onChange={(event) => setSearch(event.target.value)} /></label><div className="tool-filters" aria-label="Filter tools by category">{categories.map((item) => <button className={category === item ? "active" : ""} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}</div></div>
    {filtered.length ? <div className="tool-grid">{filtered.map((tool) => { const Icon = tool.icon; const favorite = favorites.includes(tool.id); return <article className="discovery-card" key={tool.id}><Link className="discovery-main" href={tool.route}><span className="tool-icon"><Icon size={18} /></span><span className="tool-category">{tool.category}</span><h2>{tool.name}</h2><p>{tool.description}</p><span className="discovery-open">Open tool <ArrowUpRight size={14} /></span></Link>{user && <button className={`favorite-toggle ${favorite ? "active" : ""}`} type="button" aria-label={favorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`} title={favorite ? "Remove favorite" : "Favorite tool"} onClick={() => void toggleFavorite(tool)}><Star size={16} fill={favorite ? "currentColor" : "none"} /></button>}</article>; })}</div> : <div className="workspace-card empty-state"><strong>No tools found</strong>Try another search or category.</div>}
  </>;
}