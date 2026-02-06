
import { AthleteData, StravaActivity, RecentActivity, StravaTokens } from '../types';

/**
 * Strava Service - Moteur Haute Performance
 * Gère l'authentification OAuth 2.0 native et l'analyse des performances.
 */
export class StravaService {
  private static instance: StravaService;
  
  // Identifiant client fixe
  private CLIENT_ID = "200772"; 
  
  // Récupération sécurisée du secret via import.meta.env avec optional chaining pour éviter les crashs
  private CLIENT_SECRET = (import.meta as any).env?.VITE_STRAVA_CLIENT_SECRET || "";

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
   * Génère dynamiquement l'URL de redirection basée sur l'origine actuelle (window.location.origin)
   */
  private getRedirectUri(): string {
    return window.location.origin;
  }

  /**
   * Redirection vers Strava avec les paramètres corrigés
   */
  public initiateAuth() {
    const scope = "activity:read_all,profile:read_all";
    const redirectUri = this.getRedirectUri();
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${this.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  }

  /**
   * Échange le code temporaire contre des jetons d'accès et de rafraîchissement.
   * Utilise EXCLUSIVEMENT URLSearchParams pour le corps de la requête.
   */
  public async handleCallback(code: string): Promise<void> {
    if (!this.CLIENT_SECRET) {
      throw new Error("VITE_STRAVA_CLIENT_SECRET n'est pas configuré. Vérifiez vos variables d'environnement.");
    }

    try {
      const params = new URLSearchParams();
      params.append('client_id', this.CLIENT_ID);
      params.append('client_secret', this.CLIENT_SECRET);
      params.append('code', code);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', this.getRedirectUri());

      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: params
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || "Échec de l'échange OAuth avec Strava");
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
   * Rafraîchissement automatique du token dès expiration.
   * Utilise EXCLUSIVEMENT URLSearchParams pour le corps de la requête.
   */
  private async ensureValidToken(): Promise<string> {
    if (!this.tokens) throw new Error("Authentification Strava requise");

    const now = Math.floor(Date.now() / 1000);
    // On anticipe de 10 minutes l'expiration
    if (this.tokens.expires_at > now + 600) {
      return this.tokens.access_token;
    }

    console.log("Rafraîchissement du jeton Strava via URLSearchParams...");
    try {
      const params = new URLSearchParams();
      params.append('client_id', this.CLIENT_ID);
      params.append('client_secret', this.CLIENT_SECRET);
      params.append('refresh_token', this.tokens.refresh_token);
      params.append('grant_type', 'refresh_token');

      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: params
      });

      if (!response.ok) throw new Error("Impossible de rafraîchir le jeton (Bad Request)");

      const data = await response.json();
      this.saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at
      });
      return data.access_token;
    } catch (error) {
      this.logout();
      throw new Error("Votre session Strava a expiré. Veuillez vous reconnecter.");
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
   * Calcul de la Vitesse Verticale : (Gain Altitude / Temps) * 3600
   */
  private calculateVam(elevation: number, timeInSeconds: number): number {
    if (timeInSeconds <= 0) return 0;
    return Math.round((elevation / timeInSeconds) * 3600);
  }

  private estimateVo2Max(vam: number): number {
    return Math.round(vam / 14.2);
  }

  /**
   * Récupère et analyse les activités Strava récentes
   */
  async fetchAthleteData(): Promise<AthleteData> {
    const token = await this.ensureValidToken();

    try {
      const [athleteRes, activitiesRes] = await Promise.all([
        fetch('https://www.strava.com/api/v3/athlete', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://www.strava.com/api/v3/athlete/activities?per_page=15', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!athleteRes.ok || !activitiesRes.ok) {
        throw new Error("Erreur d'accès aux données Strava (API)");
      }

      const athlete = await athleteRes.json();
      const activities: StravaActivity[] = await activitiesRes.json();
      
      const verticalActivities = activities
        .filter(a => a.total_elevation_gain > 30 && a.moving_time > 60)
        .map(a => ({
          name: a.name,
          elevation: Math.round(a.total_elevation_gain),
          time: a.moving_time,
          vam: this.calculateVam(a.total_elevation_gain, a.moving_time)
        }));

      if (verticalActivities.length === 0) {
        return {
          weight: athlete.weight || 68.0,
          vo2max: 52,
          vam4min: 700,
          sourceActivity: "Analyse basée sur profil (aucune activité verticale détectée)",
          recentActivities: []
        };
      }

      const recent = verticalActivities.slice(0, 3);
      const bestVam = Math.max(...verticalActivities.map(v => v.vam));
      
      return {
        weight: athlete.weight || 68.0, 
        vo2max: this.estimateVo2Max(bestVam),
        vam4min: bestVam,
        sourceActivity: recent[0].name,
        recentActivities: recent
      };
    } catch (error: any) {
      console.error("Strava Data Error:", error);
      throw error;
    }
  }
}
