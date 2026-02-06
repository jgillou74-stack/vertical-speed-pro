
import React from 'react';
import { AthleteData } from '../types';
import { Activity, Weight, Zap, Heart, Link, History, TrendingUp, Clock, RefreshCw, LogIn } from 'lucide-react';

interface Props {
  data: AthleteData | null;
  loading: boolean;
  onConnect: () => void;
  initialToken: string;
}

const GarminHeader: React.FC<Props> = ({ data, loading, onConnect }) => {

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  };

  if (!data) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Activity className="text-[#FC4C02] w-16 h-16 animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-white font-bold text-lg italic uppercase tracking-tighter">Connectez votre Strava</h3>
          <p className="text-neutral-500 text-sm max-w-xs mx-auto mt-2">
            Utilisez le flux sécurisé <span className="text-[#FC4C02] font-bold">OAuth 2.0</span> pour analyser vos performances réelles.
          </p>
        </div>

        <button 
          onClick={onConnect}
          className="bg-[#FC4C02] hover:bg-[#e34402] text-white font-black py-4 px-12 rounded-xl transition-all active:scale-95 flex items-center justify-center space-x-3 shadow-lg shadow-[#FC4C02]/20 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          <span>{loading ? "Chargement..." : "Se connecter avec Strava"}</span>
        </button>
        <p className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest italic">Analyse automatique du VAM 4min</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Profil Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col items-center group hover:border-[#FC4C02]/40 transition-colors">
          <Weight className="text-[#FC4C02] mb-2 w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">Poids Profil</span>
          <span className="text-2xl font-black mono text-white">{data.weight.toFixed(1)}<span className="text-sm font-normal text-neutral-600 ml-1">kg</span></span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col items-center group hover:border-emerald-500/40 transition-colors">
          <Heart className="text-emerald-500 mb-2 w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">VO2 Max (Est.)</span>
          <span className="text-2xl font-black mono text-emerald-400">{data.vo2max}</span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col items-center group border-[#FC4C02]/40 transition-colors">
          <Zap className="text-[#FC4C02] mb-2 w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">VAM Max Détectée</span>
          <span className="text-2xl font-black mono text-white">{data.vam4min}<span className="text-sm font-normal text-neutral-600 ml-1">m/h</span></span>
        </div>
      </div>

      {/* Recent Activities Section */}
      {data.recentActivities && data.recentActivities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-[#FC4C02] px-1">
            <History size={16} />
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Dernières sorties analysées</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recentActivities.map((act, i) => (
              <div key={i} className="bg-neutral-900/40 border border-neutral-800/60 p-4 rounded-xl flex flex-col justify-between hover:border-[#FC4C02]/30 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="text-sm font-bold text-neutral-100 group-hover:text-white line-clamp-1">{act.name}</h5>
                  <span className="text-[#FC4C02] text-xs font-black mono">{act.vam} m/h</span>
                </div>
                <div className="flex items-center space-x-4 text-neutral-500 text-[10px] font-bold uppercase">
                  <div className="flex items-center space-x-1">
                    <TrendingUp size={12} className="text-neutral-600" />
                    <span>+{act.elevation}m</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={12} className="text-neutral-600" />
                    <span>{formatDuration(act.time)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-neutral-900/50 border border-neutral-800 px-4 py-2 rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[10px] text-neutral-500 font-bold uppercase">
          <Link size={12} className="text-[#FC4C02]" />
          <span>Statut :</span>
          <span className="text-emerald-400 font-bold">Synchronisé via OAuth</span>
        </div>
        <button 
          onClick={onConnect}
          className="text-[10px] mono text-[#FC4C02] hover:underline uppercase font-bold flex items-center space-x-1"
        >
          {loading ? <RefreshCw size={10} className="animate-spin" /> : null}
          <span>{loading ? "Sync en cours..." : "Actualiser"}</span>
        </button>
      </div>
    </div>
  );
};

export default GarminHeader;
