import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Info, X, Clock } from 'lucide-react';

interface ToastNotificationProps {
  message: string | null;
  onClose: () => void;
  duration?: number; // Exactly 10,000 ms (10 seconds)
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  onClose,
  duration = 10000,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!message) return;

    setTimeLeft(duration);
    setIsPaused(false);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = Date.now();

    const tick = () => {
      if (isPaused) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = Date.now();
      const elapsed = elapsedBeforePauseRef.current + (now - startTimeRef.current);
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        onClose();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [message, duration, isPaused, onClose]);

  if (!message) return null;

  const secondsRemaining = Math.max(1, Math.ceil(timeLeft / 1000));
  const progressPercent = (timeLeft / duration) * 100;

  return (
    <div
      id="toast-popup-10s"
      role="alert"
      aria-live="polite"
      onMouseEnter={() => {
        setIsPaused(true);
        elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
      }}
      onMouseLeave={() => {
        startTimeRef.current = Date.now();
        setIsPaused(false);
      }}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
              Notification
            </span>
            <span
              className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
              title="Will automatically disappear after 10 seconds"
            >
              <Clock className="w-2.5 h-2.5 text-indigo-400" />
              <span>{secondsRemaining}s</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Dismiss immediately"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 10-Second Auto-dismiss Progress Bar */}
      <div className="h-1 bg-slate-800 w-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
