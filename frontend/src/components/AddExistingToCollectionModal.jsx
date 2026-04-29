import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Loader2, Plus, Calendar } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { format } from 'date-fns';

const AddExistingToCollectionModal = ({ isOpen, onClose, collectionId, sharedHash = null, onAdded }) => {
  const [entries, setEntries] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEntries();
    }
  }, [isOpen]);

  const fetchEntries = async () => {
    try {
      const data = await apiRequest('/entries');
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(selectedIds.map(entryId => {
        const endpoint = sharedHash 
          ? `/shared/collection/${sharedHash}/entries/${entryId}`
          : `/collections/${collectionId}/entries/${entryId}`;
        return apiRequest(endpoint, 'POST');
      }));
      if (onAdded) onAdded();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredEntries = entries.filter(e => 
    (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.content || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" 
          />
          <div className="fixed inset-0 grid place-items-center z-[9999] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl h-[80vh] glass-card flex flex-col border border-white/10 pointer-events-auto shadow-2xl relative"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Add Existing Entries</h2>
                  <p className="text-xs text-gray-500 font-medium">Select moments to group into this collection</p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="text"
                    placeholder="Search your moments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
                {loading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" /></div>
                ) : filteredEntries.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No entries found matching your search.</div>
                ) : (
                  filteredEntries.map(entry => (
                    <div 
                      key={entry.id}
                      onClick={() => toggleSelect(entry.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                        selectedIds.includes(entry.id) 
                          ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                          : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                        selectedIds.includes(entry.id) ? 'bg-primary border-primary text-black' : 'border-white/20'
                      }`}>
                        {selectedIds.includes(entry.id) && <Check size={14} />}
                      </div>
                      {entry.media?.[0] ? (
                        <img src={entry.media[0].url} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-gray-500"><Calendar size={20} /></div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">{entry.title || 'Untitled Moment'}</h4>
                        <p className="text-[10px] text-gray-500">{format(new Date(entry.createdAt), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">{selectedIds.length} entries selected</span>
                <div className="flex gap-3">
                  <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                  <button 
                    onClick={handleSave}
                    disabled={selectedIds.length === 0 || saving}
                    className="px-6 py-2.5 rounded-xl bg-primary text-black text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : `Add to Collection`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddExistingToCollectionModal;
