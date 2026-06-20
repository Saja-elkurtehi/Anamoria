import { useState } from "react";
import { Chat } from "./components/Chat";
import { DocumentUploader } from "./components/DocumentUploader";

export default function App() {
  const [patientId, setPatientId] = useState(
    () => localStorage.getItem("patientId") ?? "",
  );
  const [inputId, setInputId] = useState(patientId);

  if (!patientId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h1 className="mb-1 text-xl font-semibold text-gray-900">Anamoria</h1>
          <p className="mb-6 text-sm text-gray-500">Enter your patient ID to continue.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = inputId.trim();
              if (!id) return;
              localStorage.setItem("patientId", id);
              setPatientId(id);
            }}
          >
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="Patient ID"
              className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-gray-900">Anamoria</h1>
        <div className="flex items-center gap-3">
          <DocumentUploader />
          <button
            onClick={() => {
              localStorage.removeItem("patientId");
              setPatientId("");
              setInputId("");
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Chat />
      </div>
    </div>
  );
}
