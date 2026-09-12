import React from 'react';
import { ShieldCheck, X, AlertTriangle, Eye } from 'lucide-react';

interface PrivacyBannerProps {
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyBannerProps> = ({ onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl p-6 space-y-5 text-neutral-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-950 border border-white/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="privacy-modal-title" className="text-base font-semibold tracking-tight">
                Scientific Caution & Privacy Policy
              </h2>
              <p className="text-xs text-neutral-400">
                Ethical standards for observable behavior analysis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-neutral-300 leading-relaxed">
          {/* Key Principle 1 */}
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-white/5 space-y-1">
            <div className="font-semibold text-neutral-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Observable Surface Signals Only</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              This application estimates visible facial geometry, mouth curvature, brow contraction, and ocular reflection. It does NOT read thoughts, know feelings, or deduce internal mental states.
            </p>
          </div>

          {/* Key Principle 2 */}
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-white/5 space-y-1">
            <div className="font-semibold text-neutral-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Non-Diagnostic Notice</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              No medical, clinical, deception (lie-detection), or psychiatric claims are made. Expressions vary across cultural backgrounds, neurodiversity, and environmental contexts.
            </p>
          </div>

          {/* Key Principle 3 */}
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-white/5 space-y-1">
            <div className="font-semibold text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Local In-Memory Computation</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              Frames captured by your webcam are analyzed in volatile browser canvas memory and instantly discarded. No video streams or biometric signatures are recorded or uploaded.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
