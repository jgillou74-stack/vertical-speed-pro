
import { AthleteData, StravaActivity, RecentActivity, StravaTokens } from '../types';

/**
 * Strava Service - Implémentation Native OAuth 2.0
 * Utilise le flux officiel pour récupérer les activités et calculer la VAM.
 */
export class StravaService {
  private static instance: StravaService;
  
  // Paramètres fournis par l'utilisateur
  private CLIENT_ID = "200772"; 
  private REDIRECT_URI = "https://verticalspeed-pro-coach-kilian.vercel.app";
  
  // NOTE: Le client_secret est nécessaire pour l'échange de code -> token.
  // Dans une app de production, cet échange devrait se faire côté serveur pour la sécurité.
  private CLIENT_SECRET = "VOTRE_CLIENT_SECRET_ICI"; 

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
   * Redirige vers la page d'autorisation Strava avec les scopes requis
   */
  public initiateAuth() {
    const scope = "activity:read_all,profile:read_all";
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${this.CLIENT_ID}&redirect_uri=${this.REDIRECT_URI}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  }

  /**
   * Échange le code d'autorisation contre un access_token et un refresh_token
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
        const err = await response.json();
        throw new Error(err.message || "Échec de l'échange de token");
      }
      
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
   * Vérifie la validité du token et rafraîchit si nécessaire
   */
  private async ensureValidToken(): Promise<string> {
    if (!this.tokens) throw new Error("Veuillez vous connecter à Strava");

    const now = Math.floor(Date.now() / 1000);
    // Rafraîchir si expiré ou expire dans moins de 5 minutes
    if (this.tokens.expires_at > now + 300) {
      return this.tokens.access_token;
    }

    console.log("Rafraîchissement automatique du token Strava...");
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
      throw new Error("Session Strava expirée. Reconnexion requise.");
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
    // Formule empirique : VO2 Max ~ VAM / 14.5 pour les coureurs de montagne
    return Math.round(vam / 14.5);
  }

  /**
   * Récupère les activités et calcule les métriques de performance
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

      if (!athleteRes.ok || !activitiesRes.ok) throw new Error("Accès API Strava refusé");

      const athlete = await athleteRes.json();
      const activities: StravaActivity[] = await activitiesRes.json();
      
      // Filtrage et calcul de la VAM selon la formule : (gain / temps) * 3600
      const verticalActivities = activities
        .filter(a => a.total_elevation_gain > 50 && a.moving_time > 120)
        .map(a => ({
          name: a.name,
          elevation: Math.round(a.total_elevation_gain),
          time: a.moving_time,
          vam: Math.round((a.total_elevation_gain / a.moving_time) * 3600)
        }));

      if (verticalActivities.length === 0) {
        return {
          weight: athlete.weight || 65.0,
          vo2max: 45,
          vam4min: 500,
          sourceActivity: "Pas de sortie montagne détectée",
          recentActivities: []
        };
      }

      // On prend les 2 plus récentes pour l'affichage
      const recent = verticalActivities.slice(0, 2);
      // On prend la meilleure VAM du lot comme référence VAM 4min
      const bestVam = Math.max(...verticalActivities.map(v => v.vam));
      
      return {
        weight: athlete.weight || 65.0, 
        vo2max: this.estimateVo2Max(bestVam),
        vam4min: bestVam,
        sourceActivity: recent[0].name,
        recentActivities: recent
      };
    } catch (error: any) {
      console.error("Erreur de récupération Strava:", error);
      throw error;
    }
  }
}
