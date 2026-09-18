import React, { useState } from 'react';
import { Download, Image as ImageIcon, Film, Loader2, AlertCircle } from 'lucide-react';
import { getDownloadUrl } from '../../services/api';
import { useChat } from '../../context/ChatContext';

const MediaMessage = ({ mediaId, type }) => {
  const { state } = useChat();
  const sessionToken = state.session?.sessionToken;

  const [downloadState, setDownloadState] = useState('idle'); // idle | loading | error
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  const fetchAndOpenPreview = async () => {
    if (downloadState === 'loading') return;
    setDownloadState('loading');
    try {
      const { data } = await getDownloadUrl(mediaId, sessionToken);
      setPreviewUrl(data.downloadUrl);
      setDownloadState('idle');
    } catch (err) {
      setDownloadState('error');
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (downloadState === 'loading') return;
    setDownloadState('loading');
    try {
      const { data } = await getDownloadUrl(mediaId, sessionToken);
      // Open in new tab — browser handles download
      window.open(data.downloadUrl, '_blank', 'noopener');
      setDownloadState('idle');
    } catch {
      setDownloadState('error');
    }
  };

  return (
    <div className="relative">
      {/* Preview area */}
      {previewUrl ? (
        type === 'image' ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Shared image"
              className="max-w-full rounded-t-xl object-contain max-h-64 w-full bg-black/20"
              onLoad={() => setPreviewLoaded(true)}
            />
            {!previewLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            )}
          </div>
        ) : (
          <video
            src={previewUrl}
            controls
            className="max-w-full rounded-t-xl max-h-64 w-full bg-black"
            preload="metadata"
          />
        )
      ) : (
        // Placeholder before preview loaded
        <button
          onClick={fetchAndOpenPreview}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 px-4 bg-gray-900/40 hover:bg-gray-800/50 transition-colors rounded-t-xl"
        >
          {downloadState === 'loading' ? (
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          ) : downloadState === 'error' ? (
            <>
              <AlertCircle className="w-8 h-8 text-red-400" />
              <span className="text-xs text-red-300">Failed to load. Tap to retry.</span>
            </>
          ) : type === 'image' ? (
            <>
              <ImageIcon className="w-8 h-8 text-violet-400" />
              <span className="text-xs text-gray-400">Tap to view image</span>
            </>
          ) : (
            <>
              <Film className="w-8 h-8 text-violet-400" />
              <span className="text-xs text-gray-400">Tap to play video</span>
            </>
          )}
        </button>
      )}

      {/* Download button */}
      <button
        onClick={handleDownload}
        id={`download-media-${mediaId}`}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
        title="Download"
      >
        {downloadState === 'loading' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};

export default MediaMessage;
