import React from 'react';
import { TimelineEvent, EstimatedExpression } from '../types';
import { Clock } from 'lucide-react';

interface EmotionTimelineChartProps {
  events: TimelineEvent[];
  currentDurationSeconds: number;
}

const EXPRESSION_COLORS: Record<EstimatedExpression, { bar: string; text: string; dot: string }> = {
  Neutral: { bar: 'bg-neutral-600', text: 'text-neutral-300', dot: '#737373' },
  'Happy-looking': { bar: 'bg-emerald-500', text: 'text-emerald-400', dot: '#10b981' },
  'Sad-looking': { bar: 'bg-indigo-500', text: 'text-indigo-400', dot: '#6366f1' },
  'Angry-looking': { bar: 'bg-rose-500', text: 'text-rose-400', dot: '#f43f5e' },
  'Surprised-looking': { bar: 'bg-amber-400', text: 'text-amber-300', dot: '#f59e0b' },
  'Fearful-looking': { bar: 'bg-orange-500', text: 'text-orange-400', dot: '#f97316' },
  'Disgusted-looking': { bar: 'bg-teal-500', text: 'text-teal-400', dot: '#14b8a6' },
  'Confused-looking': { bar: 'bg-violet-400', text: 'text-violet-300', dot: '#a78bfa' },
};

export const EmotionTimelineChart: React.FC<EmotionTimelineChartProps> = ({
  events,
  currentDurationSeconds,
}) => {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-neutral-900/40 border border-white/5 text-center">
        <Clock className="w-5 h-5 text-neutral-400 mb-2" />
        <p className="text-xs font-medium text-neutral-300">No timeline data yet</p>
        <p className="text-[11px] text-neutral-400 max-w-xs mt-0.5">
          Observable expression shifts and attention values will appear here as the session progresses.
        </p>
      </div>
    );
  }

  const maxTime = Math.max(currentDurationSeconds, events[events.length - 1]?.timestampSeconds || 1, 10);

  // Build SVG path for Attention trendline
  const svgWidth = 600;
  const svgHeight = 70;
  const points = events.map((ev) => {
    const x = (ev.timestampSeconds / maxTime) * svgWidth;
    const y = svgHeight - (ev.attentionScore / 100) * (svgHeight - 12) - 6;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polylinePath = points.join(' ');

  // Distinct significant expression changes for log
  const distinctEvents: TimelineEvent[] = [];
  events.forEach((ev, idx) => {
    if (idx === 0 || ev.expression !== events[idx - 1].expression) {
      distinctEvents.push(ev);
    }
  });

  return (
    <div className="space-y-4">
      {/* Visual Timeline Graphic */}
      <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-neutral-400 text-[11px] uppercase tracking-wider">
            Observable Visual Attention & Expression Sequence
          </span>
          <span className="font-mono text-neutral-400 text-[11px]">
            Span: {Math.round(maxTime)}s
          </span>
        </div>

        {/* Attention SVG Graph */}
        <div className="relative w-full h-[70px] bg-neutral-950/70 rounded-lg border border-white/5 overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Horizontal guideline */}
            <line
              x1="0"
              y1={svgHeight * 0.3}
              x2={svgWidth}
              y2={svgHeight * 0.3}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3,3"
            />
            <line
              x1="0"
              y1={svgHeight * 0.7}
              x2={svgWidth}
              y2={svgHeight * 0.7}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3,3"
            />

            {/* Attention Polyline */}
            {points.length > 1 && (
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePath}
              />
            )}

            {/* Event Markers */}
            {distinctEvents.map((ev) => {
              const cx = (ev.timestampSeconds / maxTime) * svgWidth;
              const cy = svgHeight - (ev.attentionScore / 100) * (svgHeight - 12) - 6;
              const color = EXPRESSION_COLORS[ev.expression]?.dot || '#38bdf8';
              return (
                <g key={ev.id}>
                  <circle cx={cx} cy={cy} r="3.5" fill={color} stroke="#090a0f" strokeWidth="1.5" />
                </g>
              );
            })}
          </svg>

          {/* Label overlays */}
          <div className="absolute top-1 right-2 text-[9px] font-mono text-neutral-400">
            100% ATTENTION
          </div>
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-neutral-400">
            0% ATTENTION
          </div>
        </div>

        {/* Expression Segment Bar */}
        <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden flex border border-white/5">
          {events.map((ev, i) => {
            const nextTime = events[i + 1]?.timestampSeconds ?? maxTime;
            const duration = Math.max(0.5, nextTime - ev.timestampSeconds);
            const widthPct = (duration / maxTime) * 100;
            const colorClass = EXPRESSION_COLORS[ev.expression]?.bar || 'bg-neutral-600';
            return (
              <div
                key={ev.id}
                title={`${ev.formattedTime} - ${ev.expression}`}
                style={{ width: `${widthPct}%` }}
                className={`h-full ${colorClass} transition-all`}
              />
            );
          })}
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-500" /> Neutral
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Happy-looking
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Surprised-looking
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> Sad-looking
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400" /> Confused-looking
          </div>
        </div>
      </div>

      {/* Chronological Event Log List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 px-1 mb-1">
          Chronological Observable Transitions
        </div>
        {distinctEvents.slice(-8).reverse().map((ev) => {
          const colorMeta = EXPRESSION_COLORS[ev.expression];
          return (
            <div
              key={ev.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-900/50 border border-white/5 text-xs hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-neutral-400 text-[11px]">{ev.formattedTime}</span>
                <span className="text-neutral-400">—</span>
                <span className={`font-medium ${colorMeta?.text || 'text-neutral-200'}`}>
                  {ev.expression}
                </span>
              </div>
              <div className="flex items-center gap-3 text-neutral-400 text-[11px] font-mono">
                <span>{ev.confidence}% conf</span>
                <span>{ev.attentionScore}% att</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
