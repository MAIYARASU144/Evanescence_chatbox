import React from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  connected: null, // no banner when connected
  reconnecting: {
    icon: Loader2,
    text: 'Reconnecting...',
    className: 'bg-amber-900/40 border-amber-700/30 text-amber-300',
    animate: true,
  },
  error: {
    icon: AlertCircle,
    text: 'Connection failed. Please refresh.',
    className: 'bg-red-900/40 border-red-700/30 text-red-300',
    animate: false,
  },
  disconnected: {
    icon: WifiOff,
    text: 'Disconnected.',
    className: 'bg-gray-800/60 border-gray-700/30 text-gray-400',
    animate: false,
  },
};

const ConnectionStatus = ({ status }) => {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const { icon: Icon, text, className, animate } = config;

  return (
    <div className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs border-b ${className} animate-fade-in`}>
      <Icon className={`w-3.5 h-3.5 ${animate ? 'animate-spin' : ''}`} />
      <span>{text}</span>
    </div>
  );
};

export default ConnectionStatus;
