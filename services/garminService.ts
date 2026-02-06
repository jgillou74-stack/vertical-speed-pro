
import { AthleteData } from '../types';
import { MOCK_GARMIN_DATA } from '../constants';

/**
 * Service to handle Garmin OAuth2 and data retrieval.
 * In a real-world scenario, this would use an OAuth flow.
 */
export class GarminService {
  private static instance: GarminService;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): GarminService {
    if (!GarminService.instance) {
      GarminService.instance = new GarminService();
    }
    return GarminService.instance;
  }

  async connect(): Promise<boolean> {
    // Simulate OAuth2 redirect/auth
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true;
        resolve(true);
      }, 1000);
    });
  }

  // Use AthleteData as GarminData is not exported from types
  async fetchData(): Promise<AthleteData> {
    if (!this.isConnected) {
      throw new Error("Garmin not connected");
    }
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_GARMIN_DATA);
      }, 800);
    });
  }

  getConnectivity(): boolean {
    return this.isConnected;
  }
}
