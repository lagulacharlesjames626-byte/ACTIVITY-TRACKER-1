import React, { useEffect, useState, useRef } from 'react';
import { X, CheckCircle2, Award, Clock } from 'lucide-react';
import { CompletionBoosterEvent } from '../types';

interface CompletionBoosterPopupProps {
  event: CompletionBoosterEvent | null;
  onDismiss: () => void;
}

export const CompletionBoosterPopup: React.FC<CompletionBoosterPopupProps> = ({
  event,
  onDismiss,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!event) return;

    setProgress(100);
    setIsPaused(false);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = Date.now();

    // Exactly 10 seconds auto-close
    const duration = 10000;

    const tick = () => {
      if (isPaused) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = Date.now();
      const elapsed = elapsedBeforePauseRef.current + (now - startTimeRef.current);
      const remaining = Math.max(0, duration - elapsed);
      const currentPercent = (remaining / duration) * 100;

      setProgress(currentPercent);

      if (remaining <= 0) {
        onDismiss();
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
  }, [event, onDismiss]);

  const handleMouseEnter = () => {
    if (!event) return;
    setIsPaused(true);
    elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
  };

  const handleMouseLeave = () => {
    if (!event) return;
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  if (!event) return null;

  const secondsLeft = Math.max(1, Math.ceil((10000 * (progress / 100)) / 1000));

  return (
    <div
      id="completion-booster-popup"
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed top-4 right-4 z-60 w-[90%] sm:w-[350px] max-w-sm bg-white rounded-lg border border-slate-300 shadow-lg overflow-hidden transition-all text-slate-800"
    >
      <div className="p-3">
        {/* Simple Top Row: Subject/Module info & Single Clean Dismiss Button */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-900 truncate">
              {event.subject} • Mod {event.moduleNumber}
            </span>
          </div>

          {/* Single clean highlighted dismiss button */}
          <button
            id="single-click-dismiss-btn"
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 transition-colors cursor-pointer shrink-0"
            title="Click to dismiss"
          >
            <X className="w-3 h-3" />
            <span>Dismiss ({secondsLeft}s)</span>
          </button>
        </div>

        {/* Rank & Timing in class */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-2">
          <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150">
            {event.rankText}
          </span>
          <span>•</span>
          <span className="text-slate-500 truncate">{event.timeDetail}</span>
        </div>

        {/* Funny Cheering & Positive Message */}
        <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 leading-relaxed">
          {event.boostSentence}
        </div>
      </div>

      {/* Subtle 10-second countdown indicator */}
      <div className="w-full h-0.5 bg-slate-100">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
