import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Smile, Target, Flame, Brain, Info } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { apiRequest } from '../utils/api';

const RightSidebar = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const response = await apiRequest('/insights');
      setData(response);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    
    // Refresh on new entries
    const handleRefresh = () => fetchInsights();
    window.addEventListener('entryCreated', handleRefresh);
    return () => window.removeEventListener('entryCreated', handleRefresh);
  }, []);

  const hasData = data && data.stats.totalEntries > 0;

  // Format mood data for chart
  const moodChartData = data?.stats.last14Days.slice(-7).map(d => ({
    day: d.date.split('-')[2], // Day number
    score: d.count > 0 ? (data.stats.avgMood || 5) : 0 
  })) || [
    { day: 'M', score: 0 },
    { day: 'T', score: 0 },
    { day: 'W', score: 0 },
    { day: 'T', score: 0 },
    { day: 'F', score: 0 },
    { day: 'S', score: 0 },
    { day: 'S', score: 0 },
  ];

  return (
    <aside className="w-[380px] h-screen overflow-y-auto p-6 space-y-6 sticky top-0 scrollbar-hide z-20 hidden xl:block">
      {/* AI Insight */}
      <div className="glass-card p-6 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={18} />
            <span className="text-sm font-bold uppercase tracking-widest">AI Insight</span>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
            View all
          </button>
        </div>
        
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : hasData ? (
          <div className="space-y-4">
            <p className="text-sm text-white/80 leading-relaxed font-medium italic">
              "{data.insights.length > 120 ? data.insights.slice(0, 120) + '...' : data.insights}"
            </p>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <Brain size={12} />
              Personalized for you
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain size={32} className="text-primary opacity-50" />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-2">
              Waiting for activity
            </p>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Start journaling to get personalized AI insights.
            </p>
          </div>
        )}
      </div>

      {/* Mood This Week */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest">Activity & Mood</h3>
          <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[8px] text-gray-600 group relative cursor-help">
            i
            <div className="absolute bottom-full right-0 mb-2 w-40 p-2 bg-black text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Showing your journaling activity for the past 7 days.
            </div>
          </div>
        </div>
        
        <div className="h-[120px] w-full relative">
          {!hasData && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-card/60 backdrop-blur-[2px] rounded-xl">
              <span className="text-xs font-bold text-white mb-1">No data yet</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center px-4">Keep journaling to see trends</span>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={moodChartData}>
              <defs>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMood)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Habits */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest">Key Metrics</h3>
        </div>

        <div className="space-y-4">
          <MetricItem 
            icon={<Brain size={16} />} 
            label="Avg Mood" 
            value={hasData ? `${data.stats.avgMood}/10` : 'N/A'} 
            color="text-primary" 
          />
          <MetricItem 
            icon={<Target size={16} />} 
            label="Total Entries" 
            value={hasData ? data.stats.totalEntries : '0'} 
            color="text-blue-400" 
          />
          <MetricItem 
            icon={<Smile size={16} />} 
            label="Media Count" 
            value={hasData ? data.stats.entriesWithMedia : '0'} 
            color="text-orange-400" 
          />
        </div>
      </div>

      {/* Streak */}
      <div className="glass-card p-6 bg-gradient-to-br from-card to-[#1A1A24]">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${hasData && data.stats.streakDays > 0 ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-gray-700'}`}>
            <Flame size={28} />
          </div>
          <div>
            <div className="text-4xl font-heading font-black text-white leading-none">
              {data?.stats.streakDays || 0}
            </div>
            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">days in a row</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const MetricItem = ({ icon, label, value, color }) => (
  <div className="flex items-center justify-between group cursor-default">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color} opacity-60`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-white/80">{label}</div>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lifetime Progress</div>
      </div>
    </div>
    <div className="text-lg font-black text-white">{value}</div>
  </div>
);

export default RightSidebar;
