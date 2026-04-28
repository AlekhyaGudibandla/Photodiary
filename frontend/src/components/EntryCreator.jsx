import { useState } from 'react';
import { Camera, Send, Sparkles, X, Image as ImageIcon, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../utils/api';

const EntryCreator = ({ onEntryCreated }) => {
  const [content, setContent] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const entry = await apiRequest('/entries', 'POST', {
        content,
        aiEnabled
      });
      setContent('');
      if (onEntryCreated) onEntryCreated(entry);
    } catch (error) {
      console.error('Failed to create entry:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden group mb-12 max-w-2xl mx-auto"
    >
      {/* Background glow on focus */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent-primary/5 to-accent-secondary/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />

      <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary shadow-inner">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">New Journal Entry</h3>
              <p className="text-xs text-white/40 font-medium">AI analysis will process in background</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${
              aiEnabled 
                ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary shadow-lg shadow-accent-primary/10" 
                : "bg-white/5 border-white/10 text-white/30"
            }`}
          >
            <Sparkles size={16} className={aiEnabled ? "animate-pulse" : ""} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Intelligence</span>
          </button>
        </div>

        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Capture your thoughts, progress, or feelings..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-white placeholder:text-white/10 focus:outline-none focus:border-accent-primary/40 focus:bg-white/[0.05] transition-all min-h-[160px] resize-none text-lg leading-relaxed shadow-inner"
            disabled={loading}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button type="button" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5">
                <ImageIcon size={20} />
              </button>
              <button type="button" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5">
                <Mic size={20} />
              </button>
              <button type="button" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5">
                <Camera size={20} />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-10 py-4 rounded-2xl gradient-bg text-white font-bold shadow-xl shadow-accent-primary/20 hover:shadow-accent-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100 flex items-center gap-3 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="tracking-tight">Save Entry</span>
                  <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default EntryCreator;
