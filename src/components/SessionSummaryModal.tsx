import React from 'react';
import { SessionSummaryData } from '../types';
import {
  X,
  Clock,
  Activity,
  Smile,
  Zap,
  TrendingUp,
  Download,
  RotateCcw,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface SessionSummaryModalProps {
  summary: SessionSummaryData;
  onClose: () => void;
  onStartNewSession: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  summary,
  onClose,
  onStartNewSession,
}) => {
  const handleExportText = () => {
    const report = `=====================================================
HUMAN BEHAVIOR ANALYZER — OBSERVATIONAL SESSION REPORT
=====================================================
Session Duration: ${summary.formattedDuration} (${summary.durationSeconds} seconds)
Recorded: ${summary.startedAt} to ${summary.endedAt}

KEY OBSERVABLE METRICS
-----------------------------------------------------
Dominant Observable Expression: ${summary.dominantExpression}
Peak Observable Attention:       ${summary.peakAttention}%
Average Observable Attention:    ${summary.averageAttention}%
Overall Observable Engagement:   ${summary.overallEngagement}%
Major Observed Changes Logged:   ${summary.majorChangesCount}

OBSERVATIONAL INTERPRETATION NOTE
-----------------------------------------------------
${summary.observationalSummaryText}

CHRONOLOGICAL BEHAVIOR OBSERVATIONS
-----------------------------------------------------
${
  summary.observations.length > 0
    ? summary.observations
        .map(
          (o) =>
            `[${o.formattedTime}] ${o.observation}\n   Interpretation: ${o.interpretation}`
        )
        .join('\n\n')
    : 'No statistically significant shifts detected against baseline.'
}

DISCLAIMER & SCIENTIFIC CAUTION
-----------------------------------------------------
This assessment is strictly derived from observable surface facial geometry
and visual orientation recorded during the session. It does NOT diagnose
emotional health, deception, cognitive capacity, or internal mental states.
All data remained local to the browser session.
=====================================================`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `behavior-session-report-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `behavior-session-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl p-6 space-y-6 text-neutral-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-950 border border-white/10 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 id="summary-modal-title" className="text-base font-semibold tracking-tight">
                Session Summary
              </h2>
              <p className="text-xs text-neutral-400">
                Synthesis of observable surface behavior and visual focus
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close summary"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5 KEY STAT BLOCKS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Duration */}
          <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-mono uppercase">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Duration</span>
            </div>
            <div className="text-lg font-bold font-mono text-neutral-100">
              {summary.formattedDuration}
            </div>
          </div>

          {/* Dominant Expression */}
          <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-mono uppercase">
              <Smile className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dominant</span>
            </div>
            <div className="text-sm font-semibold truncate text-cyan-300">
              {summary.dominantExpression}
            </div>
          </div>

          {/* Peak Attention */}
          <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-mono uppercase">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Peak Attention</span>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {summary.peakAttention}%
            </div>
          </div>

          {/* Major Observed Changes */}
          <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-mono uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Observed Changes</span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-300">
              {summary.majorChangesCount}
            </div>
          </div>

          {/* Overall Engagement */}
          <div className="col-span-2 sm:col-span-2 p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-[11px] font-mono uppercase">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Overall Engagement</span>
              </div>
              <span className="text-cyan-300 font-bold text-sm">{summary.overallEngagement}%</span>
            </div>
            <p className="text-xs text-neutral-300">
              Estimated from composite tracking of focal orientation & movement stability.
            </p>
          </div>
        </div>

        {/* CONCISE OBSERVATIONAL INTERPRETATION */}
        <div className="p-4 rounded-xl bg-neutral-950/90 border border-white/5 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block font-medium">
            Observational Interpretation (Observable Signals Only)
          </span>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {summary.observationalSummaryText}
          </p>
        </div>

        {/* Scientific disclaimer notice */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 text-[11px] text-neutral-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            This report does not constitute psychological, psychiatric, deception, or medical findings. Observable facial movements vary naturally between individuals and contexts.
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportText}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-white/10 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Export Report (.txt)
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-white/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartNewSession();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Start New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
