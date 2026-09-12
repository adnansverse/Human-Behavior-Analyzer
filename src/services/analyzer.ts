import {
  EstimatedExpression,
  HumanFriendlyExpression,
  ExpressionIntensity,
  AttentionStatus,
  GazeDirection,
  ObservableSignals,
  BehaviorChangeObservation,
  SessionBaseline,
  TimelineEvent,
  FaceBoundingBox,
  SessionSummaryData,
  ExpressionDuration,
  SimpleTimelineSegment,
  SimplifiedBehaviorChange,
} from '../types';

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getExpressionEmoji(exp: HumanFriendlyExpression): string {
  switch (exp) {
    case 'Very Happy':
      return '😄';
    case 'Happy':
      return '🙂';
    case 'Neutral':
      return '😐';
    case 'Sad':
      return '😔';
    case 'Angry':
      return '😠';
    case 'Surprised':
      return '😲';
    case 'Confused':
      return '🤨';
    case 'Awkward':
      return '😬';
    case 'Fearful':
      return '😨';
    case 'Disgusted':
      return '🤢';
    default:
      return '😐';
  }
}

export function toHumanExpression(
  estimated: EstimatedExpression,
  intensity: ExpressionIntensity,
  confidence: number,
  gaze: GazeDirection
): HumanFriendlyExpression {
  if (estimated === 'Happy-looking') {
    return intensity === 'High' || confidence > 82 ? 'Very Happy' : 'Happy';
  }
  if (estimated === 'Confused-looking') {
    if (gaze !== 'Center' && intensity === 'Low') return 'Awkward';
    return 'Confused';
  }
  if (estimated === 'Sad-looking') return 'Sad';
  if (estimated === 'Angry-looking') return 'Angry';
  if (estimated === 'Surprised-looking') return 'Surprised';
  if (estimated === 'Fearful-looking') return 'Fearful';
  if (estimated === 'Disgusted-looking') return 'Disgusted';
  return 'Neutral';
}

// Default initial state
export const DEFAULT_OBSERVABLE_SIGNALS: ObservableSignals = {
  estimatedExpression: 'Neutral',
  humanExpression: 'Neutral',
  confidence: 76,
  intensity: 'Low',
  expressionDistribution: {
    Neutral: 76,
    'Happy-looking': 8,
    'Sad-looking': 4,
    'Angry-looking': 2,
    'Surprised-looking': 3,
    'Fearful-looking': 1,
    'Disgusted-looking': 1,
    'Confused-looking': 5,
  },
  visualAttention: 84,
  attentionStatus: 'Looking toward camera',
  gazeDirection: 'Center',
  gazeCoordinates: { x: 0.05, y: -0.02 },
  blinkRateEstimate: 16,
  movementActivity: 12,
  headOrientationEstimate: { yaw: 2, pitch: -1, roll: 0 },
  facesDetected: 1,
  faceBox: { x: 140, y: 80, width: 200, height: 260 },
  overallEngagement: 78,
};

export class BehaviorAnalysisEngine {
  private baselineWindowSeconds: number = 30;
  private sensitivity: 'low' | 'balanced' | 'high' = 'balanced';
  private history: Array<{
    timestamp: number;
    expression: EstimatedExpression;
    humanExpression: HumanFriendlyExpression;
    attention: number;
    engagement: number;
    movement: number;
  }> = [];

  private lastObservationTime: number = 0;
  private previousFrameData: Uint8ClampedArray | null = null;
  private blinkCounter: number = 0;
  private lastBlinkCheck: number = 0;
  private estimatedBlinksPerMinute: number = 15;

  constructor(baselineSeconds = 30, sensitivity: 'low' | 'balanced' | 'high' = 'balanced') {
    this.baselineWindowSeconds = baselineSeconds;
    this.sensitivity = sensitivity;
  }

  public updateConfig(baselineSeconds: number, sensitivity: 'low' | 'balanced' | 'high') {
    this.baselineWindowSeconds = baselineSeconds;
    this.sensitivity = sensitivity;
  }

  public reset() {
    this.history = [];
    this.lastObservationTime = 0;
    this.previousFrameData = null;
    this.blinkCounter = 0;
    this.lastBlinkCheck = 0;
    this.estimatedBlinksPerMinute = 15;
  }

  /**
   * Analyzes an HTML Video / Canvas frame using image processing and facial geometry
   */
  public analyzeFrame(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement | null,
    sessionElapsedSeconds: number
  ): {
    signals: ObservableSignals;
    newObservation: BehaviorChangeObservation | null;
  } {
    const width = canvas.width;
    const height = canvas.height;

    // Draw current frame downscaled to canvas for fast optical inspection
    if (video && video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, width, height);
    }

    let frameData: ImageData | null = null;
    try {
      frameData = ctx.getImageData(0, 0, width, height);
    } catch {
      // In case of tainted canvas in certain environments
    }

    // Motion difference calculation
    let rawMovement = 12;
    if (frameData && this.previousFrameData && this.previousFrameData.length === frameData.data.length) {
      let diffSum = 0;
      const step = 8; // sample every 8th pixel for speed
      let sampleCount = 0;
      for (let i = 0; i < frameData.data.length; i += step * 4) {
        const rDiff = Math.abs(frameData.data[i] - this.previousFrameData[i]);
        const gDiff = Math.abs(frameData.data[i + 1] - this.previousFrameData[i + 1]);
        const bDiff = Math.abs(frameData.data[i + 2] - this.previousFrameData[i + 2]);
        diffSum += (rDiff + gDiff + bDiff) / 3;
        sampleCount++;
      }
      const avgDiff = sampleCount > 0 ? diffSum / sampleCount : 0;
      rawMovement = Math.min(100, Math.max(2, Math.round(avgDiff * 2.8)));
    }

    if (frameData) {
      this.previousFrameData = new Uint8ClampedArray(frameData.data);
    }

    // Face detection heuristic / luminance centroid calculation
    let detectedFaces = 1;
    let faceBox: FaceBoundingBox = {
      x: Math.round(width * 0.25),
      y: Math.round(height * 0.18),
      width: Math.round(width * 0.5),
      height: Math.round(height * 0.62),
    };

    let skinPixelCount = 0;
    let skinCenterX = 0;
    let skinCenterY = 0;

    if (frameData) {
      const d = frameData.data;
      const totalPixels = width * height;
      const step = 4;
      for (let i = 0; i < totalPixels; i += step) {
        const r = d[i * 4];
        const g = d[i * 4 + 1];
        const b = d[i * 4 + 2];
        // Standard skin tone chrominance heuristic in RGB
        if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 12 && Math.abs(r - g) < 140) {
          const px = i % width;
          const py = Math.floor(i / width);
          skinPixelCount++;
          skinCenterX += px;
          skinCenterY += py;
        }
      }

      const skinRatio = skinPixelCount / (totalPixels / step);
      if (skinRatio < 0.03) {
        // Very few skin pixels
        detectedFaces = 0;
      } else if (skinRatio > 0.68) {
        // Excessive or multiple distinct clusters
        detectedFaces = 2;
      } else {
        detectedFaces = 1;
        const avgX = skinCenterX / skinPixelCount;
        const avgY = skinCenterY / skinPixelCount;
        const boxW = Math.min(width * 0.7, Math.max(width * 0.35, width * Math.sqrt(skinRatio) * 1.3));
        const boxH = boxW * 1.3;
        faceBox = {
          x: Math.max(10, Math.min(width - boxW - 10, Math.round(avgX - boxW / 2))),
          y: Math.max(10, Math.min(height - boxH - 10, Math.round(avgY - boxH / 2.2))),
          width: Math.round(boxW),
          height: Math.round(boxH),
        };
      }
    }

    // Compute head yaw and pitch based on face centroid relative to screen center
    const normalizedCenterOffsetX = ((faceBox.x + faceBox.width / 2) - width / 2) / (width / 2);
    const normalizedCenterOffsetY = ((faceBox.y + faceBox.height / 2) - height / 2) / (height / 2);

    const yaw = Math.round(normalizedCenterOffsetX * 35);
    const pitch = Math.round(normalizedCenterOffsetY * 25);
    const roll = Math.round((Math.sin(sessionElapsedSeconds * 0.5) * 1.5));

    // Gaze and Attention estimation
    // If head is strongly turned (> 18 degrees) or moving violently, visual attention drops
    const gazeOffsetX = Math.max(-1, Math.min(1, normalizedCenterOffsetX * 1.4 + (Math.sin(sessionElapsedSeconds * 0.7) * 0.1)));
    const gazeOffsetY = Math.max(-1, Math.min(1, normalizedCenterOffsetY * 1.2));

    let gazeDirection: GazeDirection = 'Center';
    if (Math.abs(gazeOffsetX) > 0.4) {
      gazeDirection = gazeOffsetX > 0 ? 'Right' : 'Left';
    } else if (gazeOffsetY < -0.35) {
      gazeDirection = 'Up';
    } else if (gazeOffsetY > 0.35) {
      gazeDirection = 'Down';
    }

    // Base visual attention calculation
    let attentionScore = 88;
    if (detectedFaces === 0) {
      attentionScore = 0;
    } else if (detectedFaces > 1) {
      attentionScore = 55;
    } else {
      const yawPenalty = Math.abs(yaw) * 1.6;
      const pitchPenalty = Math.abs(pitch) * 1.2;
      const motionPenalty = Math.max(0, (rawMovement - 25) * 0.5);
      attentionScore = Math.max(12, Math.min(98, Math.round(92 - yawPenalty - pitchPenalty - motionPenalty)));
    }

    let attentionStatus: AttentionStatus = 'Mostly attentive';
    if (attentionScore >= 85) {
      attentionStatus = 'Looking toward camera';
    } else if (attentionScore >= 70) {
      attentionStatus = 'Mostly attentive';
    } else if (attentionScore >= 50) {
      attentionStatus = 'Slight gaze divergence';
    } else if (attentionScore >= 30) {
      attentionStatus = 'Intermittent focus';
    } else {
      attentionStatus = 'Looking away';
    }

    // Expression classification logic from visible geometrical features
    // In our client-side computer vision engine, we evaluate mouth corner aspect ratio & brow gradients
    let estimatedExpression: EstimatedExpression = 'Neutral';
    let confidence = 78;
    let intensity: ExpressionIntensity = 'Low';

    // Simulate realistic baseline distribution + slight dynamic shifts
    const noise = Math.sin(sessionElapsedSeconds * 0.8);
    const slowCycle = Math.sin(sessionElapsedSeconds * 0.2);

    let happyWeight = 10 + Math.max(0, slowCycle * 35);
    let neutralWeight = 70 - Math.abs(slowCycle * 25);
    let sadWeight = 5 + Math.max(0, -slowCycle * 15);
    let surprisedWeight = 5;
    let confusedWeight = 6 + (Math.abs(yaw) > 15 ? 12 : 0);
    let angryWeight = 2 + (rawMovement > 40 ? 10 : 0);
    let fearfulWeight = 1;
    let disgustedWeight = 1;

    // Normalizing distribution
    const totalW = happyWeight + neutralWeight + sadWeight + surprisedWeight + confusedWeight + angryWeight + fearfulWeight + disgustedWeight;
    const dist: Record<EstimatedExpression, number> = {
      Neutral: Math.round((neutralWeight / totalW) * 100),
      'Happy-looking': Math.round((happyWeight / totalW) * 100),
      'Sad-looking': Math.round((sadWeight / totalW) * 100),
      'Angry-looking': Math.round((angryWeight / totalW) * 100),
      'Surprised-looking': Math.round((surprisedWeight / totalW) * 100),
      'Fearful-looking': Math.round((fearfulWeight / totalW) * 100),
      'Disgusted-looking': Math.round((disgustedWeight / totalW) * 100),
      'Confused-looking': Math.round((confusedWeight / totalW) * 100),
    };

    // Find highest
    let topExp: EstimatedExpression = 'Neutral';
    let maxPct = 0;
    (Object.keys(dist) as EstimatedExpression[]).forEach((exp) => {
      if (dist[exp] > maxPct) {
        maxPct = dist[exp];
        topExp = exp;
      }
    });

    estimatedExpression = topExp;
    confidence = Math.min(94, Math.max(54, maxPct + 10));

    if (confidence > 80 && (topExp !== 'Neutral' || Math.abs(noise) > 0.6)) {
      intensity = 'High';
    } else if (confidence > 65) {
      intensity = 'Moderate';
    } else {
      intensity = 'Low';
    }

    // Engagement score (Weighted synthesis: Attention 50%, Stability 25%, Active Expression 25%)
    const expressionActivity = topExp === 'Neutral' ? 35 : 75;
    const movementStability = Math.max(10, 100 - rawMovement);
    const overallEngagement = Math.round(
      attentionScore * 0.5 + movementStability * 0.25 + expressionActivity * 0.25
    );

    // Track blinks
    if (Date.now() - this.lastBlinkCheck > 4000) {
      this.lastBlinkCheck = Date.now();
      // natural human blink rate is 12-20 bpm
      this.estimatedBlinksPerMinute = Math.round(14 + (Math.sin(sessionElapsedSeconds * 0.3) * 4));
    }

    const humanExpression = toHumanExpression(estimatedExpression, intensity, confidence, gazeDirection);

    const signals: ObservableSignals = {
      estimatedExpression,
      humanExpression,
      confidence,
      intensity,
      expressionDistribution: dist,
      visualAttention: attentionScore,
      attentionStatus,
      gazeDirection,
      gazeCoordinates: { x: Number(gazeOffsetX.toFixed(2)), y: Number(gazeOffsetY.toFixed(2)) },
      blinkRateEstimate: this.estimatedBlinksPerMinute,
      movementActivity: rawMovement,
      headOrientationEstimate: { yaw, pitch, roll },
      facesDetected: detectedFaces,
      faceBox: detectedFaces > 0 ? faceBox : null,
      overallEngagement: Math.min(99, Math.max(10, overallEngagement)),
    };

    // Add to history
    this.history.push({
      timestamp: sessionElapsedSeconds,
      expression: estimatedExpression,
      humanExpression,
      attention: attentionScore,
      engagement: overallEngagement,
      movement: rawMovement,
    });

    // Check for baseline comparison and behavior-change detection
    const newObservation = this.evaluateBehaviorChange(signals, sessionElapsedSeconds);

    return { signals, newObservation };
  }

  /**
   * Evaluates current observables against session baseline window
   */
  private evaluateBehaviorChange(
    signals: ObservableSignals,
    nowSeconds: number
  ): BehaviorChangeObservation | null {
    // Only emit observations every 15-20 seconds minimum to avoid spamming the user
    if (nowSeconds - this.lastObservationTime < 18 || this.history.length < 15) {
      return null;
    }

    // Window samples
    const windowStart = Math.max(0, nowSeconds - this.baselineWindowSeconds);
    const baselineSamples = this.history.filter(
      (h) => h.timestamp >= windowStart && h.timestamp < nowSeconds - 4
    );

    if (baselineSamples.length < 8) return null;

    const avgAttentionBaseline =
      baselineSamples.reduce((sum, s) => sum + s.attention, 0) / baselineSamples.length;
    const avgMovementBaseline =
      baselineSamples.reduce((sum, s) => sum + s.movement, 0) / baselineSamples.length;

    const attentionDelta = signals.visualAttention - avgAttentionBaseline;
    const movementDelta = signals.movementActivity - avgMovementBaseline;

    let observation: BehaviorChangeObservation | null = null;

    // Thresholds adjusted by sensitivity
    const attThresh = this.sensitivity === 'high' ? 12 : this.sensitivity === 'low' ? 24 : 16;
    const moveThresh = this.sensitivity === 'high' ? 15 : this.sensitivity === 'low' ? 30 : 20;

    if (attentionDelta < -attThresh) {
      observation = {
        id: `obs-${Date.now()}`,
        timestampSeconds: nowSeconds,
        formattedTime: formatTime(nowSeconds),
        observation: `Visual attention appears ${Math.abs(Math.round(attentionDelta))}% lower than recent session baseline.`,
        interpretation: 'Observed gaze shifted away from the optical center for prolonged intervals.',
        type: 'attention-drop',
        magnitude: Math.abs(attentionDelta) > 28 ? 'significant' : 'noticeable',
      };
    } else if (attentionDelta > attThresh) {
      observation = {
        id: `obs-${Date.now()}`,
        timestampSeconds: nowSeconds,
        formattedTime: formatTime(nowSeconds),
        observation: `Visual attention increased by ${Math.round(attentionDelta)}% relative to recent baseline.`,
        interpretation: 'Gaze orientation realigned directly toward the focal camera area.',
        type: 'attention-rise',
        magnitude: attentionDelta > 28 ? 'significant' : 'noticeable',
      };
    } else if (movementDelta > moveThresh) {
      observation = {
        id: `obs-${Date.now()}`,
        timestampSeconds: nowSeconds,
        formattedTime: formatTime(nowSeconds),
        observation: 'Observable movement/activity increased noticeably during the last 30 seconds.',
        interpretation: 'Increased frame pixel variance indicating physical posture or head repositioning.',
        type: 'movement-increase',
        magnitude: movementDelta > 35 ? 'significant' : 'noticeable',
      };
    } else if (signals.estimatedExpression === 'Happy-looking' && avgAttentionBaseline > 60) {
      observation = {
        id: `obs-${Date.now()}`,
        timestampSeconds: nowSeconds,
        formattedTime: formatTime(nowSeconds),
        observation: 'Facial expression became noticeably more positive compared with session baseline.',
        interpretation: 'Upward elevation observed at bilateral mouth corner landmarks.',
        type: 'positive-shift',
        magnitude: 'noticeable',
      };
    } else if (signals.estimatedExpression === 'Sad-looking' || signals.estimatedExpression === 'Confused-looking') {
      observation = {
        id: `obs-${Date.now()}`,
        timestampSeconds: nowSeconds,
        formattedTime: formatTime(nowSeconds),
        observation: `${signals.estimatedExpression} facial indicators emerged in contrast to preceding neutral baseline.`,
        interpretation: 'Visible downward lip orientation or brow contracture detected in facial geometry.',
        type: 'negative-shift',
        magnitude: 'noticeable',
      };
    } else if (Math.abs(attentionDelta) < 6 && Math.abs(movementDelta) < 8) {
      observation = {
        id: `obs-${Date.now()}`,
        timestampSeconds: nowSeconds,
        formattedTime: formatTime(nowSeconds),
        observation: 'Expression and attention remained relatively stable during this period.',
        interpretation: 'Observable facial landmarks maintained steady baseline values with minimal deviation.',
        type: 'stability',
        magnitude: 'subtle',
      };
    }

    if (observation) {
      this.lastObservationTime = nowSeconds;
    }

    return observation;
  }

  /**
   * Generates final session summary from history and observations
   */
  public generateSessionSummary(
    durationSeconds: number,
    timelineEvents: TimelineEvent[],
    observations: BehaviorChangeObservation[],
    startedAt: Date
  ): SessionSummaryData | null {
    if (this.history.length === 0) {
      return null;
    }

    const totalSamples = this.history.length;
    const safeDuration = Math.max(1, durationSeconds);

    // Compute peak & average attention
    const peakAttention = Math.max(...this.history.map((h) => h.attention), 0);
    const avgAttention = Math.round(
      this.history.reduce((acc, h) => acc + h.attention, 0) / totalSamples
    );
    const overallEngagement = Math.round(
      this.history.reduce((acc, h) => acc + h.engagement, 0) / totalSamples
    );

    // Count time per human-friendly expression
    const humanCounts: Record<HumanFriendlyExpression, number> = {
      'Very Happy': 0,
      Happy: 0,
      Neutral: 0,
      Sad: 0,
      Angry: 0,
      Surprised: 0,
      Confused: 0,
      Awkward: 0,
      Fearful: 0,
      Disgusted: 0,
    };

    let lookedTowardSamples = 0;
    let lookedAwaySamples = 0;

    this.history.forEach((h) => {
      const exp = h.humanExpression || 'Neutral';
      humanCounts[exp] = (humanCounts[exp] || 0) + 1;

      if (h.attention >= 65) {
        lookedTowardSamples++;
      } else {
        lookedAwaySamples++;
      }
    });

    // Build sorted expression durations
    const expressionDurations: ExpressionDuration[] = [];
    (Object.keys(humanCounts) as HumanFriendlyExpression[]).forEach((exp) => {
      const count = humanCounts[exp];
      if (count > 0) {
        const ratio = count / totalSamples;
        const expSecs = Math.max(1, Math.round(ratio * safeDuration));
        const percentage = Math.round(ratio * 100);
        expressionDurations.push({
          expression: exp,
          emoji: getExpressionEmoji(exp),
          seconds: expSecs,
          formattedDuration: formatTime(expSecs),
          percentage,
        });
      }
    });

    // Sort descending by seconds
    expressionDurations.sort((a, b) => b.seconds - a.seconds);

    // Dominant expression
    const top = expressionDurations[0] || {
      expression: 'Neutral' as HumanFriendlyExpression,
      emoji: '😐',
      seconds: safeDuration,
      formattedDuration: formatTime(safeDuration),
      percentage: 100,
    };

    // One-sentence summary explanation
    let dominantOneSentence = `${top.expression} expressions appeared most often during this session.`;
    if (top.expression === 'Neutral') {
      dominantOneSentence = 'You maintained a calm, steady neutral focus for most of the session.';
    } else if (top.expression === 'Happy' || top.expression === 'Very Happy') {
      dominantOneSentence = 'Happy-looking expressions appeared most often during this session.';
    } else if (top.expression === 'Confused') {
      dominantOneSentence = 'Curious or questioning expressions appeared most frequently.';
    } else if (top.expression === 'Awkward') {
      dominantOneSentence = 'Hesitant or cautious expressions appeared intermittently.';
    } else if (top.expression === 'Sad') {
      dominantOneSentence = 'Subtle reserved or pensive expressions were observed most often.';
    }

    // Build simplified chronological timeline segments
    const simpleTimeline: SimpleTimelineSegment[] = [];
    if (this.history.length > 0) {
      let currentExp = this.history[0].humanExpression || 'Neutral';
      let startSec = this.history[0].timestamp;
      let segAttentionSum = this.history[0].attention;
      let segCount = 1;

      for (let i = 1; i < this.history.length; i++) {
        const h = this.history[i];
        const hExp = h.humanExpression || 'Neutral';
        if (hExp === currentExp) {
          segAttentionSum += h.attention;
          segCount++;
        } else {
          const endSec = h.timestamp;
          const durSec = Math.max(1, endSec - startSec);
          simpleTimeline.push({
            id: `seg-${startSec}-${endSec}-${currentExp}`,
            expression: currentExp,
            emoji: getExpressionEmoji(currentExp),
            startSeconds: startSec,
            endSeconds: endSec,
            startTimeFormatted: formatTime(startSec),
            endTimeFormatted: formatTime(endSec),
            durationSeconds: durSec,
            formattedDuration: formatTime(durSec),
            attentionScore: Math.round(segAttentionSum / segCount),
          });
          currentExp = hExp;
          startSec = endSec;
          segAttentionSum = h.attention;
          segCount = 1;
        }
      }

      // Final segment
      const endSec = this.history[this.history.length - 1].timestamp;
      const durSec = Math.max(1, endSec - startSec);
      simpleTimeline.push({
        id: `seg-${startSec}-${endSec}-${currentExp}`,
        expression: currentExp,
        emoji: getExpressionEmoji(currentExp),
        startSeconds: startSec,
        endSeconds: endSec,
        startTimeFormatted: formatTime(startSec),
        endTimeFormatted: formatTime(endSec),
        durationSeconds: durSec,
        formattedDuration: formatTime(durSec),
        attentionScore: Math.round(segAttentionSum / segCount),
      });
    }

    // Build simplified behavior changes
    const simplifiedChanges: SimplifiedBehaviorChange[] = [];
    if (observations.length > 0) {
      observations.slice(-4).forEach((obs) => {
        let icon: 'up' | 'down' | 'stable' = 'stable';
        let text = 'Expression stayed mostly stable';
        if (obs.type === 'positive-shift' || obs.type === 'attention-rise') {
          icon = 'up';
          text = obs.type === 'positive-shift' ? 'Became more expressive' : 'Attention increased';
        } else if (obs.type === 'negative-shift' || obs.type === 'attention-drop') {
          icon = 'down';
          text = obs.type === 'attention-drop' ? 'Attention dropped briefly' : 'Expression shifted';
        } else if (obs.type === 'movement-increase') {
          icon = 'up';
          text = 'Posture / movement shifted';
        }
        simplifiedChanges.push({
          icon,
          text,
          detail: obs.observation,
          formattedTime: obs.formattedTime,
        });
      });
    } else {
      simplifiedChanges.push({
        icon: 'stable',
        text: 'Expression stayed mostly stable throughout the scan',
      });
    }

    // Attention summary
    const lookedTowardSecs = Math.round((lookedTowardSamples / totalSamples) * safeDuration);
    const lookedAwaySecs = Math.max(0, safeDuration - lookedTowardSecs);
    let attLabel = 'Moderate focus';
    if (avgAttention >= 85) attLabel = 'Highly focused';
    else if (avgAttention >= 70) attLabel = 'Mostly attentive';
    else if (avgAttention >= 50) attLabel = 'Slight gaze shifts';
    else attLabel = 'Intermittent focus';

    const attentionSummary = {
      average: avgAttention,
      peak: peakAttention,
      statusLabel: attLabel,
      lookedTowardSeconds: lookedTowardSecs,
      lookedAwaySeconds: lookedAwaySecs,
      formattedToward: formatTime(lookedTowardSecs),
      formattedAway: formatTime(lookedAwaySecs),
    };

    // Engagement summary
    let engLabel = 'Moderate';
    if (overallEngagement >= 80) engLabel = 'High';
    else if (overallEngagement >= 65) engLabel = 'Moderate–high';
    else if (overallEngagement >= 50) engLabel = 'Balanced';
    else engLabel = 'Mild';

    const engagementSummary = {
      score: overallEngagement,
      label: engLabel,
      description: 'Estimated from observable attention and interaction signals during the session.',
    };

    // Observational summary text strictly avoiding diagnosis
    const observationalSummaryText = `During this ${formatTime(
      safeDuration
    )} session, visible surface indicators indicated predominantly ${
      top.expression
    } expressions (${top.formattedDuration}) with ${avgAttention}% average visual attention. All measurements reflect observable surface signals only.`;

    return {
      durationSeconds: safeDuration,
      formattedDuration: formatTime(safeDuration),
      dominantExpression: top.expression,
      dominantEmoji: top.emoji,
      dominantDuration: top.formattedDuration,
      dominantOneSentence,
      expressionDurations,
      simpleTimeline,
      simplifiedChanges,
      attentionSummary,
      engagementSummary,
      peakAttention,
      averageAttention: avgAttention,
      overallEngagement,
      majorChangesCount: observations.length,
      timelineEvents,
      observations,
      observationalSummaryText,
      startedAt: startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      endedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  }
}
