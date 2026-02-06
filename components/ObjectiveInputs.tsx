
import React from 'react';
import { Target, Calendar } from 'lucide-react';

interface Props {
  targetVam: number;
  weeks: number;
  setTargetVam: (v: number) => void;
  setWeeks: (w: number) => void;
}

const ObjectiveInputs: React.FC<Props> = ({ targetVam, weeks, setTargetVam, setWeeks }) => {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl mb-8">
      <h3 className="text-orange-500 text-xs font-black uppercase tracking-tighter mb-4 flex items-center">
        <Target className="w-4 h-4 mr-2" /> Objective Configuration
      </h3>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-neutral-400 text-[10px] uppercase font-bold mb-2">Target VAM (m/h)</label>
          <input 
            type="range" 
            min="400" 
            max="2000" 
            step="10"
            value={targetVam}
            onChange={(e) => setTargetVam(parseInt(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-neutral-600 text-[10px] mono">400</span>
            <span className="text-2xl font-black text-white mono">{targetVam}</span>
            <span className="text-neutral-600 text-[10px] mono">2000</span>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-neutral-400 text-[10px] uppercase font-bold mb-2">Preparation (Weeks)</label>
          <input 
            type="range" 
            min="4" 
            max="24" 
            step="1"
            value={weeks}
            onChange={(e) => setWeeks(parseInt(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-neutral-600 text-[10px] mono">4</span>
            <span className="text-2xl font-black text-white mono">{weeks}</span>
            <span className="text-neutral-600 text-[10px] mono">24</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectiveInputs;
