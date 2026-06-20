import { AlertCircle, CheckCircle, MessageCircle, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const priorityConfig = {
  HIGH: { label: 'High', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  MEDIUM: { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

const statusConfig = {
  OPEN: { label: 'Open', icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> },
  ASKED: { label: 'Clarification sent', icon: <MessageCircle className="w-3.5 h-3.5 text-blue-500" /> },
  RESOLVED: { label: 'Resolved', icon: <CheckCircle className="w-3.5 h-3.5 text-green-500" /> },
};

export default function MissingInfoPanel() {
  const { missingInfo, updateMissingInfo, setSelectedNodeId } = useApp();

  const open = missingInfo.filter((m) => m.status !== 'RESOLVED');
  const resolved = missingInfo.filter((m) => m.status === 'RESOLVED');

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full scrollbar-thin">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-800 font-medium">
          These items are flagged as missing or uncertain in the patient record. Review and take action to improve record completeness.
        </p>
      </div>

      {/* Open items */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Flagged Items ({open.length})
        </h3>
        <div className="space-y-2">
          {open.map((item) => {
            const pCfg = priorityConfig[item.priority];
            const sCfg = statusConfig[item.status];
            return (
              <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {sCfg.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{item.description}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${pCfg.color}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${pCfg.dot}`} />
                        {pCfg.label} priority
                      </span>
                      <span className="text-xs text-gray-400">{sCfg.label}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-gray-50">
                  {item.relatedNodeId && (
                    <button
                      onClick={() => setSelectedNodeId(item.relatedNodeId!)}
                      className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium"
                    >
                      View node <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {item.status === 'OPEN' && (
                    <button
                      onClick={() => updateMissingInfo(item.id, { status: 'ASKED' })}
                      className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Ask patient to clarify
                    </button>
                  )}
                  <button
                    onClick={() => updateMissingInfo(item.id, { status: 'RESOLVED' })}
                    className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Mark reviewed
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Resolved ({resolved.length})</h3>
          <div className="space-y-2">
            {resolved.map((item) => (
              <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 opacity-60">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600 line-through">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {open.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
          <p className="text-sm font-medium text-gray-600">All items reviewed</p>
          <p className="text-xs mt-1">No outstanding missing information.</p>
        </div>
      )}
    </div>
  );
}
