import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import api from '../services/api';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    api.get('/api/health')
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('error'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8 p-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Anamoria</h1>
      </div>

      <p className="text-gray-500 text-center max-w-md">
        Patient-centred medical history, organized and verified.
        <br />
        Select a portal to continue.
      </p>

      <div className="flex gap-4">
        <Link
          to="/patient"
          className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          Patient Portal
        </Link>
        <Link
          to="/physician"
          className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors"
        >
          Physician Dashboard
        </Link>
      </div>

      <div className={`text-sm px-3 py-1.5 rounded-full font-medium ${
        apiStatus === 'ok'
          ? 'bg-green-100 text-green-700'
          : apiStatus === 'error'
          ? 'bg-red-100 text-red-600'
          : 'bg-gray-100 text-gray-500'
      }`}>
        API: {apiStatus === 'checking' ? 'connecting…' : apiStatus === 'ok' ? 'connected' : 'unreachable'}
      </div>
    </div>
  );
}
