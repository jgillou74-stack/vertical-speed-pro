
import { AthleteData } from '../types';

/**
 * Terra Service
 * Gère la connexion multi-sources (Garmin, Suunto, etc.) via Terra API.
 */
export class TerraService {
  private static instance: TerraService;
  private userId: string | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): TerraService {
    if (!TerraService.instance) {
      TerraService.instance = new TerraService();
    }
    return TerraService.instance;
  }

  /**
   * Simule l'ouverture du Widget Terra pour authentifier Garmin
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log("Initialisation du Widget Terra...");
      // Simule l'ouverture de la WebView Terra
      setTimeout(() => {
        this.userId = "terra-user-uuid-12345";
        this.isConnected = true;
        resolve(true);
      }, 1500);
    });
  }

  /**
   * Récupère les données depuis Terra (format standardisé)
   * Use AthleteData instead of non-existent GarminData
   */
  async fetchAthleteData(): Promise<AthleteData> {
    if (!this.isConnected) throw new Error("Terra non connecté");

    // Simule un appel à l'endpoint Terra /user/body ou /user/activity
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          weight: 68.2,
          vo2max: 75,
          vam4min: 1280 // Extrapolé depuis les données de puissance/vitesse
        });
      }, 1000);
    });
  }

  getConnectivity(): boolean {
    return this.isConnected;
  }
}
