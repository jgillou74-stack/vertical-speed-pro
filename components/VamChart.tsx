
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AthleteData, UserObjective } from '../types';

interface Props {
  data: AthleteData;
  objective: UserObjective;
}

const VamChart: React.FC<Props> = ({ data, objective }) => {
  const chartData = Array.from({ length: objective.weeks + 1 }, (_, i) => {
    const progression = i / objective.weeks;
    return {
      name: `S${i}`,
      vam: Math.round(data.vam4min + (objective.targetVam - data.vam4min) * progression),
      base: data.vam4min
    };
  });

  return (
    <div className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-2xl mb-8">
      <h3 className="text-neutral-500 text-xs font-black uppercase tracking-widest mb-4">Progression VAM Estimée</h3>
      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#525252', fontSize: 10}} />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px'}}
              itemStyle={{color: '#FC4C02', fontSize: '12px', fontWeight: 'bold'}}
              labelStyle={{display: 'none'}}
            />
            <Line 
              type="monotone" 
              dataKey="vam" 
              stroke="#FC4C02" 
              strokeWidth={3} 
              dot={{r: 4, fill: '#FC4C02'}} 
              activeDot={{r: 6}}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VamChart;
