import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import useSocket from '../hooks/useSocket';
import ChatWindow from '../components/Chat/ChatWindow';
import SessionExpired from '../components/Session/SessionExpired';
import ConnectionStatus from '../components/UI/ConnectionStatus';

// ── Eviction screen ──────────────────────────────────────────────────────────
const EvictedScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4">
    <div className="card text-center max-w-sm w-full animate-slide-up">
      <div className="text-5xl mb-4">👋</div>
      <h1 className="text-xl font-bold text-gray-200 mb-2">You Were Removed</h1>
      <p className="text-gray-400 text-sm mb-2">
        You were disconnected for more than 30 seconds and were automatically removed from this chat.
      </p>
      <p className="text-xs text-gray-600 mb-6">
        All messages remain for other participants. You cannot rejoin with the same identity.
      </p>
      <a href="/" className="btn-primary w-full">Go Home</a>
    </div>
  </div>
);
// ─────────────────────────────────────────────────────────────────────────────

const Chat = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { state, setSession, setParticipant } = useChat();

  // Restore from sessionStorage if context was cleared (e.g. page refresh)
  useEffect(() => {
    const storedToken = sessionStorage.getItem('sessionToken');
    const storedParticipantId = sessionStorage.getItem('participantId');
    const storedParticipantToken = sessionStorage.getItem('participantToken');
    const storedName = sessionStorage.getItem('temporaryName');
    const storedShareUrl = sessionStorage.getItem('shareUrl');

    if (!state.session && storedToken === token && storedParticipantId) {
      setSession({
        sessionId: null,
        sessionToken: storedToken,
        status: 'active',
        shareUrl: storedShareUrl || `${window.location.origin}/chat/${storedToken}/join`,
      });
      setParticipant({
        participantId: storedParticipantId,
        participantToken: storedParticipantToken,
        temporaryName: storedName || 'Anonymous',
        role: 'participant',
      });
    } else if (!state.session && storedToken !== token) {
      navigate(`/chat/${token}/join`, { replace: true });
    }
  }, [token]); // eslint-disable-line

  const { participant, session } = state;
  const sessionToken = session?.sessionToken || token;
  const participantId = participant?.participantId;
  const participantToken = participant?.participantToken;

  // ── Always call hooks unconditionally (Rules of Hooks) ──
  const { emit } = useSocket({
    sessionToken,
    participantId,
    participantToken,
    enabled: !!(sessionToken && participantId && participantToken && !state.evicted),
  });

  // ── Conditional screens — all AFTER hooks ──

  // Eviction: participant was removed after 30-second grace period
  if (state.evicted) {
    return <EvictedScreen />;
  }

  // Session destroyed by creator or expired
  if (state.session?.status === 'destroyed') {
    return <SessionExpired />;
  }

  // Still loading credentials from sessionStorage
  if (!participant || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ConnectionStatus status={state.connectionStatus} />
      <ChatWindow emit={emit} />
    </div>
  );
};

export default Chat;

