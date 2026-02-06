
import React, { useState } from 'react';
import { TrainingSession, TrainingType } from '../types';
import { ChevronRight, ChevronDown, Timer, Dumbbell, Zap } from 'lucide-react';

interface Props {
  sessions: TrainingSession[];
}

const TrainingPlan: React.FC<Props> = ({ sessions }) => {
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const maxWeek = Math.max(...sessions.map(s => s.week));

  const filteredSessions = sessions.filter(s => s.week === activeWeek);

  const getIcon = (type: TrainingType) => {
    switch(type) {
      case TrainingType.INTERVAL: return <Zap className="text-yellow-500" />;
      case TrainingType.THRESHOLD: return <Timer className="text-blue-500" />;
      case TrainingType.FORCE: return <Dumbbell className="text-red-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Your Vertical Blueprint</h2>
        <div className="flex items-center space-x-2">
           <button 
             onClick={() => setActiveWeek(prev => Math.max(1, prev - 1))}
             className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 disabled:opacity-50"
             disabled={activeWeek === 1}
           >
             <ChevronRight className="rotate-180 w-5 h-5" />
           </button>
           <span className="mono text-sm font-bold bg-neutral-800 px-4 py-2 rounded-lg">Week {activeWeek} / {maxWeek}</span>
           <button 
             onClick={() => setActiveWeek(prev => Math.min(maxWeek, prev + 1))}
             className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 disabled:opacity-50"
             disabled={activeWeek === maxWeek}
           >
             <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredSessions.map((session, idx) => (
          <div key={idx} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl hover:border-orange-500/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                {getIcon(session.type)}
              </div>
              <span className="text-[10px] mono bg-neutral-800 text-neutral-400 px-2 py-1 rounded uppercase tracking-widest">{session.type}</span>
            </div>
            <h4 className="text-lg font-bold mb-2 text-white leading-tight">{session.title}</h4>
            <p className="text-sm text-neutral-400 mb-4 line-clamp-3">{session.description}</p>
            <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
              <div className="flex flex-col">
                 <span className="text-[10px] text-neutral-500 uppercase font-bold">Intensity</span>
                 <span className="text-xs font-bold text-orange-500">{session.intensity}</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[10px] text-neutral-500 uppercase font-bold">Duration</span>
                 <span className="text-xs font-bold text-neutral-300">{session.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingPlan;
