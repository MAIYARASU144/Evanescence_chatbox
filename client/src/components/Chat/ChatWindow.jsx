import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ParticipantList from './ParticipantList';
import ShareLink from '../Session/ShareLink';
import { Users, X, PhoneOff, Share2, Timer } from 'lucide-react';
import { endSession } from '../../services/api';

const ChatWindow = ({ emit }) => {
  const { state } = useChat();
  const { session, participant, participants } = state;

  const [showParticipants, setShowParticipants] = useState(false);
  const [showShare, setShowShare]               = useState(false);
  const [ending, setEnding]                     = useState(false);

  const isCreator  = participant?.role === 'creator';
  const onlineCount = participants.filter((p) => p.status === 'online').length;

  const handleEndSession = async () => {
    if (!window.confirm('End this chat? All messages and media will be permanently deleted.')) return;
    setEnding(true);
    try { await endSession(session.sessionToken); } catch {}
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden z-page">

      {/* ── Header ── */}
      <header className="glass-2 border-b border-white/[0.07] px-4 py-3
                         flex items-center gap-3 flex-shrink-0 z-10
                         shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
        {/* Shimmer bar overlay */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-100 text-sm">Ephemeral Chat</span>
            {session?.expiresAt && <ExpiryBadge expiresAt={session.expiresAt} />}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            You are{' '}
            <span className="text-violet-400 font-medium">{participant?.temporaryName}</span>
            {isCreator && <span className="ml-1 text-amber-400/80">(creator)</span>}
          </p>
        </div>

        {/* Participant count pill */}
        <button
          onClick={() => setShowParticipants(true)}
          id="participants-toggle-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-1
                     hover:glass-2 transition-all duration-200 text-sm
                     border border-white/[0.06] hover:border-violet-500/25"
        >
          <Users className="w-4 h-4 text-violet-400" />
          <span className="text-gray-300 font-medium tabular-nums">
            {onlineCount}/{session?.maxParticipants || '?'}
          </span>
        </button>

        {/* Share button */}
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
            <span className="hidden sm:inline">{ending ? 'Ending…' : 'End Chat'}</span>
          </button>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageList emit={emit} />
          <MessageInput emit={emit} />
        </div>

        {/* Desktop participant sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-60 glass-1 border-l border-white/[0.06] flex-shrink-0 overflow-y-auto">
          <ParticipantList />
        </aside>
      </div>

      {/* ── Mobile participant drawer ── */}
      {showParticipants && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setShowParticipants(false)} />
          <div className="w-64 glass-3 border-l border-white/[0.08] flex flex-col animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <span className="font-semibold text-gray-200 text-sm">Participants</span>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:glass-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ParticipantList />
            </div>
          </div>
        </div>
      )}

      {/* ── Share modal ── */}
      {showShare && session?.shareUrl && (
        <ShareLink url={session.shareUrl} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
};

/* ── Countdown badge ── */
const ExpiryBadge = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = React.useState('');
  const [urgent, setUrgent] = React.useState(false);

  React.useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setTimeLeft('00:00:00'); return; }
      setUrgent(diff < 5 * 60 * 1000); // < 5 min
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const pad = (n) => n.toString().padStart(2, '0');
      setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-mono
                      glass-1 border transition-colors duration-500
                      ${urgent
                        ? 'text-red-300 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                        : 'text-violet-300 border-violet-700/30'}`}>
      <Timer className="w-2.5 h-2.5" />
      {timeLeft}
    </span>
  );
};

export default ChatWindow;
