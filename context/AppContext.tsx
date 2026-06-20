import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  TimelineNode,
  Patient,
  MissingInfo,
  ChatMessage,
  ViewMode,
  AppMode,
  DataSource,
  VerificationStatus,
  PhysicianNote,
  Symptom,
} from '../types';
import {
  mockPatient,
  initialTimelineNodes,
  initialMissingInfo,
  initialChatMessages,
} from '../data/mockData';

interface FilterState {
  source?: DataSource;
  verificationStatus?: VerificationStatus;
}

interface AppState {
  mode: AppMode;

  patient: Patient;
  setPatient: (p: Patient) => void;

  timelineNodes: TimelineNode[];
  addTimelineNode: (node: TimelineNode) => void;
  updateTimelineNode: (nodeId: string, updates: Partial<TimelineNode>) => void;
  addPhysicianNote: (nodeId: string, note: PhysicianNote) => void;

  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  filters: FilterState;
  setFilters: (f: FilterState) => void;

  missingInfo: MissingInfo[];
  updateMissingInfo: (id: string, updates: Partial<MissingInfo>) => void;

  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;

  addSymptomFromChat: (symptom: Symptom, timelineNode: TimelineNode) => void;

  activePatientTab: string;
  setActivePatientTab: (tab: string) => void;

  activePhysicianTab: string;
  setActivePhysicianTab: (tab: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children, initialMode }: { children: React.ReactNode; initialMode: AppMode }) {
  const [patient, setPatient] = useState<Patient>(mockPatient);
  const [timelineNodes, setTimelineNodes] = useState<TimelineNode[]>(initialTimelineNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('BRIEF');
  const [filters, setFilters] = useState<FilterState>({});
  const [missingInfo, setMissingInfo] = useState<MissingInfo[]>(initialMissingInfo);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [activePatientTab, setActivePatientTab] = useState('timeline');
  const [activePhysicianTab, setActivePhysicianTab] = useState('summary');

  const addTimelineNode = useCallback((node: TimelineNode) => {
    setTimelineNodes((prev) =>
      [...prev, node].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    );
  }, []);

  const updateTimelineNode = useCallback((nodeId: string, updates: Partial<TimelineNode>) => {
    setTimelineNodes((prev) =>
      prev.map((n) => (n.nodeId === nodeId ? { ...n, ...updates } : n))
    );
  }, []);

  const addPhysicianNote = useCallback((nodeId: string, note: PhysicianNote) => {
    setTimelineNodes((prev) =>
      prev.map((n) =>
        n.nodeId === nodeId
          ? { ...n, physicianNotes: [...n.physicianNotes, note], verificationStatus: 'PHYSICIAN_VERIFIED' }
          : n
      )
    );
  }, []);

  const updateMissingInfo = useCallback((id: string, updates: Partial<MissingInfo>) => {
    setMissingInfo((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const addChatMessage = useCallback((msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
  }, []);

  const addSymptomFromChat = useCallback((symptom: Symptom, timelineNode: TimelineNode) => {
    setPatient((prev) => ({ ...prev, symptoms: [...prev.symptoms, symptom] }));
    setTimelineNodes((prev) =>
      [...prev, timelineNode].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        mode: initialMode,
        patient, setPatient,
        timelineNodes, addTimelineNode, updateTimelineNode, addPhysicianNote,
        selectedNodeId, setSelectedNodeId,
        viewMode, setViewMode,
        filters, setFilters,
        missingInfo, updateMissingInfo,
        chatMessages, addChatMessage,
        addSymptomFromChat,
        activePatientTab, setActivePatientTab,
        activePhysicianTab, setActivePhysicianTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
