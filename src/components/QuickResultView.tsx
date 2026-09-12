import React, { useState } from 'react';
import {
  SessionSummaryData,
  HumanFriendlyExpression,
  SimpleTimelineSegment,
} from '../types';
import {
  Activity,
  Clock,
  Eye,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  RotateCcw,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';

interface QuickResultViewProps {
  summary: SessionSummaryData;
  onScanAgain: () => void;
  onToggleFullAnalysis: () => void;
  isFullAnalysisOpen: boolean;
}

export const QuickResultView: React.FC<QuickResultViewProps> = ({
  summary,
  onScanAgain,
  onToggleFullAnalysis,
  isFullAnalysisOpen,
}) => {
  const [selectedSegment, setSelectedSegment] = useState<SimpleTimelineSegment | null>(null);
  const [showChangeDetails, setShowChangeDetails] = useState<boolean>(false);

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
    link.download = `behavior-summary-${Date.now()}.txt`;
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
    link.download = `behavior-summary-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="quick-result-view"
      className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-400"
    >
      {/* SUCCESS REVEAL BANNER */}
      <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300 font-mono">
              Scan Complete
            </span>
            <span className="text-xs text-neutral-400 ml-2 font-mono">
              {summary.startedAt} → {summary.endedAt}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onScanAgain}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md active:scale-[0.98] transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Scan Again</span>
        </button>
      </div>

      {/* 1. HERO BLOCK: "MOSTLY YOU WERE" (One-Glance Instant Understanding) */}
      <div className="w-full rounded-3xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Subtle radial glow matching dominant expression */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-xs font-mono font-medium tracking-widest uppercase text-neutral-400 block">
              YOUR SESSION • {summary.formattedDuration}
            </span>
            <div className="text-sm sm:text-base text-neutral-300">Mostly you were</div>
            <div className="flex items-center gap-3.5">
              <span className="text-4xl sm:text-5xl" role="img" aria-label={summary.dominantExpression}>
                {summary.dominantEmoji}
              </span>
              <div>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white capitalize">
                  {summary.dominantExpression}
                </h2>
                <span className="text-sm sm:text-base font-mono font-semibold text-cyan-300">
                  {summary.dominantDuration}
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-xs sm:text-right space-y-1 sm:self-end">
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
              {summary.dominantOneSentence}
            </p>
            <p className="text-[11px] text-neutral-400">
              Observable surface signals only • Non-diagnostic
            </p>
          </div>
        </div>

        {/* EXPRESSION DURATION CHIPS / ROWS */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-3 font-medium">
            Expression Durations
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {summary.expressionDurations.map((item) => (
              <div
                key={item.expression}
                className={`p-3 rounded-xl border transition-all ${
                  item.expression === summary.dominantExpression
                    ? 'bg-neutral-800/90 border-cyan-500/40 shadow-sm'
                    : 'bg-neutral-950/60 border-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-xs font-medium text-neutral-200 truncate">
                    {item.expression}
                  </span>
                </div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-sm font-semibold text-white">
                    {item.formattedDuration}
                  </span>
                  <span className="text-[11px] text-neutral-400">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. EXPRESSION TIMELINE (Horizontal, Interactive, Tooltip on Touch/Hover) */}
      <div className="w-full rounded-2xl bg-neutral-900/80 border border-white/10 p-5 backdrop-blur-md shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200 font-mono">
              Expression Timeline
            </span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            00:00 ─── {summary.formattedDuration}
          </span>
        </div>

        {/* Visual timeline bar */}
        <div className="w-full h-12 bg-neutral-950 rounded-xl p-1 border border-white/5 flex items-stretch gap-1 overflow-x-auto relative">
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
                aria-label={`${seg.expression} from ${seg.startTimeFormatted} to ${seg.endTimeFormatted}`}
                className={`relative group h-full rounded-lg flex items-center justify-center transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-cyan-500/30 border border-cyan-400'
                    : 'bg-neutral-800/80 hover:bg-neutral-750 border border-white/5'
                }`}
              >
                <span className="text-base pointer-events-none transform group-hover:scale-110 transition-transform">
                  {seg.emoji}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected or Hovered Timeline Inspector */}
        <div className="min-h-[32px] flex items-center justify-between text-xs px-2 py-1 bg-neutral-950/40 rounded-lg border border-white/5">
          {selectedSegment ? (
            <>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-sm">{selectedSegment.emoji}</span>
                <span className="font-semibold text-white">{selectedSegment.expression}</span>
                <span className="text-neutral-400">•</span>
                <span className="text-cyan-300">Duration: {selectedSegment.formattedDuration}</span>
              </div>
              <span className="text-neutral-400 font-mono text-[11px]">
                Time: {selectedSegment.startTimeFormatted} – {selectedSegment.endTimeFormatted}
              </span>
            </>
          ) : (
            <span className="text-[11px] text-neutral-400 italic">
              Tap or hover any segment along the timeline to inspect duration & timestamp.
            </span>
          )}
        </div>
      </div>

      {/* 3. TWO-COLUMN DUAL METRICS: EXPRESSION BREAKDOWN & BEHAVIOR CHANGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Simple Expression Breakdown Bars */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-md shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200 font-mono">
              Expression Breakdown
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">Share of Session</span>
          </div>

          <div className="space-y-2.5">
            {summary.expressionDurations.map((item) => (
              <div key={item.expression} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-neutral-200">
                    <span>{item.emoji}</span>
                    <span>{item.expression}</span>
                  </span>
                  <span className="font-mono text-neutral-300 font-semibold">
                    {item.percentage}%{' '}
                    <span className="text-neutral-500 font-normal">({item.formattedDuration})</span>
                  </span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simplified Behavior Changes */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-md shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200 font-mono">
                  Behavior Changes
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowChangeDetails(!showChangeDetails)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
              >
                <span>{showChangeDetails ? 'Hide notes' : 'View notes'}</span>
                {showChangeDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <div className="space-y-2.5">
              {summary.simplifiedChanges.map((change, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-neutral-950/60 border border-white/5 flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center gap-2 text-neutral-200 font-medium">
                    {change.icon === 'up' && (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                    {change.icon === 'down' && (
                      <ArrowDownRight className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}
                    {change.icon === 'stable' && (
                      <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    )}
                    <span>{change.text}</span>
                  </div>
                  {showChangeDetails && change.detail && (
                    <p className="text-[11px] text-neutral-400 pl-6 leading-relaxed">
                      {change.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 italic">
            Calculated against rolling baseline calibration during this scan.
          </p>
        </div>
      </div>

      {/* 4. ATTENTION & ENGAGEMENT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Attention Card */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-md shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200 font-mono">
                Visual Attention
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {summary.attentionSummary.average}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-1.5">
            <div className="text-sm font-semibold text-white">
              {summary.attentionSummary.statusLabel}
            </div>
            <div className="text-xs font-mono text-neutral-300 flex items-center justify-between">
              <span>Looked toward camera:</span>
              <span className="text-emerald-400 font-semibold">
                {summary.attentionSummary.formattedToward}
              </span>
            </div>
            <div className="text-xs font-mono text-neutral-400 flex items-center justify-between">
              <span>Looked away:</span>
              <span>{summary.attentionSummary.formattedAway}</span>
            </div>
          </div>
        </div>

        {/* Engagement Card */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-md shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200 font-mono">
                Engagement Score
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {summary.engagementSummary.score}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-1.5">
            <div className="text-sm font-semibold text-white">
              {summary.engagementSummary.label}
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {summary.engagementSummary.description}
            </p>
          </div>
        </div>
      </div>

      {/* 5. ACTIONS & "VIEW FULL ANALYSIS" TOGGLE (Preserves Clean Experience, Unfolds Deep Dashboard) */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/90 border border-white/10 backdrop-blur-md shadow-lg">
        {/* Left: Export Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportText}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Report (.txt)</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>

        {/* Right: View Full Analysis & Rescan */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onToggleFullAnalysis}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
              isFullAnalysisOpen
                ? 'bg-neutral-800 border-cyan-500/40 text-cyan-300'
                : 'bg-neutral-800/90 hover:bg-neutral-750 border-white/10 text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isFullAnalysisOpen ? 'Hide Full Analysis' : 'View Full Analysis'}</span>
            {isFullAnalysisOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onScanAgain}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Scan Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
