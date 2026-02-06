
import { AthleteData, StravaActivity, RecentActivity, StravaTokens } from '../types';

/**
 * Strava Service - Moteur Haute Performance
 * Gère l'authentification OAuth 2.0 et l'analyse biomécanique des activités.
 */
export class StravaService {
  private static instance: StravaService;
  
  // Configuration officielle fournie
  private CLIENT_ID = "200772"; 
  private REDIRECT_URI = "https://verticalspeed-pro-coach-kilian.vercel.app";
  
  // Note: En production, le secret doit être géré par un proxy backend.
  // Pour cette implémentation directe, il est requis pour l'échange initial.
  private CLIENT_SECRET = "VOTRE_CLIENT_SECRET_ICI"; 

  private tokens: StravaTokens | null = null;

  private constructor() {
    const saved = localStorage.getItem('strava_auth_v2');
    if (saved) {
      try {
        this.tokens = JSON.parse(saved);
      } catch (e) {
        localStorage.removeItem('strava_auth_v2');
      }
    }
  }

  public static getInstance(): StravaService {
    if (!StravaService.instance) {
      StravaService.instance = new StravaService();
    }
    return StravaService.instance;
  }

  /**
   * Redirection vers Strava avec les scopes exacts demandés
   */
  public initiateAuth() {
    const scope = "activity:read_all,profile:read_all";
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${this.CLIENT_ID}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  }

  /**
   * Échange le code d'autorisation contre le pack de jetons (access + refresh)
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

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || "Échec de l'échange OAuth");
      }
      
      const data = await response.json();
      this.saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at
      });
    } catch (error) {
      console.error("Critical OAuth Error:", error);
      throw error;
    }
  }

  /**
   * Assure la validité du jeton avant chaque appel API (Auto-refresh)
   */
  private async ensureValidToken(): Promise<string> {
    if (!this.tokens) throw new Error("Authentification Strava manquante");

    const now = Math.floor(Date.now() / 1000);
    // On rafraîchit si le token expire dans moins de 10 minutes
    if (this.tokens.expires_at > now + 600) {
      return this.tokens.access_token;
    }

    console.log("Token expiré. Tentative de rafraîchissement...");
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

      if (!response.ok) throw new Error("Rafraîchissement impossible");

      const data = await response.json();
      this.saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at
      });
      return data.access_token;
    } catch (error) {
      this.logout();
      throw new Error("Votre session Strava a expiré. Reconnexion nécessaire.");
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

  /**
   * Calcule la VAM (Vertical Speed) : (D+ / temps en secondes) * 3600
   */
  private calculateVam(elevation: number, timeInSeconds: number): number {
    if (timeInSeconds === 0) return 0;
    return Math.round((elevation / timeInSeconds) * 3600);
  }

  private estimateVo2Max(vam: number): number {
    // Standard Kilian Jornet / Endurance : VO2 Max ~ VAM / 14.2 (moyenne terrain technique)
    return Math.round(vam / 14.2);
  }

  /**
   * Analyse les activités Strava et extrait les données de performance
   */
  async fetchAthleteData(): Promise<AthleteData> {
    const token = await this.ensureValidToken();

    try {
      const [athleteRes, activitiesRes] = await Promise.all([
        fetch('https://www.strava.com/api/v3/athlete', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://www.strava.com/api/v3/athlete/activities?per_page=20', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!athleteRes.ok || !activitiesRes.ok) {
        throw new Error("Erreur de communication avec Strava");
      }

      const athlete = await athleteRes.json();
      const activities: StravaActivity[] = await activitiesRes.json();
      
      // Filtrage intelligent : Sorties de plus de 50m de D+ uniquement
      const verticalActivities = activities
        .filter(a => a.total_elevation_gain > 50 && a.moving_time > 60)
        .map(a => ({
          name: a.name,
          elevation: Math.round(a.total_elevation_gain),
          time: a.moving_time,
          vam: this.calculateVam(a.total_elevation_gain, a.moving_time)
        }));

      // Si aucune activité montagneuse n'est trouvée
      if (verticalActivities.length === 0) {
        return {
          weight: athlete.weight || 68.0,
          vo2max: 50,
          vam4min: 600,
          sourceActivity: "Aucun dénivelé significatif détecté",
          recentActivities: []
        };
      }

      // Analyse de la performance maximale (VAM 4min extrapolée ou meilleure VAM détectée)
      const recent = verticalActivities.slice(0, 2);
      const bestVam = Math.max(...verticalActivities.map(v => v.vam));
      
      return {
        weight: athlete.weight || 68.0, 
        vo2max: this.estimateVo2Max(bestVam),
        vam4min: bestVam,
        sourceActivity: recent[0].name,
        recentActivities: recent
      };
    } catch (error: any) {
      console.error("Fetch Error:", error);
      throw error;
    }
  }
}
