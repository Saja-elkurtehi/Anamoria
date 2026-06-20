import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import type {
  Role,
  TimelineNode,
  UploadedDoc,
  AccessRequest,
  MissingInfoItem,
  PhysicianNote,
  ChatMessage,
} from '../types';
import {
  seedTimelineNodes,
  seedDocuments,
  seedAccessRequests,
  seedMissingInfo,
  initialChatMessages,
} from '../data/mockData';

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  role: Role | null;
  timelineNodes: TimelineNode[];
  documents: UploadedDoc[];
  accessRequests: AccessRequest[];
  missingInfo: MissingInfoItem[];
  chatMessages: ChatMessage[];
}

const STORAGE_KEY = 'anamoria_demo_state';

function getInitialState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as AppState;
  } catch {
    /* ignore */
  }
  return {
    role: null,
    timelineNodes: seedTimelineNodes,
    documents: seedDocuments,
    accessRequests: seedAccessRequests,
    missingInfo: seedMissingInfo,
    chatMessages: initialChatMessages,
  };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_ROLE'; payload: Role | null }
  | { type: 'ADD_TIMELINE_NODE'; payload: TimelineNode }
  | { type: 'UPDATE_TIMELINE_NODE'; payload: { nodeId: string; updates: Partial<TimelineNode> } }
  | { type: 'ADD_PHYSICIAN_NOTE'; payload: { nodeId: string; note: PhysicianNote; newNode?: TimelineNode } }
  | { type: 'ADD_DOCUMENT'; payload: UploadedDoc }
  | { type: 'RESPOND_ACCESS_REQUEST'; payload: { requestId: string; status: 'APPROVED' | 'DENIED' } }
  | { type: 'UPDATE_MISSING_INFO'; payload: { id: string; status: MissingInfoItem['status'] } }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'RESET_DEMO' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.payload };

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
          ? {
              ...n,
              physicianNotes: [...n.physicianNotes, action.payload.note],
              updatedAt: new Date().toISOString(),
            }
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

    case 'RESET_DEMO':
      return {
        role: null,
        timelineNodes: seedTimelineNodes,
        documents: seedDocuments,
        accessRequests: seedAccessRequests,
        missingInfo: seedMissingInfo,
        chatMessages: initialChatMessages,
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  setRole: (role: Role | null) => void;
  addTimelineNode: (node: TimelineNode) => void;
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
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const setRole = useCallback((role: Role | null) => dispatch({ type: 'SET_ROLE', payload: role }), []);
  const addTimelineNode = useCallback((node: TimelineNode) => dispatch({ type: 'ADD_TIMELINE_NODE', payload: node }), []);
  const updateTimelineNode = useCallback((nodeId: string, updates: Partial<TimelineNode>) =>
    dispatch({ type: 'UPDATE_TIMELINE_NODE', payload: { nodeId, updates } }), []);
  const addPhysicianNote = useCallback((nodeId: string, note: PhysicianNote, newNode?: TimelineNode) =>
    dispatch({ type: 'ADD_PHYSICIAN_NOTE', payload: { nodeId, note, newNode } }), []);
  const addDocument = useCallback((doc: UploadedDoc) => dispatch({ type: 'ADD_DOCUMENT', payload: doc }), []);
  const respondAccessRequest = useCallback((requestId: string, status: 'APPROVED' | 'DENIED') =>
    dispatch({ type: 'RESPOND_ACCESS_REQUEST', payload: { requestId, status } }), []);
  const updateMissingInfo = useCallback((id: string, status: MissingInfoItem['status']) =>
    dispatch({ type: 'UPDATE_MISSING_INFO', payload: { id, status } }), []);
  const addChatMessage = useCallback((msg: ChatMessage) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: msg }), []);
  const resetDemo = useCallback(() => {
    dispatch({ type: 'RESET_DEMO' });
    localStorage.removeItem('anamoria_demo_state');
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
