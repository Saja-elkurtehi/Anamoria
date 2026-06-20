import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

import RoleSelection from '../pages/RoleSelection';

import PatientLayout from '../components/layout/PatientLayout';
import PatientDashboard from '../pages/patient/PatientDashboard';
import PatientTimeline from '../pages/patient/PatientTimeline';
import PatientDocuments from '../pages/patient/PatientDocuments';
import PatientAccess from '../pages/patient/PatientAccess';

import PhysicianLayout from '../components/layout/PhysicianLayout';
import PhysicianList from '../pages/physician/PhysicianList';
import PhysicianPatientDetail from '../pages/physician/PhysicianPatientDetail';

function RequireRole({ role, children }: { role: 'patient' | 'physician'; children: React.ReactNode }) {
  const { state } = useApp();
  if (state.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Role selection */}
      <Route path="/" element={<RoleSelection />} />

      {/* Patient portal */}
      <Route path="/patient" element={
        <RequireRole role="patient">
          <PatientLayout><PatientDashboard /></PatientLayout>
        </RequireRole>
      } />
      <Route path="/patient/timeline" element={
        <RequireRole role="patient">
          <PatientLayout><PatientTimeline /></PatientLayout>
        </RequireRole>
      } />
      <Route path="/patient/documents" element={
        <RequireRole role="patient">
          <PatientLayout><PatientDocuments /></PatientLayout>
        </RequireRole>
      } />
      <Route path="/patient/access" element={
        <RequireRole role="patient">
          <PatientLayout><PatientAccess /></PatientLayout>
        </RequireRole>
      } />

      {/* Physician portal */}
      <Route path="/physician" element={
        <RequireRole role="physician">
          <PhysicianLayout><PhysicianList /></PhysicianLayout>
        </RequireRole>
      } />
      <Route path="/physician/patients/:patientId" element={
        <RequireRole role="physician">
          <PhysicianLayout><PhysicianPatientDetail /></PhysicianLayout>
        </RequireRole>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
