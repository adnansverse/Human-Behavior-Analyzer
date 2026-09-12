import React, { useEffect, useRef, useState } from 'react';
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
  Scan,
  CheckCircle2,
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
  scanProgress?: number; // 0 - 100
  scanPresetSeconds?: number;
  elapsedSeconds?: number;
}

const ROTATING_SCAN_MESSAGES = [
  'Finding your face…',
  'Face detected',
  'Reading expression…',
  'Checking attention…',
  'Tracking changes…',
  'Analyzing reactions…',
  'Calibrating baseline…',
  'Synthesizing signals…',
  'Almost done…',
];

export const CameraViewport: React.FC<CameraViewportProps> = ({
  status,
  signals,
  settings,
  videoRef,
  canvasRef,
  onRequestCamera,
  onUseDemoMode,
  isDemoMode,
  scanProgress = 0,
  scanPresetSeconds = 15,
  elapsedSeconds = 0,
}) => {
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanLineOffsetRef = useRef<number>(0);
  const scanLineDirRef = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);

  // Rotating status message index
  const [statusMessageIndex, setStatusMessageIndex] = useState<number>(0);

  // Smooth face detection message sequence
  useEffect(() => {
    if (status !== 'analyzing') {
      setStatusMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStatusMessageIndex((prev) => (prev + 1) % ROTATING_SCAN_MESSAGES.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [status]);

  // Optical Scanning Animation Loop on HUD Canvas
  useEffect(() => {
    const canvas = hudCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();

    const renderHud = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      // Sync canvas dimensions
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Only render optical scan animations when analyzing or paused
      if (status === 'analyzing' || status === 'paused') {
        const face = signals.faceBox;

        if (face && signals.facesDetected === 1 && settings.showHudOverlay) {
          const scaleX = w / 480;
          const scaleY = h / 360;

          const bx = Math.max(8, face.x * scaleX);
          const by = Math.max(8, face.y * scaleY);
          const bw = Math.min(w - bx - 8, face.width * scaleX);
          const bh = Math.min(h - by - 8, face.height * scaleY);
          const cornerLen = Math.min(26, bw * 0.2);

          // 1. SUBTLE PULSE AURA AROUND FACE
          const pulse = (Math.sin(elapsed * 3) + 1) * 0.5; // 0 to 1
          const auraPad = 6 + pulse * 6;
          ctx.save();
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.1 + pulse * 0.15})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(
            bx - auraPad,
            by - auraPad,
            bw + auraPad * 2,
            bh + auraPad * 2,
            16
          );
          ctx.stroke();
          ctx.restore();

          // 2. CORNER TARGET BRACKETS
          ctx.strokeStyle = status === 'analyzing' ? 'rgba(56, 189, 248, 0.85)' : 'rgba(251, 191, 36, 0.7)';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';

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

          // Thin outer bounding guide
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, by, bw, bh);

          // 3. MOVING OPTICAL SCAN LINE (Vertical Laser Sweep)
          if (status === 'analyzing') {
            const scanSpeed = 1.4; // cycles per second
            scanLineOffsetRef.current += 0.016 * scanSpeed * scanLineDirRef.current;
            if (scanLineOffsetRef.current >= 1) {
              scanLineOffsetRef.current = 1;
              scanLineDirRef.current = -1;
            } else if (scanLineOffsetRef.current <= 0) {
              scanLineOffsetRef.current = 0;
              scanLineDirRef.current = 1;
            }

            const scanY = by + bh * scanLineOffsetRef.current;

            ctx.save();
            // Gradient trail behind the scan line
            const gradHeight = 36;
            const grad = ctx.createLinearGradient(
              bx,
              scanY - (scanLineDirRef.current > 0 ? gradHeight : -gradHeight),
              bx,
              scanY
            );
            grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0.22)');
            ctx.fillStyle = grad;
            ctx.fillRect(
              bx + 2,
              scanLineDirRef.current > 0 ? scanY - gradHeight : scanY,
              bw - 4,
              gradHeight
            );

            // The bright laser scan line itself
            ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(bx + 4, scanY);
            ctx.lineTo(bx + bw - 4, scanY);
            ctx.stroke();

            // Tiny left & right crosshair pips on the scanline
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(bx, scanY - 2, 4, 4);
            ctx.fillRect(bx + bw - 4, scanY - 2, 4, 4);
            ctx.restore();
          }

          // 4. FACIAL LANDMARK POINTS (Precision Tracking Dots)
          if (settings.showLandmarkPoints) {
            const eyeY = by + bh * 0.35;
            const leftEyeX = bx + bw * 0.33;
            const rightEyeX = bx + bw * 0.67;
            const noseBridgeY = by + bh * 0.44;
            const noseTipY = by + bh * 0.56;
            const noseCenterX = bx + bw * 0.5;
            const mouthY = by + bh * 0.74;
            const mouthW = bw * 0.26;
            const chinY = by + bh * 0.92;

            const gazeShiftX = signals.gazeCoordinates.x * 10;
            const gazeShiftY = signals.gazeCoordinates.y * 8;

            ctx.save();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';

            // Landmarks array
            const landmarks: Array<[number, number, number]> = [
              // Forehead center
              [bx + bw * 0.5, by + bh * 0.18, 1.8],
              // Eyebrow peaks
              [bx + bw * 0.31, by + bh * 0.27, 1.5],
              [bx + bw * 0.69, by + bh * 0.27, 1.5],
              // Nose bridge & tip
              [noseCenterX, noseBridgeY, 1.8],
              [noseCenterX, noseTipY, 2.2],
              // Pupils with gaze tracking offset
              [leftEyeX + gazeShiftX, eyeY + gazeShiftY, 2.5],
              [rightEyeX + gazeShiftX, eyeY + gazeShiftY, 2.5],
              // Eye corners
              [leftEyeX - 10, eyeY, 1.3],
              [leftEyeX + 10, eyeY, 1.3],
              [rightEyeX - 10, eyeY, 1.3],
              [rightEyeX + 10, eyeY, 1.3],
              // Mouth corners & lips
              [noseCenterX - mouthW / 2, mouthY, 2],
              [noseCenterX + mouthW / 2, mouthY, 2],
              [noseCenterX, mouthY - 3, 1.5],
              [noseCenterX, mouthY + 3, 1.5],
              // Chin & jaw contour points
              [noseCenterX, chinY, 2],
              [bx + bw * 0.2, by + bh * 0.78, 1.5],
              [bx + bw * 0.8, by + bh * 0.78, 1.5],
            ];

            landmarks.forEach(([lx, ly, radius]) => {
              ctx.beginPath();
              ctx.arc(lx, ly, radius, 0, Math.PI * 2);
              ctx.fill();
            });

            // Gaze vector line from pupils
            if (settings.showGazeVector) {
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(leftEyeX + gazeShiftX, eyeY + gazeShiftY);
              ctx.lineTo(leftEyeX + gazeShiftX * 2.2, eyeY + gazeShiftY * 2.2);
              ctx.moveTo(rightEyeX + gazeShiftX, eyeY + gazeShiftY);
              ctx.lineTo(rightEyeX + gazeShiftX * 2.2, eyeY + gazeShiftY * 2.2);
              ctx.stroke();
            }

            ctx.restore();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(renderHud);
    };

    animFrameRef.current = requestAnimationFrame(renderHud);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status, signals, settings]);

  // Get active face status message
  const getFaceFeedbackMessage = () => {
    if (signals.facesDetected === 0) {
      return 'Move into frame';
    }
    if (signals.facesDetected > 1) {
      return 'One person at a time';
    }
    if (signals.faceBox && (signals.faceBox.x < 15 || signals.faceBox.x + signals.faceBox.width > 465)) {
      return 'Keep your face centered';
    }
    return ROTATING_SCAN_MESSAGES[statusMessageIndex];
  };

  const currentMessage = getFaceFeedbackMessage();

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] max-h-[540px] bg-neutral-900/90 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center transition-all">
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

      {/* Subtle scanline / optical vignette layer */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_65%,_rgba(0,0,0,0.55)_100%)] z-10" />

      {/* TOP SCANNING TELEMETRY BAR */}
      {(status === 'analyzing' || status === 'paused' || status === 'ready') && (
        <div className="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between pointer-events-none">
          {/* Feed mode pill */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/10 text-xs font-mono text-neutral-200 flex items-center gap-2 shadow-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'analyzing' ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] uppercase tracking-wider text-neutral-300 font-semibold">
                {isDemoMode ? 'SIMULATED FEED' : 'OPTICAL SENSOR'}
              </span>
            </div>

            {isDemoMode && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                <Sparkles className="w-3 h-3" /> Test Subject
              </span>
            )}
          </div>

          {/* Minimalist Progress Indicator during Scan */}
          {status === 'analyzing' && (
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-neutral-950/85 backdrop-blur-md border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-md">
              <Scan className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="font-semibold tracking-wide">
                SCANNING {scanProgress > 0 ? `${scanProgress}%` : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC ROTATING STATUS MESSAGE (CENTERED / HIGHLY VISIBLE IN SCANNING MODE) */}
      {status === 'analyzing' && (
        <div className="absolute top-14 inset-x-0 z-20 flex items-center justify-center pointer-events-none px-4">
          <div className="px-4 py-1.5 rounded-full bg-neutral-950/85 backdrop-blur-md border border-cyan-500/30 text-xs font-medium text-cyan-200 flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{currentMessage}</span>
          </div>
        </div>
      )}

      {/* SCANNING PROGRESS BAR ACROSS TOP */}
      {status === 'analyzing' && scanProgress > 0 && (
        <div className="absolute top-0 inset-x-0 h-1 bg-neutral-900/80 z-30">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-300 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
            style={{ width: `${scanProgress}%` }}
          />
        </div>
      )}

      {/* REAL-TIME DETECTION POPUP BANNER (IF ISSUES ARISE) */}
      {status === 'analyzing' && signals.facesDetected === 0 && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none p-4 bg-black/20 backdrop-blur-[2px]">
          <div className="px-5 py-3 rounded-2xl bg-neutral-950/90 border border-white/15 text-neutral-200 text-xs flex items-center gap-3 shadow-xl max-w-sm text-center">
            <Eye className="w-5 h-5 text-cyan-400 flex-shrink-0 animate-pulse" />
            <div className="text-left">
              <div className="font-semibold text-white">Move into frame</div>
              <div className="text-[11px] text-neutral-400">Position your face within the camera view</div>
            </div>
          </div>
        </div>
      )}

      {status === 'analyzing' && signals.facesDetected > 1 && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none p-4 bg-black/20 backdrop-blur-[2px]">
          <div className="px-5 py-3 rounded-2xl bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-3 shadow-xl max-w-sm text-center">
            <Users className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-white">One person at a time</div>
              <div className="text-[11px] text-amber-300/80">Multiple subjects detected in active frame</div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM HUD TELEMETRY OVERLAY (Glanceable Quick Expression & Attention) */}
      {status === 'analyzing' && signals.facesDetected === 1 && (
        <div className="absolute bottom-3.5 inset-x-3.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2">
            {/* Expression Indicator */}
            <div className="px-3.5 py-1.5 rounded-full bg-neutral-950/85 backdrop-blur-md border border-white/10 text-xs text-neutral-100 flex items-center gap-2 shadow-sm">
              <span className="text-base">
                {signals.humanExpression === 'Happy' || signals.humanExpression === 'Very Happy'
                  ? '🙂'
                  : signals.humanExpression === 'Neutral'
                  ? '😐'
                  : signals.humanExpression === 'Surprised'
                  ? '😲'
                  : signals.humanExpression === 'Confused'
                  ? '🤨'
                  : signals.humanExpression === 'Sad'
                  ? '😔'
                  : '😐'}
              </span>
              <span className="font-semibold text-cyan-300">{signals.humanExpression}</span>
              <span className="text-[10px] font-mono text-neutral-400">({signals.confidence}%)</span>
            </div>

            {/* Attention Glance */}
            <div className="hidden sm:flex px-3.5 py-1.5 rounded-full bg-neutral-950/85 backdrop-blur-md border border-white/10 text-xs text-neutral-100 items-center gap-2 shadow-sm">
              <span className="text-neutral-400 text-[11px] font-mono uppercase">Attention</span>
              <span className="font-semibold text-emerald-400">{signals.visualAttention}%</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-400">
            GAZE: {signals.gazeDirection} • BLINK: {signals.blinkRateEstimate} bpm
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
            Face tracking is paused. Click resume to continue recording session.
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
            <h2 className="text-base font-medium text-neutral-100">Ready to Scan Human Behavior</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Camera access is needed for live facial scan. All processing stays strictly local in your browser.
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
              Simulated Feed
            </button>
          </div>
        </div>
      )}

      {/* STATE: CONNECTING */}
      {status === 'connecting' && (
        <div className="z-20 flex flex-col items-center justify-center gap-3 text-center p-6">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <h3 className="text-sm font-medium text-neutral-100">Connecting Camera</h3>
          <p className="text-xs text-neutral-400">Requesting local browser camera permissions…</p>
        </div>
      )}

      {/* STATE: PERMISSION DENIED */}
      {status === 'permission-denied' && (
        <div className="z-20 flex flex-col items-center justify-center gap-3.5 text-center p-6 max-w-md">
          <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-neutral-100">Camera Permission Needed</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Camera access was denied. Please allow camera access in your browser or launch the simulated feed.
            </p>
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
            <h3 className="text-sm font-semibold text-neutral-100">No Camera Found</h3>
            <p className="text-xs text-neutral-400">
              No operational camera device was detected. You can test the analyzer with the simulated subject feed.
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
