import React, { createContext, useContext, useReducer, useCallback } from 'react';

const ChatContext = createContext(null);

const initialState = {
  // Session
  session: null,        // { sessionId, sessionToken, expiresAt, maxParticipants, status }
  participant: null,    // { participantId, participantToken, temporaryName, role }

  // Chat
  messages: [],
  participants: [],
  typingUsers: [],      // [{ participantId, temporaryName }]

  // Connection
  connectionStatus: 'disconnected', // 'connected' | 'disconnected' | 'reconnecting' | 'error'

  // Media
  uploadProgress: {},   // { [uploadId]: 0-100 }

  // UI
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload };

    case 'SET_PARTICIPANT':
      return { ...state, participant: action.payload };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };

    case 'ADD_MESSAGE':
      // Avoid duplicates by messageId
      if (state.messages.some((m) => m.messageId === action.payload.messageId)) {
        return state;
      }
      return { ...state, messages: [...state.messages, action.payload] };

    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };

    case 'UPDATE_PARTICIPANT_STATUS':
      return {
        ...state,
        participants: state.participants.map((p) =>
          p.participantId === action.payload.participantId
            ? { ...p, status: action.payload.status }
            : p
        ),
      };

    case 'ADD_PARTICIPANT':
      if (state.participants.some((p) => p.participantId === action.payload.participantId)) {
        return state;
      }
      return { ...state, participants: [...state.participants, { ...action.payload, status: 'online' }] };

    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter(
          (p) => p.participantId !== action.payload.participantId
        ),
        typingUsers: state.typingUsers.filter(
          (t) => t.participantId !== action.payload.participantId
        ),
      };

    case 'SET_TYPING_START': {
      if (state.typingUsers.some((t) => t.participantId === action.payload.participantId)) {
        return state;
      }
      return { ...state, typingUsers: [...state.typingUsers, action.payload] };
    }

    case 'SET_TYPING_STOP':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(
          (t) => t.participantId !== action.payload.participantId
        ),
      };

    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };

    case 'SET_UPLOAD_PROGRESS':
      return {
        ...state,
        uploadProgress: { ...state.uploadProgress, [action.payload.id]: action.payload.progress },
      };

    case 'CLEAR_UPLOAD_PROGRESS': {
      const { [action.payload]: _, ...rest } = state.uploadProgress;
      return { ...state, uploadProgress: rest };
    }

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SESSION_ENDED':
      return {
        ...initialState,
        session: { ...state.session, status: 'destroyed' },
        participant: state.participant,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setSession = useCallback((session) => dispatch({ type: 'SET_SESSION', payload: session }), []);
  const setParticipant = useCallback((participant) => dispatch({ type: 'SET_PARTICIPANT', payload: participant }), []);
  const setMessages = useCallback((messages) => dispatch({ type: 'SET_MESSAGES', payload: messages }), []);
  const addMessage = useCallback((message) => dispatch({ type: 'ADD_MESSAGE', payload: message }), []);
  const setParticipants = useCallback((participants) => dispatch({ type: 'SET_PARTICIPANTS', payload: participants }), []);
  const updateParticipantStatus = useCallback((data) => dispatch({ type: 'UPDATE_PARTICIPANT_STATUS', payload: data }), []);
  const addParticipant = useCallback((participant) => dispatch({ type: 'ADD_PARTICIPANT', payload: participant }), []);
  const removeParticipant = useCallback((data) => dispatch({ type: 'REMOVE_PARTICIPANT', payload: data }), []);
  const setTypingStart = useCallback((data) => dispatch({ type: 'SET_TYPING_START', payload: data }), []);
  const setTypingStop = useCallback((data) => dispatch({ type: 'SET_TYPING_STOP', payload: data }), []);
  const setConnectionStatus = useCallback((status) => dispatch({ type: 'SET_CONNECTION_STATUS', payload: status }), []);
  const setUploadProgress = useCallback((id, progress) => dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: { id, progress } }), []);
  const clearUploadProgress = useCallback((id) => dispatch({ type: 'CLEAR_UPLOAD_PROGRESS', payload: id }), []);
  const setError = useCallback((error) => dispatch({ type: 'SET_ERROR', payload: error }), []);
  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);
  const sessionEnded = useCallback(() => dispatch({ type: 'SESSION_ENDED' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <ChatContext.Provider
      value={{
        state,
        setSession,
        setParticipant,
        setMessages,
        addMessage,
        setParticipants,
        updateParticipantStatus,
        addParticipant,
        removeParticipant,
        setTypingStart,
        setTypingStop,
        setConnectionStatus,
        setUploadProgress,
        clearUploadProgress,
        setError,
        clearError,
        sessionEnded,
        reset,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
