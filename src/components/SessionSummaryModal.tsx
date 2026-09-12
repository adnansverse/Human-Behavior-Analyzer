import React, { useState } from 'react';
import { SessionSummaryData, SimpleTimelineSegment } from '../types';
import {
  X,
  Clock,
  Activity,
  Eye,
  Zap,
  TrendingUp,
  Download,
  RotateCcw,
  ShieldCheck,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
} from 'lucide-react';

interface SessionSummaryModalProps {
  summary: SessionSummaryData;
  onClose: () => void;
  onStartNewSession: () => void;
  onViewFullAnalysis?: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  summary,
  onClose,
  onStartNewSession,
  onViewFullAnalysis,
}) => {
  const [selectedSegment, setSelectedSegment] = useState<SimpleTimelineSegment | null>(null);
  const [showNotes, setShowNotes] = useState<boolean>(false);

  const handleExportText = () => {
    const report = `=====================================================
HUMAN BEHAVIOR ANALYZER — OBSERVATIONAL SESSION REPORT
=====================================================
Session Duration: ${summary.formattedDuration} (${summary.durationSeconds} seconds)
Recorded: ${summary.startedAt} to ${summary.endedAt}

MOST OBSERVABLE EXPRESSION
-----------------------------------------------------
${summary.dominantEmoji} ${summary.dominantExpression} (${summary.dominantDuration})
${summary.dominantOneSentence}

EXPRESSIONS & DURATIONS
-----------------------------------------------------
${summary.expressionDurations
  .map(
    (ed) =>
      `${ed.emoji} ${ed.expression.padEnd(16, ' ')} — ${ed.formattedDuration} (${ed.percentage}%)`
  )
  .join('\n')}

ATTENTION & ENGAGEMENT
-----------------------------------------------------
Average Attention:    ${summary.attentionSummary.average}% (${summary.attentionSummary.statusLabel})
Peak Attention:       ${summary.attentionSummary.peak}%
Looked Toward Camera: ${summary.attentionSummary.formattedToward}
Looked Away:          ${summary.attentionSummary.formattedAway}
Overall Engagement:   ${summary.engagementSummary.score}% (${summary.engagementSummary.label})

BEHAVIOR CHANGES OBSERVED
-----------------------------------------------------
${summary.simplifiedChanges.map((c) => `• ${c.text}${c.detail ? ` (${c.detail})` : ''}`).join('\n')}

DISCLAIMER & ETHICAL NOTE
-----------------------------------------------------
Measurements reflect strictly observable surface facial indicators
and visual gaze coordinates. They do not constitute emotional diagnosis
or inner mental state evaluations. All data remained local to your device.
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl p-5 sm:p-7 space-y-6 text-neutral-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block font-semibold">
              YOUR SESSION • {summary.formattedDuration}
            </span>
            <h2 id="summary-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-white">
              Scan Summary
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close summary"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. MOSTLY YOU WERE (HERO BLOCK) */}
        <div className="p-5 rounded-2xl bg-neutral-950/80 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-neutral-400 font-mono">MOSTLY YOU WERE</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">{summary.dominantEmoji}</span>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white capitalize">
                  {summary.dominantExpression}
                </h3>
                <span className="text-sm font-mono text-cyan-300 font-semibold">
                  {summary.dominantDuration}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-neutral-300 max-w-xs sm:text-right leading-relaxed font-medium">
            {summary.dominantOneSentence}
          </p>
        </div>

        {/* 2. EXPRESSION DURATIONS LIST */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-medium">
            Observed Expressions
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {summary.expressionDurations.map((item) => (
              <div
                key={item.expression}
                className="p-2.5 rounded-xl bg-neutral-950/60 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{item.emoji}</span>
                  <span className="text-neutral-200 font-medium truncate">{item.expression}</span>
                </div>
                <span className="font-mono text-cyan-300 font-semibold pl-2">
                  {item.formattedDuration}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. EXPRESSION TIMELINE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono uppercase tracking-wider text-neutral-400 font-medium">
              Expression Timeline
            </span>
            <span className="font-mono text-neutral-400 text-[11px]">
              00:00 ─── {summary.formattedDuration}
            </span>
          </div>

          <div className="w-full h-10 bg-neutral-950 rounded-xl p-1 border border-white/5 flex items-stretch gap-1 overflow-x-auto">
            {summary.simpleTimeline.map((seg) => {
              const widthPct = Math.max(
                4,
                Math.round((seg.durationSeconds / Math.max(1, summary.durationSeconds)) * 100)
              );
              const isSelected = selectedSegment?.id === seg.id;
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setSelectedSegment(isSelected ? null : seg)}
                  onMouseEnter={() => setSelectedSegment(seg)}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full rounded-lg flex items-center justify-center transition-all ${
                    isSelected ? 'bg-cyan-500/30 border border-cyan-400' : 'bg-neutral-800/80'
                  }`}
                >
                  <span className="text-sm">{seg.emoji}</span>
                </button>
              );
            })}
          </div>

          {selectedSegment && (
            <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-950/50 border border-white/5 flex items-center justify-between">
              <span>
                {selectedSegment.emoji} {selectedSegment.expression} • {selectedSegment.formattedDuration}
              </span>
              <span className="text-neutral-400">
                {selectedSegment.startTimeFormatted} – {selectedSegment.endTimeFormatted}
              </span>
            </div>
          )}
        </div>

        {/* 4. ATTENTION & ENGAGEMENT ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between font-mono text-neutral-400 text-[11px]">
              <span>ATTENTION</span>
              <span className="text-emerald-400 font-bold">{summary.attentionSummary.average}%</span>
            </div>
            <div className="text-neutral-200 font-medium">
              {summary.attentionSummary.statusLabel}
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              Looked toward: {summary.attentionSummary.formattedToward} • Away: {summary.attentionSummary.formattedAway}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between font-mono text-neutral-400 text-[11px]">
              <span>ENGAGEMENT</span>
              <span className="text-cyan-300 font-bold">{summary.engagementSummary.score}%</span>
            </div>
            <div className="text-neutral-200 font-medium">
              {summary.engagementSummary.label}
            </div>
            <div className="text-[11px] text-neutral-400 truncate">
              {summary.engagementSummary.description}
            </div>
          </div>
        </div>

        {/* 5. BEHAVIOR CHANGES */}
        <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-neutral-400 font-medium uppercase text-[11px]">
              Observed Shifts ({summary.simplifiedChanges.length})
            </span>
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="text-cyan-400 text-[11px] hover:underline"
            >
              {showNotes ? 'Less' : 'Details'}
            </button>
          </div>

          <div className="space-y-1.5">
            {summary.simplifiedChanges.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-neutral-200">
                {c.icon === 'up' ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : c.icon === 'down' ? (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                )}
                <span>{c.text}</span>
                {showNotes && c.detail && (
                  <span className="text-[11px] text-neutral-400">— {c.detail}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scientific caution */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 text-[11px] text-neutral-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            Observable surface indicators only. Does not evaluate emotions, health, or mental states.
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
              <span>Report (.txt)</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-white/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onViewFullAnalysis && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewFullAnalysis();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Full Analysis</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onStartNewSession();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Scan Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
