import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Sparkles,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { InAppNotification } from '../types';

interface InAppNotificationBannerProps {
  notification: InAppNotification | null;
  onDismiss: () => void;
  onActionClick?: () => void;
  position?: 'bottom' | 'top';
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  notification,
  onDismiss,
  onActionClick,
  position = 'bottom',
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const duration = notification.durationMs || 4500;
    const intervalTime = 40;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isSuccess = notification.type === 'success';
  const isWarning = notification.type === 'warning';
  const isError = notification.type === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`absolute left-3 right-3 z-50 transition-all duration-300 ease-out transform ${
        position === 'bottom' ? 'bottom-4' : 'top-14'
      }`}
    >
      <div
        className={`rounded-2xl border p-3.5 shadow-2xl backdrop-blur-md overflow-hidden relative ${
          isSuccess
            ? 'bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-500/20'
            : isWarning
            ? 'bg-slate-900/95 border-amber-500/50 text-white shadow-amber-500/20'
            : 'bg-slate-900/95 border-rose-500/50 text-white shadow-rose-500/20'
        }`}
      >
        {/* Top Progress countdown line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className={`h-full transition-all duration-75 ${
              isSuccess ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-rose-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start justify-between gap-3 pt-1">
          {/* Left Icon Badge */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isWarning
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isSuccess ? (
              <Sparkles className="w-5 h-5 animate-pulse" />
            ) : isWarning ? (
              <Clock className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>

          {/* Center Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-white">
                {notification.title}
              </span>
              {isSuccess && (
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  Free Fire Reward
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              {notification.message}
            </p>

            {notification.rewardItem && (
              <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{notification.rewardItem}</span>
              </div>
            )}

            {/* Action buttons */}
            {notification.actionLabel && onActionClick && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={onActionClick}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{notification.actionLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
