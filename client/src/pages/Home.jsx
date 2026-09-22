import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Zap, Shield, Clock, Trash2, Lock, Link2, LogIn, PlusCircle } from 'lucide-react';

const Feature = ({ icon: Icon, title, description }) => (
  <div className="glass-light rounded-xl p-5 flex gap-4 animate-fade-in">
    <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-violet-400" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-200 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
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

    // Extract token from full URL or use raw token string
    let token = trimmed;
    try {
      if (trimmed.includes('/chat/')) {
        const match = trimmed.match(/\/chat\/([^\/?#]+)/);
        if (match && match[1]) {
          token = match[1];
        }
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length > 0) {
          token = parts[parts.length - 1] === 'join' && parts.length > 1 ? parts[parts.length - 2] : parts[parts.length - 1];
        }
      }
    } catch (err) {
      // Fallback to original string if URL parsing fails
    }

    // Clean token from query params or hash fragments
    token = token.split('?')[0].split('#')[0];

    if (!token) {
      setLinkError('Invalid link or room code format.');
      return;
    }

    navigate(`/chat/${token}/join`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-xs text-violet-400 font-medium mb-6 border border-violet-500/20">
          <Zap className="w-3 h-3" />
          No accounts. No history. No traces.
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold mb-4 tracking-tight">
          <span className="gradient-text">Ephemeral</span>
        </h1>

        <p className="text-xl text-gray-400 mb-2 max-w-md mx-auto leading-relaxed">
          Private temporary chat rooms that self-destruct.
        </p>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          Share a link. Chat in real time. Walk away — everything disappears.
        </p>
      </div>

      {/* CTA Card with Create & Join Link options */}
      <div className="w-full max-w-xl mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="card p-6 flex flex-col gap-6 border border-white/10 shadow-2xl">
          {/* Create Chat Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-gray-800/80">
            <div>
              <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-violet-400" />
                Start a New Session
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Create a temporary room with optional PIN and custom duration.
              </p>
            </div>
            <Link to="/create" id="create-chat-btn" className="btn-primary text-sm px-6 py-2.5 whitespace-nowrap w-full sm:w-auto text-center flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Create Room
            </Link>
          </div>

          {/* Join Chat via Link Box */}
          <div>
            <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-cyan-400" />
              Join via Invite Link
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Received a link or room token? Paste it below to join directly.
            </p>
            
            <form onSubmit={handleJoinSubmit} className="space-y-2" id="join-by-link-form">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    id="join-link-input"
                    placeholder="Paste link e.g. http://localhost:5173/chat/abc... or token"
                    className="input-field pl-10 text-sm py-2.5"
                    value={joinLink}
                    onChange={(e) => {
                      setJoinLink(e.target.value);
                      if (linkError) setLinkError('');
                    }}
                    autoComplete="off"
                  />
                </div>
                <button type="submit" id="join-link-btn" className="btn-secondary text-sm px-5 py-2.5 flex items-center justify-center gap-2 whitespace-nowrap">
                  <LogIn className="w-4 h-4 text-cyan-400" />
                  Join
                </button>
              </div>
              {linkError && (
                <p className="text-xs text-red-400 mt-1 ml-1">{linkError}</p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl w-full animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <Feature
          icon={Shield}
          title="No accounts needed"
          description="Just pick a temporary name and share a link. Zero registration required."
        />
        <Feature
          icon={Clock}
          title="Auto-expires"
          description="Set a duration. When time's up, all messages and media are permanently deleted."
        />
        <Feature
          icon={Trash2}
          title="True deletion"
          description="Server-side data is wiped — messages, media, and session tokens become invalid."
        />
        <Feature
          icon={Lock}
          title="PIN protection"
          description="Optionally add a PIN so only invited people can join your room."
        />
        <Feature
          icon={Zap}
          title="Real-time"
          description="Messages, typing indicators, and presence updates happen instantly via WebSocket."
        />
        <Feature
          icon={MessageSquare}
          title="Media sharing"
          description="Share images and videos. Media is stored securely and deleted with the session."
        />
      </div>

      {/* Privacy note */}
      <p className="mt-12 text-xs text-gray-700 text-center max-w-sm">
        Files downloaded to your device cannot be remotely deleted. Only server-side copies are erased.
      </p>
    </div>
  );
};

export default Home;
