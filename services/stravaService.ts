
import { AthleteData, StravaActivity, RecentActivity, StravaTokens } from '../types';

/**
 * Strava Service - Flux OAuth 2.0 Complet
 */
export class StravaService {
  private static instance: StravaService;
  
  // À REMPLACER PAR VOS INFOS STRAVA API
  private CLIENT_ID = "YOUR_CLIENT_ID"; 
  private CLIENT_SECRET = "YOUR_CLIENT_SECRET";
  private REDIRECT_URI = window.location.origin;

  private tokens: StravaTokens | null = null;

  private constructor() {
    const saved = localStorage.getItem('strava_auth_v2');
    if (saved) {
      this.tokens = JSON.parse(saved);
    }
  }

  public static getInstance(): StravaService {
    if (!StravaService.instance) {
      StravaService.instance = new StravaService();
    }
    return StravaService.instance;
  }

  /**
   * Redirige l'utilisateur vers Strava pour autorisation
   */
  public initiateAuth() {
    const scope = "read,profile:read_all,activity:read_all";
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${this.CLIENT_ID}&redirect_uri=${this.REDIRECT_URI}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  }

  /**
   * Échange le code d'autorisation contre des jetons
   */
  public async handleCallback(code: string): Promise<void> {
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) throw new Error("Échec de l'échange de token");
      
      const data = await response.json();
      this.saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at
      });
    } catch (error) {
      console.error("Auth Callback Error:", error);
      throw error;
    }
  }

  /**
   * Rafraîchit le token s'il est expiré
   */
  private async ensureValidToken(): Promise<string> {
    if (!this.tokens) throw new Error("Non authentifié");

    const now = Math.floor(Date.now() / 1000);
    if (this.tokens.expires_at > now + 300) { // 5 min de marge
      return this.tokens.access_token;
    }

    console.log("Rafraîchissement du token Strava...");
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          refresh_token: this.tokens.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) throw new Error("Échec du rafraîchissement");

      const data = await response.json();
      this.saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at
      });
      return data.access_token;
    } catch (error) {
      this.logout();
      throw new Error("Session Strava expirée. Veuillez vous reconnecter.");
    }
  }

  private saveTokens(tokens: StravaTokens) {
    this.tokens = tokens;
    localStorage.setItem('strava_auth_v2', JSON.stringify(tokens));
  }

  public logout() {
    this.tokens = null;
    localStorage.removeItem('strava_auth_v2');
  }

  public isAuthenticated(): boolean {
    return !!this.tokens;
  }

  private estimateVo2Max(vam: number): number {
    return Math.round(vam / 14.5);
  }

  /**
   * Récupère les données athlète avec validation automatique du token
   */
  async fetchAthleteData(): Promise<AthleteData> {
    const token = await this.ensureValidToken();

    try {
      const [athleteRes, activitiesRes] = await Promise.all([
        fetch('https://www.strava.com/api/v3/athlete', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!athleteRes.ok || !activitiesRes.ok) throw new Error("Erreur API Strava");

      const athlete = await athleteRes.json();
      const activities: StravaActivity[] = await activitiesRes.json();
      
      const verticalActivities = activities
        .filter(a => a.total_elevation_gain > 20 && a.moving_time > 60)
        .map(a => ({
          name: a.name,
          elevation: Math.round(a.total_elevation_gain),
          time: a.moving_time,
          vam: Math.round((a.total_elevation_gain / a.moving_time) * 3600)
        }));

      if (verticalActivities.length === 0) {
        return {
          weight: athlete.weight || 70.0,
          vo2max: 50,
          vam4min: 400,
          sourceActivity: "Aucune activité verticale trouvée",
          recentActivities: []
        };
      }

      const recent = verticalActivities.slice(0, 2);
      const bestVam = Math.max(...verticalActivities.map(v => v.vam));
      
      return {
        weight: athlete.weight || 70.0, 
        vo2max: this.estimateVo2Max(bestVam),
        vam4min: bestVam,
        sourceActivity: recent[0].name,
        recentActivities: recent
      };
    } catch (error: any) {
      console.error("Strava Data Fetch Error:", error);
      throw error;
    }
  }
}
