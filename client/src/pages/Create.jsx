import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Users, Clock, Lock, Plus } from 'lucide-react';
import { createSession } from '../services/api';
import { useChat } from '../context/ChatContext';



const Create = () => {
  const navigate = useNavigate();
  const { setSession, setParticipant } = useChat();

  const [form, setForm] = useState({
    temporaryName: '',
    maxParticipants: 10,
    expiryHours: 2,
    expiryMinutes: 0,
    pin: '',
    pinEnabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.temporaryName.trim()) {
      setError('Please enter a display name.');
      return;
    }

    const totalHours = parseInt(form.expiryHours || 0, 10) + parseInt(form.expiryMinutes || 0, 10) / 60;
    if (totalHours < 0.016) {
      setError('Session duration must be at least 1 minute.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await createSession({
        temporaryName: form.temporaryName.trim(),
        maxParticipants: parseInt(form.maxParticipants, 10),
        expiresInHours: totalHours,
        pin: form.pinEnabled ? form.pin : null,
      });

      // Persist credentials in sessionStorage (clears when tab closes)
      sessionStorage.setItem('participantId', data.participantId);
      sessionStorage.setItem('participantToken', data.participantToken);
      sessionStorage.setItem('sessionToken', data.sessionToken);
      sessionStorage.setItem('temporaryName', form.temporaryName.trim());
      sessionStorage.setItem('shareUrl', data.shareUrl || `${window.location.origin}/chat/${data.sessionToken}/join`);

      setSession({
        sessionId: data.sessionId,
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt,
        maxParticipants: parseInt(form.maxParticipants, 10),
        shareUrl: data.shareUrl,
        pinEnabled: data.pinEnabled,
        status: 'active',
      });

      setParticipant({
        participantId: data.participantId,
        participantToken: data.participantToken,
        temporaryName: form.temporaryName.trim(),
        role: 'creator',
      });

      navigate(`/chat/${data.sessionToken}`);
    } catch (err) {
      setError(err.message || 'Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        {/* Back */}
        <a href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </a>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-100 mb-1">Create a Chat</h1>
          <p className="text-sm text-gray-500 mb-6">Set up your temporary private room.</p>

          <form onSubmit={handleSubmit} className="space-y-5" id="create-session-form">
            {/* Display name */}
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
                placeholder="e.g. Alex"
                className="input-field"
                value={form.temporaryName}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </div>

            {/* Max participants */}
            <div>
              <label className="label" htmlFor="maxParticipants">
                <Users className="w-3.5 h-3.5 inline mr-1.5 text-violet-400" />
                Maximum participants
              </label>
              <input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min={2}
                max={50}
                className="input-field"
                value={form.maxParticipants}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-gray-600 mt-1">Between 2 and 50</p>
            </div>

            {/* Expiry */}
            <div>
              <label className="label">
                <Clock className="w-3.5 h-3.5 inline mr-1.5 text-violet-400" />
                Session expires after
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      id="expiryHours"
                      name="expiryHours"
                      type="number"
                      min={0}
                      max={48}
                      className="input-field pr-12"
                      value={form.expiryHours}
                      onChange={handleChange}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">hrs</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      id="expiryMinutes"
                      name="expiryMinutes"
                      type="number"
                      min={0}
                      max={59}
                      className="input-field pr-12"
                      value={form.expiryMinutes}
                      onChange={handleChange}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  name="pinEnabled"
                  id="pinEnabled"
                  checked={form.pinEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 rounded accent-violet-500"
                />
                <span className="text-sm text-gray-300">
                  <Lock className="w-3.5 h-3.5 inline mr-1 text-violet-400" />
                  Protect with PIN
                </span>
              </label>

              {form.pinEnabled && (
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  placeholder="Enter a PIN (4–20 characters)"
                  minLength={4}
                  maxLength={20}
                  className="input-field animate-fade-in"
                  value={form.pin}
                  onChange={handleChange}
                  required={form.pinEnabled}
                  autoComplete="off"
                />
              )}
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 text-sm text-red-300 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              id="create-submit-btn"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Chat
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Create;
