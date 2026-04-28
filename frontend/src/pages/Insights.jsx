import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { apiRequest } from '../utils/api';
import { motion } from 'framer-motion';
import { LineChart, Sparkles, TrendingUp, Calendar, Heart, Hash } from 'lucide-react';

const Insights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await apiRequest('/insights');
        setData(response);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div className="flex-1 p-10 min-h-screen relative z-10">
      <Header />
      
      <main className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-heading font-black text-white mb-2 tracking-tighter flex items-center gap-3">
            <LineChart className="text-primary" size={32} />
            AI Insights
          </h2>
          <p className="text-gray-500 font-medium text-lg">Deep dive into your emotional patterns and trends.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !data || data.stats.totalEntries === 0 ? (
          <div className="glass-card p-20 flex flex-col items-center text-center border-dashed border-2 border-white/5">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Sparkles size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Not Enough Data</h3>
            <p className="text-gray-500">Keep journaling! AI Insights will unlock after you create more entries.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* AI Reflection */}
            <div className="glass-card p-8 border border-primary/20 bg-primary/5 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 opacity-10 text-primary">
                <Sparkles size={160} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <Sparkles size={16} />
                AI Analysis
              </h3>
              <p className="text-xl text-white/90 leading-relaxed font-medium relative z-10">
                "{data.insights}"
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard icon={<TrendingUp />} title="Avg Mood" value={data.stats.avgMood} subtitle="/ 10" color="text-yellow-400" />
              <StatCard icon={<Calendar />} title="Current Streak" value={data.stats.streakDays} subtitle="Days" color="text-secondary" />
              <StatCard icon={<Heart />} title="Total Entries" value={data.stats.totalEntries} color="text-blue-400" />
              <StatCard icon={<Hash />} title="Media Added" value={data.stats.entriesWithMedia} color="text-purple-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Mood Distribution */}
              <div className="glass-card p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Mood Distribution</h3>
                <div className="space-y-4">
                  <MoodBar label="Amazing (9-10)" count={data.stats.moodDist.great} total={data.stats.totalEntries} color="bg-orange-400" />
                  <MoodBar label="Good (7-8)" count={data.stats.moodDist.good} total={data.stats.totalEntries} color="bg-yellow-400" />
                  <MoodBar label="Okay (5-6)" count={data.stats.moodDist.okay} total={data.stats.totalEntries} color="bg-blue-400" />
                  <MoodBar label="Low (< 5)" count={data.stats.moodDist.low} total={data.stats.totalEntries} color="bg-indigo-400" />
                </div>
              </div>

              {/* Top Tags */}
              <div className="glass-card p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Top Themes</h3>
                <div className="flex flex-wrap gap-3">
                  {data.stats.topTags.map((tag, idx) => (
                    <div key={idx} className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors">
                      <span className="text-white font-bold">{tag.name}</span>
                      <span className="px-2 py-1 bg-black/40 rounded-lg text-xs font-black text-gray-400">{tag.count}</span>
                    </div>
                  ))}
                  {data.stats.topTags.length === 0 && <span className="text-gray-500 italic">No tags used yet.</span>}
                </div>
              </div>
            </div>
            
            {/* Activity Chart Mockup (Visual only for now) */}
             <div className="glass-card p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-8">Activity (Last 14 Days)</h3>
                <div className="flex items-end gap-2 h-32">
                    {data.stats.last14Days.map((day, i) => {
                        const maxCount = Math.max(...data.stats.last14Days.map(d => d.count), 1);
                        const height = `${Math.max((day.count / maxCount) * 100, 5)}%`;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-white/5 rounded-t-sm relative group-hover:bg-white/10 transition-colors h-full flex items-end">
                                    <div 
                                        className="w-full bg-primary/60 rounded-t-sm group-hover:bg-primary transition-colors"
                                        style={{ height }}
                                    />
                                    {day.count > 0 && (
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {day.count}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[8px] text-gray-600 uppercase font-bold">{day.date.split('-')[2]}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, color }) => (
  <div className="glass-card p-6 flex flex-col gap-4">
    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-3xl font-black text-white flex items-baseline gap-1">
        {value} <span className="text-sm text-gray-500 font-bold">{subtitle}</span>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">{title}</div>
    </div>
  </div>
);

const MoodBar = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold text-gray-400">
        <span>{label}</span>
        <span>{count} entries</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${color}`} 
        />
      </div>
    </div>
  );
};

export default Insights;
