import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, ArrowLeft, Users } from 'lucide-react';
import { getSession, joinSession } from '../services/api';
import { useChat } from '../context/ChatContext';

const Join = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setSession, setParticipant } = useChat();

  const [sessionInfo, setSessionInfo] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  const [form, setForm] = useState({ temporaryName: '', pin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await getSession(token);
        if (data.status !== 'active') { setSessionError('This temporary chat has ended.'); return; }
        setSessionInfo(data);
      } catch (err) {
        if (err.status === 404)      setSessionError('Chat room not found.');
        else if (err.status === 410) setSessionError('This temporary chat has ended.');
        else                         setSessionError('Failed to load chat room.');
      } finally {
        setLoadingSession(false);
      }
    };
    fetchSession();
  }, [token]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.temporaryName.trim()) { setError('Please enter a display name.'); return; }

    setLoading(true);
    try {
      const { data } = await joinSession(token, {
        temporaryName: form.temporaryName.trim(),
        pin: form.pin || null,
      });

      sessionStorage.setItem('participantId',    data.participantId);
      sessionStorage.setItem('participantToken', data.participantToken);
      sessionStorage.setItem('sessionToken',     data.sessionToken);
      sessionStorage.setItem('temporaryName',    form.temporaryName.trim());
      sessionStorage.setItem('shareUrl',         `${window.location.origin}/chat/${data.sessionToken}/join`);

      setSession({
        sessionId:       data.sessionId,
        sessionToken:    data.sessionToken,
        expiresAt:       data.expiresAt,
        maxParticipants: sessionInfo?.maxParticipants,
        shareUrl:        `${window.location.origin}/chat/${data.sessionToken}/join`,
        status:          'active',
      });

      setParticipant({
        participantId:    data.participantId,
        participantToken: data.participantToken,
        temporaryName:    form.temporaryName.trim(),
        role:             'participant',
      });

      navigate(`/chat/${token}`);
    } catch (err) {
      const msgs = {
        FULL:         'This chat is currently full. Please try again later.',
        EXPIRED:      'This temporary chat has ended.',
        DESTROYED:    'This temporary chat has ended.',
        INVALID_PIN:  'Incorrect PIN. Please try again.',
        PIN_REQUIRED: 'A PIN is required to join this chat.',
      };
      setError(msgs[err.code] || err.message || 'Failed to join. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading ── */
  if (loadingSession) {
    return (
      <div className="z-page min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500
                          animate-spin shadow-[0_0_12px_rgba(139,92,246,0.35)]" />
          <p className="text-sm text-gray-500">Loading room…</p>
        </div>
      </div>
    );
  }

  /* ── Error / unavailable ── */
  if (sessionError) {
    return (
      <div className="z-page min-h-screen flex flex-col items-center justify-center px-4">
        <div className="card text-center max-w-sm w-full animate-scale-in">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-200 mb-2">Chat Unavailable</h1>
          <p className="text-gray-400 text-sm mb-6">{sessionError}</p>
          <a href="/" className="btn-primary w-full">Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="z-page min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">

        <a href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </a>

        <div className="card glow-violet">
          {/* Room meta */}
          <div className="mb-7">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/10
                            border border-cyan-500/20 flex items-center justify-center mb-4
                            shadow-[0_0_16px_rgba(14,165,233,0.20)]">
              <LogIn className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100 mb-1">Join Chat</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {sessionInfo?.participantCount}/{sessionInfo?.maxParticipants} participants
              </span>
              {sessionInfo?.pinEnabled && (
                <span className="text-xs text-amber-400/80 flex items-center gap-1 glass-1 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Lock className="w-3 h-3" /> PIN required
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" id="join-session-form">
            <div>
              <label className="label" htmlFor="temporaryName">
                <User className="w-3 h-3 inline mr-1.5 text-violet-400" />
                Your display name
              </label>
              <input
                id="temporaryName"
                name="temporaryName"
                type="text"
                maxLength={50}
                placeholder="e.g. Sam"
                className="input-field"
                value={form.temporaryName}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </div>

            {sessionInfo?.pinEnabled && (
              <div className="animate-slide-down">
                <label className="label" htmlFor="pin">
                  <Lock className="w-3 h-3 inline mr-1.5 text-violet-400" />
                  Room PIN
                </label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  placeholder="Enter PIN"
                  className="input-field"
                  value={form.pin}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>
            )}

            {error && (
              <div className="glass-1 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-300 animate-fade-in
                              shadow-[0_0_12px_rgba(239,68,68,0.12)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              id="join-submit-btn"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Joining...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Join Chat
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Join;
