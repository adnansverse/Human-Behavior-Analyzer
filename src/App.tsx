import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CameraStatus,
  ObservableSignals,
  TimelineEvent,
  BehaviorChangeObservation,
  SessionSummaryData,
  AppSettings,
} from './types';
import {
  DEFAULT_OBSERVABLE_SIGNALS,
  BehaviorAnalysisEngine,
  formatTime,
} from './services/analyzer';
import { playSubtleChime } from './services/audioCue';
import { Header } from './components/Header';
import { CameraViewport } from './components/CameraViewport';
import { InstrumentControls } from './components/InstrumentControls';
import { Dashboard } from './components/Dashboard';
import { QuickResultView } from './components/QuickResultView';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyModal } from './components/PrivacyBanner';
import { ShieldCheck, CheckCircle2, Scan } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark-glass',
  showHudOverlay: true,
  showLandmarkPoints: true,
  showGazeVector: true,
  enableSubtleAudio: true,
  sensitivity: 'balanced',
  samplingRateHz: 5,
  baselineWindowSeconds: 30,
  confidenceThreshold: 60,
  reducedMotion: false,
  fontSize: 'standard',
  highContrast: false,
  localProcessingConfirmed: true,
};

export default function App() {
  // State: Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('hba_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // State: Camera & Session
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Scan Preset & Progress
  const [scanPresetSeconds, setScanPresetSeconds] = useState<number>(15); // 15s Quick Scan by default
  const [isFinishingScan, setIsFinishingScan] = useState<boolean>(false);

  // State: Signals & Telemetry
  const [signals, setSignals] = useState<ObservableSignals>(DEFAULT_OBSERVABLE_SIGNALS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [observations, setObservations] = useState<BehaviorChangeObservation[]>([]);

  // State: Dashboard Expansion (MANDATORY REQUIREMENT: HIDDEN INITIALLY)
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);

  // Modals & Summary
  const [summaryData, setSummaryData] = useState<SessionSummaryData | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const engineRef = useRef<BehaviorAnalysisEngine>(
    new BehaviorAnalysisEngine(settings.baselineWindowSeconds, settings.sensitivity)
  );
  const animationFrameId = useRef<number | null>(null);
  const lastSampleTime = useRef<number>(0);
  const demoAnimPhase = useRef<number>(0);

  // Save settings changes
  useEffect(() => {
    try {
      localStorage.setItem('hba_settings', JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
    engineRef.current.updateConfig(settings.baselineWindowSeconds, settings.sensitivity);
  }, [settings]);

  // Handle Session Elapsed Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status === 'analyzing') {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Stop camera media tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Request & Initialize Real Camera
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setIsDemoMode(false);
    setStatus('connecting');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('unavailable');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('ready');
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setStatus('permission-denied');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setStatus('unavailable');
      } else {
        setStatus('permission-denied');
      }
    }
  }, [facingMode, stopCameraStream]);

  // Flip front/rear camera
  const handleFlipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  useEffect(() => {
    if (status === 'ready' || status === 'analyzing') {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Activate Simulated Subject Feed (Ensures 100% functionality even in iframes or no-webcam environments)
  const enableDemoMode = useCallback(() => {
    stopCameraStream();
    setIsDemoMode(true);
    setStatus('ready');
  }, [stopCameraStream]);

  // Primary Session Actions
  const handleStartAnalysis = useCallback(() => {
    if (status === 'idle' && !isDemoMode) {
      startCamera().then(() => {
        setStatus('analyzing');
        if (!sessionStartTime) setSessionStartTime(new Date());
        if (settings.enableSubtleAudio) playSubtleChime('start');
      });
      return;
    }
    setStatus('analyzing');
    if (!sessionStartTime) setSessionStartTime(new Date());
    if (settings.enableSubtleAudio) playSubtleChime('start');
  }, [status, isDemoMode, sessionStartTime, settings.enableSubtleAudio, startCamera]);

  const handlePauseAnalysis = useCallback(() => {
    setStatus('paused');
    if (settings.enableSubtleAudio) playSubtleChime('pause');
  }, [settings.enableSubtleAudio]);

  const handleResumeAnalysis = useCallback(() => {
    setStatus('analyzing');
    if (settings.enableSubtleAudio) playSubtleChime('start');
  }, [settings.enableSubtleAudio]);

  // End session & compute One-Glance summary
  const handleEndSession = useCallback(() => {
    if (isFinishingScan) return;
    setIsFinishingScan(true);

    if (settings.enableSubtleAudio) {
      playSubtleChime('complete');
    }

    // Brief smooth settling transition (800ms)
    setTimeout(() => {
      setStatus('session-ended');
      setIsFinishingScan(false);

      const summary = engineRef.current.generateSessionSummary(
        elapsedSeconds,
        timelineEvents,
        observations,
        sessionStartTime || new Date()
      );

      if (summary) {
        setSummaryData(summary);
      }
    }, 700);
  }, [
    isFinishingScan,
    settings.enableSubtleAudio,
    elapsedSeconds,
    timelineEvents,
    observations,
    sessionStartTime,
  ]);

  // Check automated preset completion
  useEffect(() => {
    if (
      status === 'analyzing' &&
      scanPresetSeconds > 0 &&
      elapsedSeconds >= scanPresetSeconds &&
      !isFinishingScan
    ) {
      handleEndSession();
    }
  }, [status, scanPresetSeconds, elapsedSeconds, isFinishingScan, handleEndSession]);

  const handleResetSession = useCallback(() => {
    engineRef.current.reset();
    setElapsedSeconds(0);
    setTimelineEvents([]);
    setObservations([]);
    setSessionStartTime(null);
    setSummaryData(null);
    setStatus('ready');
  }, []);

  const handleClearSessionData = useCallback(() => {
    engineRef.current.reset();
    setTimelineEvents([]);
    setObservations([]);
    setElapsedSeconds(0);
    setSessionStartTime(null);
    setSummaryData(null);
  }, []);

  // Main Optical Frame Processing Loop
  useEffect(() => {
    const processFrame = (timestamp: number) => {
      const sampleIntervalMs = 1000 / settings.samplingRateHz;

      if (timestamp - lastSampleTime.current >= sampleIntervalMs) {
        lastSampleTime.current = timestamp;

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (isDemoMode) {
              // Draw synthetic subject onto processing canvas
              demoAnimPhase.current += 0.05;
              const p = demoAnimPhase.current;

              ctx.fillStyle = '#171923';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // Head & face silhouette
              const cx = canvas.width / 2 + Math.sin(p * 0.4) * 15;
              const cy = canvas.height / 2 + Math.cos(p * 0.3) * 6;
              const headW = 140;
              const headH = 180;

              // Face fill (skin-tone heuristic compliant)
              ctx.fillStyle = '#b78065';
              ctx.beginPath();
              ctx.ellipse(cx, cy, headW / 2, headH / 2, 0, 0, Math.PI * 2);
              ctx.fill();

              // Eyes
              const eyeY = cy - 20;
              const leftEyeX = cx - 35;
              const rightEyeX = cx + 35;

              ctx.fillStyle = '#222';
              ctx.beginPath();
              ctx.arc(leftEyeX + Math.sin(p * 0.6) * 4, eyeY, 4, 0, Math.PI * 2);
              ctx.arc(rightEyeX + Math.sin(p * 0.6) * 4, eyeY, 4, 0, Math.PI * 2);
              ctx.fill();

              // Mouth
              ctx.strokeStyle = '#6b3e2e';
              ctx.lineWidth = 3;
              ctx.beginPath();
              const smileOffset = Math.sin(p * 0.25) * 6;
              ctx.moveTo(cx - 25, cy + 45);
              ctx.quadraticCurveTo(cx, cy + 45 + smileOffset, cx + 25, cy + 45);
              ctx.stroke();
            }

            if (status === 'analyzing') {
              const { signals: newSignals, newObservation } =
                engineRef.current.analyzeFrame(
                  canvas,
                  ctx,
                  isDemoMode ? null : videoRef.current,
                  elapsedSeconds
                );

              setSignals(newSignals);

              // Append to timeline log (keep throttled to 1 event per ~2s or expression change)
              setTimelineEvents((prev) => {
                const lastEvent = prev[prev.length - 1];
                const shouldLog =
                  !lastEvent ||
                  lastEvent.expression !== newSignals.estimatedExpression ||
                  elapsedSeconds - lastEvent.timestampSeconds >= 5;

                if (shouldLog) {
                  const newEv: TimelineEvent = {
                    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    timestampSeconds: elapsedSeconds,
                    formattedTime: formatTime(elapsedSeconds),
                    expression: newSignals.estimatedExpression,
                    humanExpression: newSignals.humanExpression || 'Neutral',
                    confidence: newSignals.confidence,
                    attentionScore: newSignals.visualAttention,
                    intensity: newSignals.intensity,
                    engagementScore: newSignals.overallEngagement,
                  };
                  return [...prev, newEv];
                }
                return prev;
              });

              // If behavior change observation detected
              if (newObservation) {
                setObservations((prev) => [...prev, newObservation]);
                if (settings.enableSubtleAudio) playSubtleChime('change');
              }
            }
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    animationFrameId.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [status, isDemoMode, elapsedSeconds, settings.samplingRateHz, settings.enableSubtleAudio]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (status === 'idle' || status === 'ready') handleStartAnalysis();
        else if (status === 'analyzing') handlePauseAnalysis();
        else if (status === 'paused') handleResumeAnalysis();
      } else if (e.key === 'd' || e.key === 'D') {
        setIsDashboardOpen((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        setIsSettingsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsPrivacyOpen(false);
        setIsSummaryModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleStartAnalysis, handlePauseAnalysis, handleResumeAnalysis]);

  // Clean up on unmount
  useEffect(() => {
    return () => stopCameraStream();
  }, [stopCameraStream]);

  // Scan progress calculation (0 - 100)
  const scanProgress =
    scanPresetSeconds > 0
      ? Math.min(100, Math.round((elapsedSeconds / scanPresetSeconds) * 100))
      : 0;

  // Sizing and theme classes
  const fontClass =
    settings.fontSize === 'large'
      ? 'text-[17px]'
      : settings.fontSize === 'medium'
      ? 'text-[15.5px]'
      : 'text-[14px]';

  const contrastClass = settings.highContrast
    ? 'border-white/30 text-white'
    : 'border-white/10 text-neutral-100';

  return (
    <div
      className={`min-h-screen bg-neutral-950 flex flex-col justify-between selection:bg-cyan-500/20 selection:text-cyan-200 ${fontClass} ${contrastClass}`}
    >
      {/* Top Application Header */}
      <Header
        status={status}
        elapsedSeconds={elapsedSeconds}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrivacyInfo={() => setIsPrivacyOpen(true)}
        audioEnabled={settings.enableSubtleAudio}
        onToggleAudio={() =>
          setSettings((prev) => ({ ...prev, enableSubtleAudio: !prev.enableSubtleAudio }))
        }
        isDashboardOpen={isDashboardOpen}
        onToggleDashboard={() => setIsDashboardOpen((prev) => !prev)}
      />

      {/* Main Analysis Instrument Workspace */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center gap-5">
        {/* Subtle Scientific Prudence Notice Banner */}
        <div className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-neutral-900/50 border border-white/5 text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400/80 flex-shrink-0" />
            <span>
              Real-time observable facial signals & visual attention • Surface indicators only • Non-diagnostic
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="hidden sm:inline text-neutral-400 hover:text-neutral-200 underline decoration-white/20 transition-colors"
          >
            Methodology & Privacy
          </button>
        </div>

        {/* TRANSITION OVERLAY WHEN FINISHING SCAN */}
        {isFinishingScan && (
          <div className="w-full p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 backdrop-blur-md flex items-center justify-center gap-3 text-cyan-300 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 animate-bounce" />
            <span className="text-sm font-semibold font-mono tracking-wide">
              Analysis complete — Synthesizing summary…
            </span>
          </div>
        )}

        {/* CASE 1: SCAN COMPLETE -> REVEAL QUICK RESULT VIEW (ONE-GLANCE SUMMARY SCREEN) */}
        {status === 'session-ended' && summaryData ? (
          <div className="w-full flex flex-col items-center gap-6">
            <QuickResultView
              summary={summaryData}
              onScanAgain={() => {
                handleResetSession();
                handleStartAnalysis();
              }}
              onToggleFullAnalysis={() => setIsDashboardOpen((prev) => !prev)}
              isFullAnalysisOpen={isDashboardOpen}
            />

            {/* EXPANDABLE DEEP ENGINEERING DASHBOARD */}
            {isDashboardOpen && (
              <div className="w-full pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <Dashboard
                  signals={signals}
                  timelineEvents={timelineEvents}
                  observations={observations}
                  currentDurationSeconds={elapsedSeconds}
                  settings={settings}
                  onClose={() => setIsDashboardOpen(false)}
                />
              </div>
            )}
          </div>
        ) : (
          /* CASE 2: ACTIVE SCANNING VIEWPORT (CAMERA, SCAN LASER, TRACKING POINTS & CONTROLS) */
          <div className="w-full flex flex-col items-center gap-4">
            <CameraViewport
              status={status}
              signals={signals}
              settings={settings}
              videoRef={videoRef}
              canvasRef={canvasRef}
              onRequestCamera={startCamera}
              onUseDemoMode={enableDemoMode}
              isDemoMode={isDemoMode}
              scanProgress={scanProgress}
              scanPresetSeconds={scanPresetSeconds}
              elapsedSeconds={elapsedSeconds}
            />

            {/* Instrument Controls Deck Directly Beneath Camera */}
            <InstrumentControls
              status={status}
              signals={signals}
              onStartAnalysis={handleStartAnalysis}
              onPauseAnalysis={handlePauseAnalysis}
              onResumeAnalysis={handleResumeAnalysis}
              onEndSession={handleEndSession}
              onResetSession={handleResetSession}
              onClearSessionData={handleClearSessionData}
              onFlipCamera={handleFlipCamera}
              onToggleDemoMode={() => {
                if (isDemoMode) startCamera();
                else enableDemoMode();
              }}
              isDemoMode={isDemoMode}
              isDashboardOpen={isDashboardOpen}
              onToggleDashboard={() => setIsDashboardOpen((prev) => !prev)}
              hasSessionData={timelineEvents.length > 0}
              scanPresetSeconds={scanPresetSeconds}
              onChangeScanPreset={(sec) => setScanPresetSeconds(sec)}
              onOpenSummary={() => {
                if (summaryData) {
                  setStatus('session-ended');
                } else {
                  handleEndSession();
                }
              }}
            />

            {/* EXPANDABLE DASHBOARD (HIDDEN INITIALLY) */}
            {isDashboardOpen && (
              <div className="w-full pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <Dashboard
                  signals={signals}
                  timelineEvents={timelineEvents}
                  observations={observations}
                  currentDurationSeconds={elapsedSeconds}
                  settings={settings}
                  onClose={() => setIsDashboardOpen(false)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Subtle Footer with Local Status */}
      <footer className="w-full border-t border-white/5 bg-neutral-950/70 px-4 sm:px-6 py-3 text-xs text-neutral-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              100% Local In-Browser Processing
            </span>
            <span className="text-neutral-500">•</span>
            <span>Zero Remote Storage</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-400">
            <span className="hidden md:inline font-mono">
              [Space] Play/Pause • [D] Dashboard • [S] Settings
            </span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Preferences
            </button>
          </div>
        </div>
      </footer>

      {/* Session Summary Modal (if opened directly) */}
      {isSummaryModalOpen && summaryData && (
        <SessionSummaryModal
          summary={summaryData}
          onClose={() => setIsSummaryModalOpen(false)}
          onStartNewSession={() => {
            setIsSummaryModalOpen(false);
            handleResetSession();
            handleStartAnalysis();
          }}
          onViewFullAnalysis={() => {
            setIsSummaryModalOpen(false);
            setIsDashboardOpen(true);
          }}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          onClearData={handleClearSessionData}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Privacy & Methodology Modal */}
      {isPrivacyOpen && <PrivacyModal onClose={() => setIsPrivacyOpen(false)} />}
    </div>
  );
}
