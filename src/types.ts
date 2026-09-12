export type HumanFriendlyExpression =
  | 'Very Happy'
  | 'Happy'
  | 'Neutral'
  | 'Sad'
  | 'Angry'
  | 'Surprised'
  | 'Confused'
  | 'Awkward'
  | 'Fearful'
  | 'Disgusted';

export type EstimatedExpression =
  | 'Neutral'
  | 'Happy-looking'
  | 'Sad-looking'
  | 'Angry-looking'
  | 'Surprised-looking'
  | 'Fearful-looking'
  | 'Disgusted-looking'
  | 'Confused-looking';

export type ExpressionIntensity = 'Low' | 'Moderate' | 'High';

export type AttentionStatus =
  | 'Looking toward camera'
  | 'Looking away'
  | 'Mostly attentive'
  | 'Slight gaze divergence'
  | 'Attentive'
  | 'Intermittent focus';

export type GazeDirection = 'Center' | 'Left' | 'Right' | 'Up' | 'Down';

export type CameraStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'analyzing'
  | 'paused'
  | 'permission-denied'
  | 'unavailable'
  | 'no-face'
  | 'multiple-faces'
  | 'face-partially-visible'
  | 'session-ended';

export type ScanMode = 'quick-15' | 'quick-30' | 'continuous';

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObservableSignals {
  estimatedExpression: EstimatedExpression;
  humanExpression: HumanFriendlyExpression;
  confidence: number; // 0 - 100
  intensity: ExpressionIntensity;
  expressionDistribution: Record<EstimatedExpression, number>; // percentages
  visualAttention: number; // 0 - 100
  attentionStatus: AttentionStatus;
  gazeDirection: GazeDirection;
  gazeCoordinates: { x: number; y: number }; // normalized -1 to 1
  blinkRateEstimate: number; // blinks per minute estimate
  movementActivity: number; // 0 - 100
  headOrientationEstimate: { yaw: number; pitch: number; roll: number };
  facesDetected: number;
  faceBox: FaceBoundingBox | null;
  overallEngagement: number; // 0 - 100
}

export interface TimelineEvent {
  id: string;
  timestampSeconds: number;
  formattedTime: string;
  expression: EstimatedExpression;
  humanExpression: HumanFriendlyExpression;
  confidence: number;
  attentionScore: number;
  intensity: ExpressionIntensity;
  engagementScore: number;
}

export interface SimpleTimelineSegment {
  id: string;
  expression: HumanFriendlyExpression;
  emoji: string;
  startSeconds: number;
  endSeconds: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  durationSeconds: number;
  formattedDuration: string;
  attentionScore: number;
}

export interface ExpressionDuration {
  expression: HumanFriendlyExpression;
  emoji: string;
  seconds: number;
  formattedDuration: string;
  percentage: number;
}

export interface SimplifiedBehaviorChange {
  icon: 'up' | 'down' | 'stable';
  text: string;
  detail?: string;
  formattedTime?: string;
}

export interface BehaviorChangeObservation {
  id: string;
  timestampSeconds: number;
  formattedTime: string;
  observation: string; // The strictly factual observed signal change
  interpretation: string; // The cautious context-limited observational note
  type: 'positive-shift' | 'negative-shift' | 'attention-drop' | 'attention-rise' | 'movement-increase' | 'stability';
  magnitude: 'subtle' | 'noticeable' | 'significant';
}

export interface SessionBaseline {
  averageAttention: number;
  averageEngagement: number;
  averageMovement: number;
  expressionCounts: Record<EstimatedExpression, number>;
  sampleCount: number;
  peakAttention: number;
  lowestAttention: number;
}

export interface SessionSummaryData {
  durationSeconds: number;
  formattedDuration: string;
  dominantExpression: HumanFriendlyExpression;
  dominantEmoji: string;
  dominantDuration: string;
  dominantOneSentence: string;
  expressionDurations: ExpressionDuration[];
  simpleTimeline: SimpleTimelineSegment[];
  simplifiedChanges: SimplifiedBehaviorChange[];
  attentionSummary: {
    average: number;
    peak: number;
    statusLabel: string;
    lookedTowardSeconds: number;
    lookedAwaySeconds: number;
    formattedToward: string;
    formattedAway: string;
  };
  engagementSummary: {
    score: number;
    label: string;
    description: string;
  };
  // Detailed legacy data for Full Analysis view
  peakAttention: number;
  averageAttention: number;
  overallEngagement: number;
  majorChangesCount: number;
  timelineEvents: TimelineEvent[];
  observations: BehaviorChangeObservation[];
  observationalSummaryText: string;
  startedAt: string;
  endedAt: string;
}

export interface AppSettings {
  // General
  theme: 'dark-glass' | 'high-contrast';
  showHudOverlay: boolean;
  showLandmarkPoints: boolean;
  showGazeVector: boolean;
  enableSubtleAudio: boolean;
  
  // Analysis
  sensitivity: 'low' | 'balanced' | 'high';
  samplingRateHz: 2 | 5 | 10;
  baselineWindowSeconds: 15 | 30 | 60;
  confidenceThreshold: number; // minimum confidence to display specific expression
  
  // Accessibility
  reducedMotion: boolean;
  fontSize: 'standard' | 'medium' | 'large';
  highContrast: boolean;

  // Privacy
  localProcessingConfirmed: boolean;
}

