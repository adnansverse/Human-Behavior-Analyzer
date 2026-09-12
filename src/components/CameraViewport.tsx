import React, { useEffect, useRef } from 'react';
import {
  Camera,
  AlertCircle,
  VideoOff,
  Users,
  Eye,
  Crosshair,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { CameraStatus, ObservableSignals, AppSettings } from '../types';

interface CameraViewportProps {
  status: CameraStatus;
  signals: ObservableSignals;
  settings: AppSettings;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onRequestCamera: () => void;
  onUseDemoMode: () => void;
  isDemoMode: boolean;
}

export const CameraViewport: React.FC<CameraViewportProps> = ({
  status,
  signals,
  settings,
  videoRef,
  canvasRef,
  onRequestCamera,
  onUseDemoMode,
  isDemoMode,
}) => {
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw HUD overlay on top of video
  useEffect(() => {
    const canvas = hudCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Synchronize canvas coordinate dimensions with actual element size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // If not analyzing or paused, don't draw tracking reticles
    if (status !== 'analyzing' && status !== 'paused') {
      return;
    }

    if (!settings.showHudOverlay) return;

    // Subtle facial bounding brackets
    const face = signals.faceBox;
    if (face && signals.facesDetected === 1) {
      // Scale normalized or raw coords to canvas dimensions
      const scaleX = w / 480; // normalized internal analysis resolution
      const scaleY = h / 360;

      const bx = Math.max(10, face.x * scaleX);
      const by = Math.max(10, face.y * scaleY);
      const bw = Math.min(w - bx - 10, face.width * scaleX);
      const bh = Math.min(h - by - 10, face.height * scaleY);
      const cornerLen = Math.min(24, bw * 0.18);

      ctx.strokeStyle = status === 'analyzing' ? 'rgba(56, 189, 248, 0.75)' : 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 1.5;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + cornerLen);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + cornerLen, by);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - cornerLen, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - cornerLen);
      ctx.lineTo(bx, by + bh);
      ctx.lineTo(bx + cornerLen, by + bh);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - cornerLen, by + bh);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + bw, by + bh - cornerLen);
      ctx.stroke();

      // Gaze vector / crosshair overlay
      if (settings.showGazeVector) {
        const eyeY = by + bh * 0.32;
        const leftEyeX = bx + bw * 0.33;
        const rightEyeX = bx + bw * 0.67;

        const gazeShiftX = signals.gazeCoordinates.x * 12;
        const gazeShiftY = signals.gazeCoordinates.y * 10;

        ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
        // Left pupil
        ctx.beginPath();
        ctx.arc(leftEyeX + gazeShiftX, eyeY + gazeShiftY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Right pupil
        ctx.beginPath();
        ctx.arc(rightEyeX + gazeShiftX, eyeY + gazeShiftY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Subtle eye contour
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(leftEyeX, eyeY, 10, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(rightEyeX, eyeY, 10, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Mouth indicator
      if (settings.showLandmarkPoints) {
        const mouthY = by + bh * 0.78;
        const mouthCenterX = bx + bw * 0.5;
        const mouthW = bw * 0.28;
        const isHappy = signals.estimatedExpression === 'Happy-looking';
        const isSad = signals.estimatedExpression === 'Sad-looking';

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(mouthCenterX - mouthW / 2, mouthY + (isSad ? 2 : 0));
        ctx.quadraticCurveTo(
          mouthCenterX,
          mouthY + (isHappy ? 5 : isSad ? -4 : 1),
          mouthCenterX + mouthW / 2,
          mouthY + (isSad ? 2 : 0)
        );
        ctx.stroke();
      }
    }
  }, [status, signals, settings]);

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] max-h-[560px] bg-neutral-900/90 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center transition-all">
      {/* Hidden processing canvas used for background optical analysis */}
      <canvas ref={canvasRef} width="480" height="360" className="hidden" />

      {/* HTML5 Live Video stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
          status === 'idle' || status === 'permission-denied' || status === 'unavailable'
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100'
        }`}
      />

      {/* Real-time HUD Drawing Canvas (Overlaid on top of video) */}
      <canvas
        ref={hudCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Subtle scanline / optical grain layer */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_60%,_rgba(0,0,0,0.45)_100%)] z-10" />

      {/* TOP HUD BAR (During active analysis) */}
      {(status === 'analyzing' || status === 'paused' || status === 'ready') && (
        <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-white/10 text-xs font-mono text-neutral-200 flex items-center gap-1.5 shadow-sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === 'analyzing' ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] uppercase tracking-wider text-neutral-400">
                {isDemoMode ? 'SIMULATED SUBJECT' : 'SENSOR FEED'}
              </span>
            </div>

            {isDemoMode && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                <Sparkles className="w-2.5 h-2.5" /> Test Stream
              </span>
            )}
          </div>

          {/* Face tracking state badge */}
          <div className="flex items-center gap-2">
            {signals.facesDetected === 1 && (
              <div className="px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-white/10 text-xs font-mono text-neutral-300 flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-cyan-400" />
                <span className="text-[11px]">Face Tracked (1)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM HUD TELEMETRY OVERLAY (Glanceable in video area) */}
      {status === 'analyzing' && signals.facesDetected === 1 && (
        <div className="absolute bottom-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2">
            {/* Expression glance */}
            <div className="px-3 py-1.5 rounded-lg bg-neutral-950/85 backdrop-blur-md border border-white/10 text-xs text-neutral-100 flex items-center gap-2 shadow-sm">
              <span className="text-neutral-400 text-[11px]">EST. EXPRESSION:</span>
              <span className="font-semibold text-cyan-300">{signals.estimatedExpression}</span>
              <span className="text-[10px] font-mono text-neutral-400">({signals.confidence}%)</span>
            </div>

            {/* Attention glance */}
            <div className="hidden sm:flex px-3 py-1.5 rounded-lg bg-neutral-950/85 backdrop-blur-md border border-white/10 text-xs text-neutral-100 items-center gap-2 shadow-sm">
              <span className="text-neutral-400 text-[11px]">ATTENTION:</span>
              <span className="font-semibold text-emerald-400">{signals.visualAttention}%</span>
              <span className="text-[10px] text-neutral-400">({signals.attentionStatus})</span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-400">
            MOV: {signals.movementActivity}% • GAZE: {signals.gazeDirection}
          </div>
        </div>
      )}

      {/* MULTIPLE FACES DETECTED BANNER */}
      {signals.facesDetected > 1 && status === 'analyzing' && (
        <div className="absolute top-14 inset-x-4 z-20 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-2.5 rounded-xl bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5 shadow-lg max-w-md text-center backdrop-blur-md">
            <Users className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Multiple faces detected. Please keep one person in the frame for more consistent analysis.</span>
          </div>
        </div>
      )}

      {/* NO FACE DETECTED BANNER */}
      {signals.facesDetected === 0 && status === 'analyzing' && (
        <div className="absolute top-14 inset-x-4 z-20 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-2.5 rounded-xl bg-neutral-950/90 border border-white/15 text-neutral-300 text-xs flex items-center gap-2.5 shadow-lg max-w-md text-center backdrop-blur-md">
            <Eye className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span>No face detected in frame. Please center face toward camera with even lighting.</span>
          </div>
        </div>
      )}

      {/* PAUSED BANNER OVERLAY */}
      {status === 'paused' && (
        <div className="absolute inset-0 z-20 bg-neutral-950/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-center p-4">
          <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-100">Analysis Paused</h3>
          <p className="text-xs text-neutral-400 max-w-xs">
            Observable tracking is temporarily suspended. Video stream remains active.
          </p>
        </div>
      )}

      {/* STATE: IDLE / FIRST LAUNCH */}
      {status === 'idle' && (
        <div className="z-20 flex flex-col items-center justify-center gap-4 text-center p-6 max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-cyan-400 shadow-inner">
            <Camera className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-medium text-neutral-100">Ready to Analyze Observable Behavior</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Camera access is required for live visual analysis. All frame analysis runs locally in your browser. No video is ever stored or uploaded.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
            <button
              type="button"
              onClick={onRequestCamera}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold tracking-wide transition-all shadow-md active:scale-[0.98]"
            >
              <Camera className="w-4 h-4" />
              Enable Camera
            </button>
            <button
              type="button"
              onClick={onUseDemoMode}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-white/10 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Use Simulated Feed
            </button>
          </div>
        </div>
      )}

      {/* STATE: CONNECTING */}
      {status === 'connecting' && (
        <div className="z-20 flex flex-col items-center justify-center gap-3 text-center p-6">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <h3 className="text-sm font-medium text-neutral-100">Initializing Optical Sensor</h3>
          <p className="text-xs text-neutral-400">Requesting browser camera permissions…</p>
        </div>
      )}

      {/* STATE: PERMISSION DENIED */}
      {status === 'permission-denied' && (
        <div className="z-20 flex flex-col items-center justify-center gap-3.5 text-center p-6 max-w-md">
          <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-neutral-100">Camera Permission Required</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Camera access was denied or blocked by your browser settings. To enable:
            </p>
          </div>
          <div className="text-left bg-neutral-950/90 border border-white/10 rounded-xl p-3 text-[11px] text-neutral-300 space-y-1.5 w-full">
            <p>1. Click the lock or camera icon in your browser address bar.</p>
            <p>2. Select &ldquo;Allow&rdquo; for Camera access on this page.</p>
            <p>3. Click &ldquo;Retry Connection&rdquo; below, or switch to the simulated feed.</p>
          </div>
          <div className="flex items-center gap-2 w-full pt-1">
            <button
              type="button"
              onClick={onRequestCamera}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-white/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
            <button
              type="button"
              onClick={onUseDemoMode}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Try Simulated Feed
            </button>
          </div>
        </div>
      )}

      {/* STATE: UNAVAILABLE */}
      {status === 'unavailable' && (
        <div className="z-20 flex flex-col items-center justify-center gap-3 text-center p-6 max-w-md">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400">
            <VideoOff className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-neutral-100">Camera Device Unavailable</h3>
            <p className="text-xs text-neutral-400">
              No operational camera device was detected on your hardware, or the device is occupied by another application.
            </p>
          </div>
          <button
            type="button"
            onClick={onUseDemoMode}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Launch With Simulated Subject
          </button>
        </div>
      )}
    </div>
  );
};
