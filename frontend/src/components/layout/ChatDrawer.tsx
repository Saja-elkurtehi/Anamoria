import { useEffect, useRef } from 'react';
import { X, Bot, AlertTriangle } from 'lucide-react';
import { Chat } from '../Chat';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChatDrawer({ open, onClose }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className={`fixed inset-0 z-30 bg-black/30 transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-40 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-teal-50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Intake Assistant</p>
              <p className="text-xs text-teal-700">Powered by Cohere</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-teal-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100 flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Organizes and records information only — does not diagnose or give medical advice.
          </p>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-hidden">
          <Chat />
        </div>
      </div>
    </>
  );
}
