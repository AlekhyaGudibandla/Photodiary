import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, ArrowRight } from 'lucide-react';
import { apiRequest } from '../utils/api';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/entries`);
        // Basic client-side filtering for demo
        const filtered = data.filter(e => 
          e.title?.toLowerCase().includes(query.toLowerCase()) || 
          e.content?.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-6 pt-24">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-[#0B0B0F] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative z-10"
          >
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
              <Search className="text-gray-500" size={24} />
              <input 
                autoFocus
                placeholder="Search your memories..." 
                className="bg-transparent border-none focus:ring-0 text-xl text-white w-full placeholder:text-gray-700"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-4 custom-scrollbar">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-4 mb-4">Results</p>
                  {results.map(entry => (
                    <div 
                      key={entry.id}
                      onClick={() => { /* Navigate to entry or close */ onClose(); }}
                      className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{entry.title || 'Untitled Moment'}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1">{entry.content}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  ))}
                </div>
              ) : query ? (
                <div className="p-12 text-center text-gray-600 font-medium">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="p-12 text-center text-gray-600 font-medium">
                  Start typing to search your diary...
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
