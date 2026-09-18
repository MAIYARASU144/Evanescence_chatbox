import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, ArrowLeft } from 'lucide-react';
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

  // Fetch session info to know if PIN is required
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await getSession(token);
        if (data.status !== 'active') {
          setSessionError('This temporary chat has ended.');
          return;
        }
        setSessionInfo(data);
      } catch (err) {
        if (err.status === 404) setSessionError('Chat room not found.');
        else if (err.status === 410) setSessionError('This temporary chat has ended.');
        else setSessionError('Failed to load chat room.');
      } finally {
        setLoadingSession(false);
      }
    };
    fetchSession();
  }, [token]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.temporaryName.trim()) {
      setError('Please enter a display name.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await joinSession(token, {
        temporaryName: form.temporaryName.trim(),
        pin: form.pin || null,
      });

      // Persist credentials
      sessionStorage.setItem('participantId', data.participantId);
      sessionStorage.setItem('participantToken', data.participantToken);
      sessionStorage.setItem('sessionToken', data.sessionToken);
      sessionStorage.setItem('temporaryName', form.temporaryName.trim());

      setSession({
        sessionId: data.sessionId,
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt,
        maxParticipants: sessionInfo?.maxParticipants,
        status: 'active',
      });

      setParticipant({
        participantId: data.participantId,
        participantToken: data.participantToken,
        temporaryName: form.temporaryName.trim(),
        role: 'participant',
      });

      navigate(`/chat/${token}`);
    } catch (err) {
      const msgs = {
        FULL: 'This chat is currently full. Please try again later.',
        EXPIRED: 'This temporary chat has ended.',
        DESTROYED: 'This temporary chat has ended.',
        INVALID_PIN: 'Incorrect PIN. Please try again.',
        PIN_REQUIRED: 'A PIN is required to join this chat.',
      };
      setError(msgs[err.code] || err.message || 'Failed to join. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="card text-center max-w-sm w-full animate-slide-up">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-200 mb-2">Chat Unavailable</h1>
          <p className="text-gray-400 text-sm mb-6">{sessionError}</p>
          <a href="/" className="btn-primary w-full">Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </a>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-100 mb-1">Join Chat</h1>
          <p className="text-sm text-gray-500 mb-1">
            Temporary room ·{' '}
            {sessionInfo?.participantCount}/{sessionInfo?.maxParticipants} participants
          </p>
          {sessionInfo?.pinEnabled && (
            <p className="text-xs text-amber-400/80 mb-4 flex items-center gap-1">
              <Lock className="w-3 h-3" /> PIN required
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 mt-4" id="join-session-form">
            <div>
              <label className="label" htmlFor="temporaryName">
                <User className="w-3.5 h-3.5 inline mr-1.5 text-violet-400" />
                Your temporary display name
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
              <div className="animate-fade-in">
                <label className="label" htmlFor="pin">
                  <Lock className="w-3.5 h-3.5 inline mr-1.5 text-violet-400" />
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
              <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 text-sm text-red-300 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              id="join-submit-btn"
              disabled={loading}
              className="btn-primary w-full"
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
