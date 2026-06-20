import { useApp } from '../../context/AppContext';
import TimelineView from '../../components/timeline/TimelineView';

export default function PatientTimeline() {
  const { state } = useApp();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Medical Timeline</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your complete medical history, organized chronologically. Every entry shows where it came from and whether it's been verified.
        </p>
      </div>

      <TimelineView
        nodes={state.timelineNodes}
        role="patient"
        availableFilters={['all', 'needs_review', 'verified', 'patient_reported', 'physician', 'documents_emr']}
      />
    </div>
  );
}
