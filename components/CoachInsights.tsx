
import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Quote } from 'lucide-react';
import { AthleteData, UserObjective } from '../types';

interface Props {
  data: AthleteData;
  objective: UserObjective;
}

const CoachInsights: React.FC<Props> = ({ data, objective }) => {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `You are an expert endurance coach like Kilian Jornet. 
        Athlete Data (extracted from Strava): Weight ${data.weight}kg, VO2 Max ${data.vo2max}, Current VAM ${data.vam4min}m/h. 
        Target: ${objective.targetVam}m/h in ${objective.weeks} weeks. 
        Provide a 2-sentence punchy motivational and physiological advice in French. Focus on vertical speed efficiency and gravity optimization.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setInsight(response.text || "Pousse tes limites, le sommet t'attend.");
      } catch (e) {
        setInsight("La régularité est la clé de la verticalité. Strava montre ton effort, le plan montre ta voie.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [data.vam4min, objective.targetVam, objective.weeks]);

  return (
    <div className="bg-[#FC4C02]/5 border border-[#FC4C02]/10 p-6 rounded-2xl mb-8">
      <div className="flex items-start space-x-4">
        <div className="bg-[#FC4C02] p-2 rounded-lg text-white shadow-lg shadow-[#FC4C02]/20">
          <Quote size={20} fill="currentColor" />
        </div>
        <div>
          <h4 className="text-[#FC4C02] text-xs font-black uppercase tracking-widest mb-1">Coach Kilian Insight</h4>
          <p className="text-neutral-200 text-sm leading-relaxed italic font-medium">
            {loading ? "Génération du conseil personnalisé..." : insight}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoachInsights;
