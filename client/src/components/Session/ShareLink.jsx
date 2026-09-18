import React, { useState } from 'react';
import { Copy, Share2, Check, X, ExternalLink } from 'lucide-react';

const ShareLink = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my temporary chat',
          text: 'Join this private temporary chat room:',
          url,
        });
      } catch {}
    }
  };

  const canShare = !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-200">Share Invite Link</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-3">
          Share this link with people you want to invite. Anyone with this link can join.
        </p>

        {/* URL display */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-900/80 border border-gray-700/50 mb-4">
          <span className="text-sm text-violet-300 truncate flex-1 font-mono text-xs">{url}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            id="copy-link-btn"
            className={`btn-primary flex-1 ${copied ? 'bg-emerald-600 hover:bg-emerald-500' : ''}`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>

          {canShare && (
            <button onClick={handleShare} id="native-share-btn" className="btn-secondary">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
        </div>

        <p className="text-xs text-gray-700 mt-4 text-center">
          Only people with this link can join. The link becomes invalid when the chat ends.
        </p>
      </div>
    </div>
  );
};

export default ShareLink;
