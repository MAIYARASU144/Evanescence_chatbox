import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Zap, Shield, Clock, Trash2, Lock, Link2, LogIn, PlusCircle, Sparkles
} from 'lucide-react';

/* ── Feature card ── */
const Feature = ({ icon: Icon, title, description, delay = 0 }) => (
  <div
    className="glass-1 glass-shine rounded-2xl p-5 flex gap-4 animate-slide-up group
                hover:glass-2 transition-all duration-300
                hover:shadow-[0_0_0_1px_rgba(139,92,246,0.2),0_8px_32px_rgba(0,0,0,0.4)]"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    bg-gradient-to-br from-violet-500/20 to-indigo-500/10
                    border border-violet-500/20
                    group-hover:shadow-[0_0_12px_rgba(139,92,246,0.35)] transition-all duration-300">
      <Icon className="w-5 h-5 text-violet-400" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-200 mb-1 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  </div>
);

const Home = () => {
  const [joinLink, setJoinLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const navigate = useNavigate();

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setLinkError('');
    const trimmed = joinLink.trim();

    if (!trimmed) {
      setLinkError('Please enter a chat link or room code.');
      return;
    }

    let token = trimmed;
    try {
      if (trimmed.includes('/chat/')) {
        const match = trimmed.match(/\/chat\/([^/?#]+)/);
        if (match && match[1]) token = match[1];
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length > 0) {
          token = parts[parts.length - 1] === 'join' && parts.length > 1
            ? parts[parts.length - 2]
            : parts[parts.length - 1];
        }
      }
    } catch {}

    token = token.split('?')[0].split('#')[0];
    if (!token) { setLinkError('Invalid link or room code format.'); return; }
    navigate(`/chat/${token}/join`);
  };

  return (
    <div className="z-page min-h-screen flex flex-col items-center justify-center px-4 py-16">

      {/* ── Hero ── */}
      <div className="text-center mb-12 animate-slide-up">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                        glass-1 border border-violet-500/25 text-xs text-violet-300 font-medium mb-8
                        shadow-[0_0_12px_rgba(139,92,246,0.15)]">
          <Sparkles className="w-3.5 h-3.5" />
          No accounts. No history. No traces.
        </div>

        {/* Title */}
        <h1 className="text-6xl sm:text-7xl font-bold mb-5 tracking-tight leading-none">
          <span className="gradient-text">Ephemeral</span>
        </h1>

        {/* Sub */}
        <p className="text-xl text-gray-400 mb-3 max-w-md mx-auto leading-relaxed font-light">
          Private temporary chat rooms that self-destruct.
        </p>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          Share a link. Chat in real time. Walk away — everything disappears.
        </p>
      </div>

      {/* ── CTA card ── */}
      <div className="w-full max-w-xl mb-16 animate-slide-up" style={{ animationDelay: '80ms' }}>
        <div className="card glow-violet">
          {/* Create section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
                          pb-6 mb-6 border-b border-white/[0.06]">
            <div>
              <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2 mb-0.5">
                <PlusCircle className="w-4 h-4 text-violet-400" />
                Start a New Session
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Create a temporary room with optional PIN and custom duration.
              </p>
            </div>
            <Link
              to="/create"
              id="create-chat-btn"
              className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap w-full sm:w-auto text-center"
            >
              <MessageSquare className="w-4 h-4" />
              Create Room
            </Link>
          </div>

          {/* Join section */}
          <div>
            <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-cyan-400" />
              Join via Invite Link
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Received a link or room token? Paste it below to join directly.
            </p>

            <form onSubmit={handleJoinSubmit} className="space-y-2" id="join-by-link-form">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 text-gray-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    id="join-link-input"
                    placeholder="Paste link or token..."
                    className="input-field pl-10 text-sm py-2.5"
                    value={joinLink}
                    onChange={(e) => { setJoinLink(e.target.value); if (linkError) setLinkError(''); }}
                    autoComplete="off"
                  />
                </div>
                <button type="submit" id="join-link-btn" className="btn-secondary text-sm px-5 py-2.5 flex items-center justify-center gap-2 whitespace-nowrap">
                  <LogIn className="w-4 h-4 text-cyan-400" />
                  Join
                </button>
              </div>
              {linkError && (
                <p className="text-xs text-red-400 mt-1 ml-1 animate-fade-in">{linkError}</p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ── Features grid ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl w-full">
        <Feature icon={Shield}       title="No accounts needed"  delay={120} description="Just pick a temporary name and share a link. Zero registration required." />
        <Feature icon={Clock}        title="Auto-expires"         delay={160} description="Set a duration. When time's up, all messages and media are permanently deleted." />
        <Feature icon={Trash2}       title="True deletion"        delay={200} description="Server-side data is wiped — messages, media, and session tokens become invalid." />
        <Feature icon={Lock}         title="PIN protection"       delay={240} description="Optionally add a PIN so only invited people can join your room." />
        <Feature icon={Zap}          title="Real-time"            delay={280} description="Messages, typing indicators, and presence updates happen instantly via WebSocket." />
        <Feature icon={MessageSquare} title="Media sharing"       delay={320} description="Share images and videos. Media is stored securely and deleted with the session." />
      </div>

      {/* ── Privacy footnote ── */}
      <p className="mt-12 text-xs text-gray-700 text-center max-w-sm animate-fade-in" style={{ animationDelay: '400ms' }}>
        Files downloaded to your device cannot be remotely deleted. Only server-side copies are erased.
      </p>
    </div>
  );
};

export default Home;
