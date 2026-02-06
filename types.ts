
export enum TrainingType {
  INTERVAL = 'Interval',
  THRESHOLD = 'Threshold',
  FORCE = 'Force'
}

export interface RecentActivity {
  name: string;
  elevation: number;
  time: number;
  vam: number;
}

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AthleteData {
  weight: number;
  vo2max: number;
  vam4min: number; 
  sourceActivity?: string;
  recentActivities?: RecentActivity[];
}

export interface TrainingSession {
  week: number;
  type: TrainingType;
  title: string;
  description: string;
  intensity: string;
  duration: string;
}

export interface UserObjective {
  targetVam: number;
  weeks: number;
}

export interface CoachingPlan {
  sessions: TrainingSession[];
  intensityFactor: number;
}

export interface StravaActivity {
  name: string;
  total_elevation_gain: number;
  moving_time: number;
  average_heartrate?: number;
}
