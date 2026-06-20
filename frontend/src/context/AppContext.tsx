import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import type {
  Role,
  Patient,
  PhysicianPatientSummary,
  TimelineNode,
  UploadedDoc,
  AccessRequest,
  MissingInfoItem,
  PhysicianNote,
  ChatMessage,
} from '../types';
import { seedMissingInfo, initialChatMessages, DEMO_PATIENT_ID, DEMO_PHYSICIAN_ID } from '../data/mockData';
import { TOKEN_KEY } from '../services/api';
import { patientService } from '../services/patientService';
import { timelineService } from '../services/timelineService';
import { accessService } from '../services/accessService';
import { physicianService } from '../services/physicianService';

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  role: Role | null;
  isLoading: boolean;
  patient: Patient | null;
  patientList: PhysicianPatientSummary[];
  timelineNodes: TimelineNode[];
  documents: UploadedDoc[];
  accessRequests: AccessRequest[];
  missingInfo: MissingInfoItem[];
  chatMessages: ChatMessage[];
}

const initialState: AppState = {
  role: null,
  isLoading: false,
  patient: null,
  patientList: [],
  timelineNodes: [],
  documents: [],
  accessRequests: [],
  missingInfo: seedMissingInfo,
  chatMessages: initialChatMessages,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_ROLE'; payload: Role | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_PATIENT_DATA'; payload: { patient: Patient; timelineNodes: TimelineNode[]; documents: UploadedDoc[]; accessRequests: AccessRequest[] } }
  | { type: 'LOAD_PHYSICIAN_DATA'; payload: { patientList: PhysicianPatientSummary[] } }
  | { type: 'ADD_TIMELINE_NODE'; payload: TimelineNode }
  | { type: 'UPDATE_TIMELINE_NODE'; payload: { nodeId: string; updates: Partial<TimelineNode> } }
  | { type: 'ADD_PHYSICIAN_NOTE'; payload: { nodeId: string; note: PhysicianNote; newNode?: TimelineNode } }
  | { type: 'ADD_DOCUMENT'; payload: UploadedDoc }
  | { type: 'RESPOND_ACCESS_REQUEST'; payload: { requestId: string; status: 'APPROVED' | 'DENIED' } }
  | { type: 'UPDATE_MISSING_INFO'; payload: { id: string; status: MissingInfoItem['status'] } }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOAD_PATIENT_DATA':
      return {
        ...state,
        isLoading: false,
        patient: action.payload.patient,
        timelineNodes: action.payload.timelineNodes,
        documents: action.payload.documents,
        accessRequests: action.payload.accessRequests,
      };

    case 'LOAD_PHYSICIAN_DATA':
      return { ...state, isLoading: false, patientList: action.payload.patientList };

    case 'ADD_TIMELINE_NODE':
      return { ...state, timelineNodes: [action.payload, ...state.timelineNodes] };

    case 'UPDATE_TIMELINE_NODE':
      return {
        ...state,
        timelineNodes: state.timelineNodes.map(n =>
          n.nodeId === action.payload.nodeId
            ? { ...n, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : n
        ),
      };

    case 'ADD_PHYSICIAN_NOTE': {
      const updated = state.timelineNodes.map(n =>
        n.nodeId === action.payload.nodeId
          ? { ...n, physicianNotes: [...n.physicianNotes, action.payload.note], updatedAt: new Date().toISOString() }
          : n
      );
      if (action.payload.newNode) {
        return { ...state, timelineNodes: [action.payload.newNode, ...updated] };
      }
      return { ...state, timelineNodes: updated };
    }

    case 'ADD_DOCUMENT':
      return { ...state, documents: [action.payload, ...state.documents] };

    case 'RESPOND_ACCESS_REQUEST':
      return {
        ...state,
        accessRequests: state.accessRequests.map(r =>
          r.requestId === action.payload.requestId
            ? { ...r, status: action.payload.status, respondedAt: new Date().toISOString() }
            : r
        ),
      };

    case 'UPDATE_MISSING_INFO':
      return {
        ...state,
        missingInfo: state.missingInfo.map(m =>
          m.id === action.payload.id ? { ...m, status: action.payload.status } : m
        ),
      };

    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };

    case 'RESET':
      return { ...initialState, missingInfo: seedMissingInfo, chatMessages: initialChatMessages };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  setRole: (role: Role | null) => void;
  addTimelineNode: (node: TimelineNode, persist?: boolean) => void;
  updateTimelineNode: (nodeId: string, updates: Partial<TimelineNode>) => void;
  addPhysicianNote: (nodeId: string, note: PhysicianNote, newNode?: TimelineNode) => void;
  addDocument: (doc: UploadedDoc) => void;
  respondAccessRequest: (requestId: string, status: 'APPROVED' | 'DENIED') => void;
  updateMissingInfo: (id: string, status: MissingInfoItem['status']) => void;
  addChatMessage: (msg: ChatMessage) => void;
  resetDemo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Load data from backend ────────────────────────────────────────────────

  const loadPatientData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [patient, timelineNodes, documents, accessRequests] = await Promise.all([
        patientService.getMe(),
        timelineService.getMyTimeline(),
        patientService.getDocuments(),
        accessService.getMyRequests(),
      ]);
      dispatch({ type: 'LOAD_PATIENT_DATA', payload: { patient, timelineNodes, documents, accessRequests } });
    } catch (err) {
      console.error('Failed to load patient data:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadPhysicianData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const patientList = await physicianService.getPatients();
      dispatch({ type: 'LOAD_PHYSICIAN_DATA', payload: { patientList } });
    } catch (err) {
      console.error('Failed to load physician data:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // ── Restore session on mount ──────────────────────────────────────────────

  useEffect(() => {
    const savedRole = localStorage.getItem('anamoria_role') as Role | null;
    if (savedRole) {
      dispatch({ type: 'SET_ROLE', payload: savedRole });
      if (savedRole === 'patient') loadPatientData();
      else if (savedRole === 'physician') loadPhysicianData();
    }
  }, [loadPatientData, loadPhysicianData]);

  // ── Context actions ───────────────────────────────────────────────────────

  const setRole = useCallback((role: Role | null) => {
    dispatch({ type: 'SET_ROLE', payload: role });
    if (role === 'patient') {
      localStorage.setItem(TOKEN_KEY, DEMO_PATIENT_ID);
      localStorage.setItem('anamoria_role', 'patient');
      loadPatientData();
    } else if (role === 'physician') {
      localStorage.setItem(TOKEN_KEY, DEMO_PHYSICIAN_ID);
      localStorage.setItem('anamoria_role', 'physician');
      loadPhysicianData();
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('anamoria_role');
    }
  }, [loadPatientData, loadPhysicianData]);

  const addTimelineNode = useCallback((node: TimelineNode, persist = true) => {
    dispatch({ type: 'ADD_TIMELINE_NODE', payload: node });
    if (persist) {
      const role = state.role;
      if (role === 'patient') {
        timelineService.addPatientNode(node).catch(console.error);
      } else if (role === 'physician' && node.patientId) {
        timelineService.addPhysicianNode(node.patientId, node).catch(console.error);
      }
    }
  }, [state.role]);

  const updateTimelineNode = useCallback((nodeId: string, updates: Partial<TimelineNode>) =>
    dispatch({ type: 'UPDATE_TIMELINE_NODE', payload: { nodeId, updates } }), []);

  const addPhysicianNote = useCallback((nodeId: string, note: PhysicianNote, newNode?: TimelineNode) =>
    dispatch({ type: 'ADD_PHYSICIAN_NOTE', payload: { nodeId, note, newNode } }), []);

  const addDocument = useCallback((doc: UploadedDoc) =>
    dispatch({ type: 'ADD_DOCUMENT', payload: doc }), []);

  const respondAccessRequest = useCallback((requestId: string, status: 'APPROVED' | 'DENIED') => {
    dispatch({ type: 'RESPOND_ACCESS_REQUEST', payload: { requestId, status } });
    accessService.respond(requestId, status).catch(console.error);
  }, []);

  const updateMissingInfo = useCallback((id: string, status: MissingInfoItem['status']) =>
    dispatch({ type: 'UPDATE_MISSING_INFO', payload: { id, status } }), []);

  const addChatMessage = useCallback((msg: ChatMessage) =>
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: msg }), []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('anamoria_role');
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      setRole,
      addTimelineNode,
      updateTimelineNode,
      addPhysicianNote,
      addDocument,
      respondAccessRequest,
      updateMissingInfo,
      addChatMessage,
      resetDemo,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
