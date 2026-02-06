
import React, { useState, useEffect } from 'react';
import { AthleteData, UserObjective, CoachingPlan } from './types';
import { StravaService } from './services/stravaService';
import { generatePlan } from './services/coachingEngine';
import GarminHeader from './components/GarminHeader';
import ObjectiveInputs from './components/ObjectiveInputs';
import TrainingPlan from './components/TrainingPlan';
import VamChart from './components/VamChart';
import CoachInsights from './components/CoachInsights';
import { Mountain, Info, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [athleteData, setAthleteData] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetVam, setTargetVam] = useState(1100);
  const [weeks, setWeeks] = useState(12);
  const [plan, setPlan] = useState<CoachingPlan | null>(null);

  const stravaService = StravaService.getInstance();

  // Gérer le retour de l'OAuth et l'auto-chargement
  useEffect(() => {
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        setLoading(true);
        try {
          await stravaService.handleCallback(code);
          // Nettoyer l'URL
          window.history.replaceState({}, document.title, window.location.pathname);
          await loadData();
        } catch (err) {
          console.error("Auth failed", err);
        } finally {
          setLoading(false);
        }
      } else if (stravaService.isAuthenticated()) {
        loadData();
      }
    };

    handleAuth();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await stravaService.fetchAthleteData();
      setAthleteData(data);
    } catch (err: any) {
      console.error("Load failed", err);
      if (err.message.includes("expirée")) {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
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
        {/* Header Branding */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="bg-[#FC4C02] p-2.5 rounded-2xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-[#FC4C02]/20">
              <Mountain className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter leading-none uppercase">VERTICAL<span className="text-[#FC4C02]">SPEED</span></h1>
              <span className="text-[9px] text-neutral-600 uppercase font-black tracking-[0.3em]">Advanced Strava Engine</span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end">
             <div className="flex items-center space-x-2 text-neutral-500">
                <Share2 size={12} className={athleteData ? 'text-[#FC4C02]' : ''} />
                <p className="text-[10px] uppercase font-bold tracking-widest">Strava Sync</p>
             </div>
             <div className="flex items-center justify-end space-x-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${athleteData ? 'bg-[#FC4C02] shadow-[0_0_8px_#FC4C02]' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="mono text-[10px] font-bold text-neutral-400 uppercase">{athleteData ? 'API_ACTIVE' : 'WAITING'}</span>
             </div>
          </div>
        </header>

        {/* Top Section: Metrics */}
        <GarminHeader 
          data={athleteData} 
          loading={loading} 
          onConnect={handleConnect} 
          initialToken="" 
        />

        {/* Middle Section: Inputs & Evolution */}
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
          </div >
        )}

        {/* Bottom Section: Plan */}
        {plan && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
             <TrainingPlan sessions={plan.sessions} />
          </div>
        )}

        {/* Footer info */}
        <footer className="mt-20 pt-8 border-t border-neutral-900 pb-12 flex flex-col md:flex-row justify-between items-center text-neutral-600 gap-4">
          <div className="flex items-center space-x-2">
            <Info size={14} className="text-[#FC4C02]/50" />
            <span className="text-[9px] uppercase font-bold tracking-[0.1em]">Formule VAM : (D+ / Moving Time) * 3600</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[9px] font-bold">OFFICIAL OAUTH 2.0 ENGINE</span>
            <span className="text-[10px] mono opacity-50 uppercase">V4.0.0-AUTO</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
