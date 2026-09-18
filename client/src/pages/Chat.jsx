import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import useSocket from '../hooks/useSocket';
import ChatWindow from '../components/Chat/ChatWindow';
import SessionExpired from '../components/Session/SessionExpired';
import ConnectionStatus from '../components/UI/ConnectionStatus';

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

    if (!state.session && storedToken === token && storedParticipantId) {
      setSession({
        sessionId: null, // will be set by session:state socket event
        sessionToken: storedToken,
        status: 'active',
      });
      setParticipant({
        participantId: storedParticipantId,
        participantToken: storedParticipantToken,
        temporaryName: storedName || 'Anonymous',
        role: 'participant', // will be corrected from server state
      });
    } else if (!state.session && storedToken !== token) {
      // No credentials for this session — redirect to join
      navigate(`/chat/${token}/join`, { replace: true });
    }
  }, [token]); // eslint-disable-line

  const { participant, session } = state;
  const sessionToken = session?.sessionToken || token;
  const participantId = participant?.participantId;
  const participantToken = participant?.participantToken;

  // Initialize socket
  const { emit } = useSocket({
    sessionToken,
    participantId,
    participantToken,
    enabled: !!(sessionToken && participantId && participantToken),
  });

  // Session destroyed
  if (state.session?.status === 'destroyed') {
    return <SessionExpired />;
  }

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
