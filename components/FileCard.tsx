"use client";

import { FileText, Trash2 } from "lucide-react";
import type { UserFile } from "@/types/files";

export function FileCard({ file, onDelete, deleting }: Readonly<{ file: UserFile; onDelete: (file: UserFile) => void; deleting: boolean }>) {
  const size = file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  return <article className="file-row workspace-card"><span className="file-icon"><FileText size={18} /></span><div className="file-info"><strong>{file.name}</strong><span>PDF · {size}</span></div><button className="icon-button" type="button" title="Delete file" aria-label={`Delete ${file.name}`} disabled={deleting} onClick={() => onDelete(file)}><Trash2 size={15} /></button></article>;
}