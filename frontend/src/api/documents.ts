import { TOKEN_KEY } from "../services/api";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function authHeader() {
  return `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ""}`;
}

export interface DocumentMeta {
  id: string;
  filename: string;
  created_at: string;
}

export async function uploadDocument(file: File): Promise<DocumentMeta> {
  const body = new FormData();
  body.append("file", file);

  const res = await fetch(`${BASE}/documents/upload`, {
    method: "POST",
    headers: { Authorization: authHeader() },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
}

export async function listDocuments(): Promise<DocumentMeta[]> {
  const res = await fetch(`${BASE}/documents`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}
