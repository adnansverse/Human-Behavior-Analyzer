import React from 'react';
import { BehaviorChangeObservation } from '../types';
import { Activity, TrendingUp, TrendingDown, EyeOff, Eye, Zap, ShieldAlert } from 'lucide-react';

interface BehaviorChangeFeedProps {
  observations: BehaviorChangeObservation[];
}

export const BehaviorChangeFeed: React.FC<BehaviorChangeFeedProps> = ({ observations }) => {
  if (observations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-neutral-900/40 border border-white/5 text-center">
        <Activity className="w-5 h-5 text-neutral-400 mb-2" />
        <p className="text-xs font-medium text-neutral-300">Establishing baseline observations</p>
        <p className="text-[11px] text-neutral-400 max-w-xs mt-0.5">
          Observable changes compared against your rolling session baseline will appear here as trends develop.
        </p>
      </div>
    );
  }

  const getObservationIcon = (type: BehaviorChangeObservation['type']) => {
    switch (type) {
      case 'positive-shift':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'negative-shift':
        return <TrendingDown className="w-4 h-4 text-indigo-400" />;
      case 'attention-drop':
        return <EyeOff className="w-4 h-4 text-amber-400" />;
      case 'attention-rise':
        return <Eye className="w-4 h-4 text-cyan-400" />;
      case 'movement-increase':
        return <Zap className="w-4 h-4 text-orange-400" />;
      case 'stability':
      default:
        return <Activity className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getMagnitudeBadge = (magnitude: BehaviorChangeObservation['magnitude']) => {
    switch (magnitude) {
      case 'significant':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/70 border border-amber-500/30 text-amber-300">
            Significant Shift
          </span>
        );
      case 'noticeable':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
            Noticeable
          </span>
        );
      case 'subtle':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-800 border border-white/10 text-neutral-400">
            Subtle Baseline
          </span>
        );
    }
  };

  return (
    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
      {observations.slice(-8).reverse().map((obs) => (
        <div
          key={obs.id}
          className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10 hover:border-white/15 transition-all space-y-2"
        >
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-neutral-950 border border-white/10">
                {getObservationIcon(obs.type)}
              </div>
              <span className="font-mono text-xs text-neutral-400">{obs.formattedTime}</span>
            </div>
            {getMagnitudeBadge(obs.magnitude)}
          </div>

          {/* OBSERVATION vs INTERPRETATION */}
          <div className="space-y-1.5 text-xs">
            {/* Direct Factual Observation */}
            <div>
              <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mr-1.5">
                OBSERVATION:
              </span>
              <span className="text-neutral-200 font-medium">{obs.observation}</span>
            </div>

            {/* Cautious Contextual Interpretation */}
            <div className="pl-2 border-l border-white/10 text-[11px] text-neutral-400 leading-relaxed">
              <span className="font-mono uppercase text-[9px] tracking-wider text-neutral-400 block mb-0.5">
                INTERPRETATION NOTE (Observable Surface Signals Only):
              </span>
              {obs.interpretation}
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-neutral-400">
        <ShieldAlert className="w-3 h-3 text-neutral-400 flex-shrink-0" />
        <span>Observational baselines reset upon starting a new tracking session.</span>
      </div>
    </div>
  );
};
