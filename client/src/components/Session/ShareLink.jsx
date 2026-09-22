import React, { useState } from 'react';
import { Copy, Share2, Check, X, ExternalLink, Link2 } from 'lucide-react';

const ShareLink = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my temporary chat', text: 'Join this private temporary chat room:', url });
      } catch {}
    }
  };

  const canShare = !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-3 glass-shine rounded-2xl p-6 w-full max-w-md animate-scale-in
                      shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.6)]
                      border border-white/[0.10]">

        {/* Shimmer accent line top */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl
                        bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25
                            flex items-center justify-center">
              <Link2 className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="font-semibold text-gray-200">Share Invite Link</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:glass-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
          Share this link with people you want to invite. Anyone with this link can join.
        </p>

        {/* URL display */}
        <div className="flex items-center gap-2 p-3 rounded-xl glass-1 border border-white/[0.07] mb-5">
          <span className="text-xs text-violet-300 truncate flex-1 font-mono">{url}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            id="copy-link-btn"
            className={`btn-primary flex-1 transition-all duration-300 ${
              copied
                ? 'bg-none [background:linear-gradient(135deg,#059669,#047857)] shadow-[0_4px_16px_rgba(5,150,105,0.45)]'
                : ''
            }`}
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
