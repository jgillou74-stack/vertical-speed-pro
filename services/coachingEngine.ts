
import { TrainingSession, TrainingType, AthleteData, UserObjective, CoachingPlan } from '../types';

/**
 * Formula: Progressive Overload based on VAM Delta.
 * Intensity is calculated as a % of current VAM.
 */
export const generatePlan = (current: AthleteData, objective: UserObjective): CoachingPlan => {
  const vamDelta = objective.targetVam - current.vam4min;
  const intensityFactor = Math.min(1.2, objective.targetVam / current.vam4min);
  
  const sessions: TrainingSession[] = [];

  for (let w = 1; w <= objective.weeks; w++) {
    const progression = w / objective.weeks;
    const baseVam = current.vam4min + (vamDelta * progression * 0.5);

    // 1. Interval Session (VMA-like)
    sessions.push({
      week: w,
      type: TrainingType.INTERVAL,
      title: `Interval Vv Max`,
      description: `30/30 répétitions sur pente raide. 10x [30s @ ${Math.round(baseVam * 1.05)} m/h / 30s récup]`,
      intensity: 'Z5 (Max)',
      duration: '45 min'
    });

    // 2. Threshold Session
    sessions.push({
      week: w,
      type: TrainingType.THRESHOLD,
      title: `Seuil Ascendant`,
      description: `Montée constante 2x15min @ ${Math.round(baseVam * 0.85)} m/h. Concentration sur le souffle.`,
      intensity: 'Z4 (Seuil)',
      duration: '1h 15 min'
    });

    // 3. Force Session
    sessions.push({
      week: w,
      type: TrainingType.FORCE,
      title: `Force Spécifique`,
      description: `Pente > 25%. Faible cadence, poussée maximale sur les mollets et quadriceps.`,
      intensity: 'Z3 (Puissance)',
      duration: '1h 00 min'
    });
  }

  return { sessions, intensityFactor };
};
