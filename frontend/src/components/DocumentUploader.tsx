import { useEffect, useRef, useState } from "react";
import { listDocuments, uploadDocument, type DocumentMeta } from "../api/documents";

export function DocumentUploader() {
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listDocuments().then(setDocs).catch(() => {});
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const doc = await uploadDocument(file);
        setDocs((prev) => [doc, ...prev]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        Documents{docs.length > 0 && <span className="font-medium text-blue-600">{docs.length}</span>}
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-8 z-20 w-80 rounded-xl border border-gray-100 bg-white shadow-lg">
            <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Uploaded Documents</span>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "+ Upload"}
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.txt,.md"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="mx-4 my-3 rounded-lg border-2 border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              Drop PDF or text files here, or click to browse
            </div>

            {error && (
              <p className="mx-4 mb-2 text-xs text-red-500">{error}</p>
            )}

            <ul className="max-h-48 overflow-y-auto pb-3">
              {docs.length === 0 ? (
                <li className="px-4 text-xs text-gray-400">No documents yet.</li>
              ) : (
                docs.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate">{doc.filename}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
