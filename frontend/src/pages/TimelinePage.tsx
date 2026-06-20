import { useEffect, useState } from 'react';
import { timelineService } from '../services/timelineService';
import type { TimelineNode } from '../../../shared/types';

const DEMO_PATIENT = 'pat-001';

export default function TimelinePage() {
  const [nodes, setNodes] = useState<TimelineNode[]>([]);

  useEffect(() => {
    timelineService.getForPatient(DEMO_PATIENT).then(setNodes).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Timeline</h1>
      <p className="text-gray-500 mb-8">
        This will become the interactive source-labelled medical timeline with node detail panels, physician verification, and filtering.
      </p>

      <div className="flex flex-col gap-3 max-w-2xl">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
          {nodes.length} nodes loaded from API
        </p>
        {nodes
          .slice()
          .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
          .map(n => (
            <div key={n.nodeId} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-gray-900">{n.title}</p>
                <span className="text-xs text-gray-400">{n.eventDate}</span>
              </div>
              <p className="text-sm text-gray-500">{n.summary}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{n.sourceType}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{n.verificationStatus}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{n.category}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
