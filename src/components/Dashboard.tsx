import React from 'react';
import {
  ObservableSignals,
  TimelineEvent,
  BehaviorChangeObservation,
  AppSettings,
  EstimatedExpression,
} from '../types';
import { EmotionTimelineChart } from './EmotionTimelineChart';
import { BehaviorChangeFeed } from './BehaviorChangeFeed';
import {
  Activity,
  Eye,
  Smile,
  Compass,
  Zap,
  TrendingUp,
  X,
  ChevronDown,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface DashboardProps {
  signals: ObservableSignals;
  timelineEvents: TimelineEvent[];
  observations: BehaviorChangeObservation[];
  currentDurationSeconds: number;
  settings: AppSettings;
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  signals,
  timelineEvents,
  observations,
  currentDurationSeconds,
  settings,
  onClose,
}) => {
  const getIntensityBadge = (intensity: ObservableSignals['intensity']) => {
    switch (intensity) {
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/70 border border-amber-500/40 text-amber-300">
            High Intensity
          </span>
        );
      case 'Moderate':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
            Moderate
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-800 border border-white/10 text-neutral-300">
            Low Intensity
          </span>
        );
    }
  };

  const getEngagementCategory = (score: number) => {
    if (score >= 80) return 'High observable engagement';
    if (score >= 60) return 'Moderate–high observable engagement';
    if (score >= 40) return 'Moderate observable engagement';
    return 'Low observable engagement';
  };

  return (
    <section
      id="behavior-analysis-dashboard"
      aria-label="Real-time Behavior Analysis Workspace"
      className="w-full rounded-2xl bg-neutral-925 border border-white/10 p-4 sm:p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 space-y-6"
    >
      {/* Header Bar of Dashboard */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-neutral-900 border border-white/10 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-neutral-100 tracking-tight">
              Real-Time Behavior Dashboard
            </h2>
            <p className="text-xs text-neutral-400">
              Live observable signals, attention estimates, and baseline changes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Collapse dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white text-xs transition-colors"
        >
          <span>Hide Dashboard</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* TOP PRIMARY ANALYTICS GRID: Expression, Attention, Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: CURRENT EXPRESSION */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                CURRENT EXPRESSION
              </span>
              {getIntensityBadge(signals.intensity)}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-cyan-300">
                {signals.estimatedExpression}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span>{signals.confidence}% confidence</span>
              <span>•</span>
              <span className="text-neutral-400">Intensity: {signals.intensity}</span>
            </div>
          </div>

          {/* Distribution Bars */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
              Estimated Expression Distribution
            </span>
            {(
              [
                'Neutral',
                'Happy-looking',
                'Sad-looking',
                'Surprised-looking',
                'Confused-looking',
                'Angry-looking',
              ] as EstimatedExpression[]
            ).map((exp) => {
              const val = signals.expressionDistribution[exp] || 0;
              const isCurrent = signals.estimatedExpression === exp;
              return (
                <div key={exp} className="flex items-center justify-between text-xs gap-2">
                  <span
                    className={`text-[11px] truncate ${
                      isCurrent ? 'font-semibold text-neutral-200' : 'text-neutral-400'
                    }`}
                  >
                    {exp}
                  </span>
                  <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                    <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${val}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCurrent ? 'bg-cyan-400' : 'bg-neutral-600'
                        }`}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-neutral-400 w-7 text-right">
                      {val}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-neutral-400 flex items-center gap-1">
            <Info className="w-3 h-3 text-neutral-400 flex-shrink-0" />
            <span>Based on visible facial geometric surface markers.</span>
          </div>
        </div>

        {/* CARD 2: EYE & ATTENTION ANALYSIS */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                VISUAL ATTENTION
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
                Optic Vector
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-400">
                {signals.visualAttention}%
              </span>
              <span className="text-xs font-medium text-neutral-300">
                {signals.attentionStatus}
              </span>
            </div>

            <p className="mt-1 text-xs text-neutral-400">
              Observable focus oriented toward the primary camera focal axis.
            </p>
          </div>

          {/* Gaze Direction Compass & Blink Activity */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Gaze Direction:</span>
              <span className="font-mono font-medium text-neutral-200">
                {signals.gazeDirection}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Blink Trend Estimate:</span>
              <span className="font-mono text-neutral-300">
                ~{signals.blinkRateEstimate} / min
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Observable Movement:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${signals.movementActivity}%` }}
                    className="h-full bg-orange-400 rounded-full transition-all"
                  />
                </div>
                <span className="font-mono text-[10px] text-neutral-400">
                  {signals.movementActivity}%
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-neutral-400 flex items-center gap-1">
            <Info className="w-3 h-3 text-neutral-400 flex-shrink-0" />
            <span>Attention estimate calculated from head orientation & corneal reflections.</span>
          </div>
        </div>

        {/* CARD 3: OVERALL ENGAGEMENT / BEHAVIOR SCORE */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                OVERALL ENGAGEMENT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                Composite Score
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-cyan-300">
                {signals.overallEngagement}%
              </span>
              <span className="text-xs font-medium text-neutral-300">
                {getEngagementCategory(signals.overallEngagement)}
              </span>
            </div>

            <p className="mt-1 text-xs text-neutral-400">
              Estimated from visible attention and interaction signals during this session.
            </p>
          </div>

          {/* Component weights */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Estimated Signal Weightings
            </span>
            <div className="space-y-1 text-[11px] text-neutral-400">
              <div className="flex justify-between">
                <span>Visual Attention (Gaze Orientation):</span>
                <span className="font-mono text-neutral-300">50%</span>
              </div>
              <div className="flex justify-between">
                <span>Landmark Stability / Posture:</span>
                <span className="font-mono text-neutral-300">25%</span>
              </div>
              <div className="flex justify-between">
                <span>Facial Expressive Dynamics:</span>
                <span className="font-mono text-neutral-300">25%</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-neutral-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400/80 flex-shrink-0" />
            <span>Non-diagnostic metric based strictly on surface observations.</span>
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: EMOTION TIMELINE & BEHAVIOR CHANGE OBSERVATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* LEFT COLUMN: EMOTION TIMELINE */}
        <div className="p-4 rounded-xl bg-neutral-900/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-200 uppercase tracking-wider font-mono">
                Emotion Timeline
              </h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              {timelineEvents.length} events logged
            </span>
          </div>

          <EmotionTimelineChart
            events={timelineEvents}
            currentDurationSeconds={currentDurationSeconds}
          />
        </div>

        {/* RIGHT COLUMN: BEHAVIOR-CHANGE DETECTION */}
        <div className="p-4 rounded-xl bg-neutral-900/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-200 uppercase tracking-wider font-mono">
                Behavior-Change Observations
              </h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              vs. Rolling Baseline
            </span>
          </div>

          <BehaviorChangeFeed observations={observations} />
        </div>
      </div>
    </section>
  );
};
