import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ParticipantList from './ParticipantList';
import ShareLink from '../Session/ShareLink';
import { Users, X, PhoneOff, Share2 } from 'lucide-react';
import { endSession } from '../../services/api';

const ChatWindow = ({ emit }) => {
  const { state, sessionEnded } = useChat();
  const { session, participant, participants, connectionStatus } = state;

  const [showParticipants, setShowParticipants] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [ending, setEnding] = useState(false);

  const isCreator = participant?.role === 'creator';
  const onlineCount = participants.filter((p) => p.status === 'online').length;
  const totalCount = participants.length;

  const handleEndSession = async () => {
    if (!window.confirm('End this chat? All messages and media will be permanently deleted.')) return;
    setEnding(true);
    try {
      await endSession(session.sessionToken);
    } catch (err) {
      // Session will be ended via socket event anyway
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="glass border-b border-white/5 px-4 py-3 flex items-center gap-3 flex-shrink-0 z-10">
        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-100 text-sm truncate">Ephemeral Chat</span>
            {session?.expiresAt && (
              <ExpiryBadge expiresAt={session.expiresAt} />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            You are <span className="text-violet-400">{participant?.temporaryName}</span>
            {isCreator && <span className="ml-1 text-amber-400/80">(creator)</span>}
          </p>
        </div>

        {/* Participant count */}
        <button
          onClick={() => setShowParticipants(true)}
          id="participants-toggle-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-light hover:bg-white/10 transition-colors text-sm"
        >
          <Users className="w-4 h-4 text-violet-400" />
          <span className="text-gray-300 font-medium">{onlineCount}/{session?.maxParticipants || '?'}</span>
        </button>

        {/* Share — available to everyone */}
        {session?.shareUrl && (
          <button
            onClick={() => setShowShare(true)}
            id="share-link-btn"
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}

        {/* End chat (creator only) */}
        {isCreator && (
          <button
            onClick={handleEndSession}
            disabled={ending}
            id="end-chat-btn"
            className="btn-danger py-1.5 px-3 text-xs"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{ending ? 'Ending...' : 'End Chat'}</span>
          </button>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageList emit={emit} />
          <MessageInput emit={emit} />
        </div>

        {/* Desktop participant sidebar */}
        <aside className="hidden lg:block w-60 glass border-l border-white/5 flex-shrink-0 overflow-y-auto">
          <ParticipantList />
        </aside>
      </div>

      {/* Mobile participant drawer */}
      {showParticipants && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setShowParticipants(false)} />
          <div className="w-64 glass border-l border-white/5 flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <span className="font-semibold text-gray-200 text-sm">Participants</span>
              <button onClick={() => setShowParticipants(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ParticipantList />
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShare && session?.shareUrl && (
        <ShareLink url={session.shareUrl} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
};

// Countdown badge
const ExpiryBadge = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setTimeLeft('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      const pad = (num) => num.toString().padStart(2, '0');
      setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-300 border border-violet-700/30 font-mono">
      {timeLeft}
    </span>
  );
};

export default ChatWindow;
