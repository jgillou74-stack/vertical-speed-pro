
import React, { useState, useEffect } from 'react';
import { AthleteData, CoachingPlan } from './types';
import { StravaService } from './services/stravaService';
import { generatePlan } from './services/coachingEngine';
import GarminHeader from './components/GarminHeader';
import ObjectiveInputs from './components/ObjectiveInputs';
import TrainingPlan from './components/TrainingPlan';
import VamChart from './components/VamChart';
import CoachInsights from './components/CoachInsights';
import { Mountain, Info, Share2, AlertTriangle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [athleteData, setAthleteData] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetVam, setTargetVam] = useState(1200);
  const [weeks, setWeeks] = useState(12);
  const [plan, setPlan] = useState<CoachingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stravaService = StravaService.getInstance();

  useEffect(() => {
    const handleAuthentication = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        setLoading(true);
        setError(null);
        try {
          // Échange du code contre tokens
          await stravaService.handleCallback(code);
          
          // Nettoyage de l'URL pour une expérience utilisateur fluide
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Chargement immédiat des données athlète
          await loadData();
        } catch (err: any) {
          console.error("Auth Failure:", err);
          setError("Échec de la liaison Strava. Assurez-vous que le CLIENT_SECRET est configuré.");
        } finally {
          setLoading(false);
        }
      } else if (stravaService.isAuthenticated()) {
        // Chargement automatique si déjà authentifié
        loadData();
      }
    };

    handleAuthentication();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stravaService.fetchAthleteData();
      setAthleteData(data);
    } catch (err: any) {
      setError(err.message || "Erreur de synchronisation Strava.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    setError(null);
    stravaService.initiateAuth();
  };

  useEffect(() => {
    if (athleteData) {
      const newPlan = generatePlan(athleteData, { targetVam, weeks });
      setPlan(newPlan);
    }
  }, [athleteData, targetVam, weeks]);

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex justify-center selection:bg-[#FC4C02] selection:text-white">
      <div className="w-full max-w-4xl p-6 md:p-12">
        {/* Navigation Branding */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="bg-[#FC4C02] p-2.5 rounded-2xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-[#FC4C02]/20">
              <Mountain className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter leading-none uppercase">VERTICAL<span className="text-[#FC4C02]">SPEED</span></h1>
              <span className="text-[9px] text-neutral-600 uppercase font-black tracking-[0.3em]">Advanced Training Engine</span>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-end">
             <div className="flex items-center space-x-2 text-neutral-500">
                <Share2 size={12} className={athleteData ? 'text-[#FC4C02]' : ''} />
                <p className="text-[10px] uppercase font-bold tracking-widest">Strava Link</p>
             </div>
             <div className="flex items-center justify-end space-x-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${athleteData ? 'bg-[#FC4C02] shadow-[0_0_8px_#FC4C02]' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="mono text-[10px] font-bold text-neutral-400 uppercase">{athleteData ? 'ACTIVE' : 'OFFLINE'}</span>
             </div>
          </div>
        </header>

        {/* Error Feedback */}
        {error && (
          <div className="mb-8 bg-red-900/10 border border-red-900/40 p-5 rounded-2xl flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center space-x-4">
              <div className="bg-red-900/20 p-2 rounded-lg text-red-500">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 className="text-red-400 text-xs font-black uppercase tracking-widest">Erreur de Connexion</h4>
                <p className="text-red-200/70 text-sm italic">{error}</p>
              </div>
            </div>
            <button 
              onClick={handleConnect}
              className="bg-red-900/30 hover:bg-red-900/50 text-red-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Global Stats Loader */}
        <GarminHeader 
          data={athleteData} 
          loading={loading} 
          onConnect={handleConnect} 
          initialToken="" 
        />

        {/* Dashboard Sections */}
        {athleteData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ObjectiveInputs 
              targetVam={targetVam} 
              weeks={weeks} 
              setTargetVam={setTargetVam} 
              setWeeks={setWeeks} 
            />
            
            <VamChart data={athleteData} objective={{targetVam, weeks}} />
            
            <CoachInsights data={athleteData} objective={{targetVam, weeks}} />
            
            {plan && (
              <div className="mt-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                 <TrainingPlan sessions={plan.sessions} />
              </div>
            )}
          </div >
        )}

        {/* Technical Footer */}
        <footer className="mt-20 pt-8 border-t border-neutral-900 pb-12 flex flex-col md:flex-row justify-between items-center text-neutral-600 gap-4">
          <div className="flex items-center space-x-2">
            <Info size={14} className="text-[#FC4C02]/50" />
            <span className="text-[9px] uppercase font-bold tracking-[0.1em]">Engine : VAM = (Δ Altitude / Temps) * 3600</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[9px] font-bold tracking-widest text-neutral-700 uppercase">Methodology: Gravity Optimization</span>
            <span className="text-[10px] mono opacity-50 uppercase tracking-tighter">v5.2-native-strava-core</span>
          </div>
        </footer>
      </div>
      
      {/* Global Refresh Overlay */}
      {loading && !error && (
        <div className="fixed bottom-8 right-8 bg-[#FC4C02] text-white p-4 rounded-full shadow-2xl animate-spin z-50">
          <RefreshCw size={24} />
        </div>
      )}
    </div>
  );
};

export default App;
