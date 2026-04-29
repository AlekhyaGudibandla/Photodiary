import { useState, useEffect } from "react";
import { apiRequest } from "../utils/api";
import { Library, Plus, Image as ImageIcon, LayoutGrid, Trash2, Loader2, X, Camera, Share2, PlusSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import { useModal } from "../context/ModalContext";

const Collections = () => {
  const { openEntryModal, openShareModal, openAddExistingModal } = useModal();
  const [collections, setCollections] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const fetchCollections = async () => {
    try {
      const data = await apiRequest("/collections");
      setCollections(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleCollectionClick = async (id, silent = false) => {
    if (!silent) setDetailLoading(true);
    try {
      const data = await apiRequest(`/collections/${id}`);
      setSelectedCollection(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
    const handleClickAway = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickAway);
    
    window.addEventListener('entryCreated', handleRefresh);
    window.addEventListener('entryDeleted', handleRefresh);
    
    return () => {
      window.removeEventListener('click', handleClickAway);
      window.removeEventListener('entryCreated', handleRefresh);
      window.removeEventListener('entryDeleted', handleRefresh);
    };
  }, []);

  const refreshDetailView = () => {
    if (selectedCollection) {
      handleCollectionClick(selectedCollection.id, true);
    }
  };

  const handleRefresh = () => {
    fetchCollections();
    refreshDetailView();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    try {
      await apiRequest("/collections", "POST", { title: newTitle, description: newDesc });
      setNewTitle("");
      setNewDesc("");
      setIsCreating(false);
      handleRefresh();
    } catch (err) {
      alert("Failed to create collection: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (id) => {
    if (!confirm("Are you sure you want to delete this collection? Entries will not be deleted.")) return;
    try {
      await apiRequest(`/collections/${id}`, "DELETE");
      handleRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-10 min-h-screen relative z-10">
      <Header />
      
      <main className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {!selectedCollection ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in">
                <div>
                  <h2 className="text-4xl font-heading font-black text-white mb-2 tracking-tighter flex items-center gap-3">
                    <Library className="text-primary" size={32} />
                    Collections
                  </h2>
                  <p className="text-gray-500 font-medium text-lg">Group your memories into beautiful albums.</p>
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> New Collection
                </button>
              </div>

              <AnimatePresence>
                {isCreating && (
                  <motion.form 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="glass-card p-8 mb-12 flex flex-col gap-4 border border-primary/30 relative overflow-hidden"
                    onSubmit={handleCreate}
                  >
                    <button 
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>

                    <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Create New Collection</h3>
                    
                    <input 
                      placeholder="Collection Title" 
                      className="bg-transparent text-2xl font-bold text-white outline-none placeholder:text-gray-700"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      autoFocus
                      disabled={loading}
                    />
                    <textarea 
                      placeholder="Optional description..." 
                      className="bg-transparent text-gray-400 outline-none placeholder:text-gray-800 resize-none h-20"
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      disabled={loading}
                    />
                    <div className="flex justify-end gap-3 mt-4">
                      <button 
                        type="button" 
                        onClick={() => setIsCreating(false)}
                        className="px-6 py-3 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={loading || !newTitle.trim()}
                        className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : "Create"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {fetching ? (
                  [1,2,3].map(i => <div key={i} className="glass-card h-80 animate-pulse bg-white/5" />)
                ) : (
                  <AnimatePresence>
                    {collections.map((col, idx) => {
                      const colors = [
                        { bg: 'from-purple-500/10 to-transparent', border: 'border-purple-500/20', text: 'text-purple-400' },
                        { bg: 'from-emerald-500/10 to-transparent', border: 'border-emerald-500/20', text: 'text-emerald-400' },
                        { bg: 'from-amber-500/10 to-transparent', border: 'border-amber-500/20', text: 'text-amber-400' },
                        { bg: 'from-blue-500/10 to-transparent', border: 'border-blue-500/20', text: 'text-blue-400' }
                      ];
                      const theme = colors[idx % colors.length];

                      return (
                        <motion.div 
                          key={col.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={() => handleCollectionClick(col.id)}
                          className={`glass-card group overflow-hidden flex flex-col h-[340px] relative cursor-pointer transition-all duration-300 border border-white/5 hover:border-white/20 hover:scale-[1.01] shadow-xl`}
                        >
                          {/* Top Actions */}
                          <div className="absolute top-4 right-4 z-20">
                            <div className="relative">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === col.id ? null : col.id); }}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400"
                              >
                                <LayoutGrid size={16} />
                              </button>
                              
                              {openMenuId === col.id && (
                                <div className="absolute top-full right-0 mt-2 py-2 w-40 bg-[#12121A] border border-white/10 rounded-xl shadow-2xl z-30" onClick={e => e.stopPropagation()}>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); openShareModal('collection', col, handleRefresh); }}
                                    className="w-full px-4 py-2 text-left text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                  >
                                    <Share2 size={14} /> Share
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); deleteCollection(col.id); }}
                                    className="w-full px-4 py-2 text-left text-xs font-bold text-red-500/70 hover:text-red-500 hover:bg-red-500/5 flex items-center gap-2"
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="relative z-10 flex flex-col items-center p-8 h-full">
                            {/* Icon / Illustration */}
                            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-105 transition-transform">
                              <Library className={`${theme.text}`} size={28} />
                            </div>

                            {/* Info */}
                            <div className="text-center mb-8">
                              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-primary transition-colors">{col.title}</h3>
                              <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                <span>{col._count?.entries || 0} Entries • {new Date(col.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <button 
                              className="w-full py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-[0.2em] text-white mt-auto"
                            >
                              View Album
                            </button>
                          </div>
                          
                          {/* Subtle background glow */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              {!fetching && collections.length === 0 && !isCreating && (
                <div className="glass-card p-20 text-center border-dashed border-2 border-white/5 mt-8">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <Library size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-500 mb-2">No Collections</h3>
                  <p className="text-gray-600 text-sm">Create albums to organize your entries around themes, trips, or ideas.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setSelectedCollection(null)}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all flex items-center justify-center"
                >
                  <X size={24} />
                </button>
                <div className="flex-1">
                  <h2 className="text-5xl font-heading font-black text-white mb-2 tracking-tighter">
                    {selectedCollection.title}
                  </h2>
                  <p className="text-gray-500 font-medium text-lg">
                    {selectedCollection.description || "Viewing all entries in this collection."}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => openEntryModal(null, selectedCollection.id)}
                    className="w-12 h-12 bg-primary text-black rounded-xl hover:scale-110 transition-transform shadow-lg shadow-primary/20 flex items-center justify-center"
                    title="Add Entry"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={() => openAddExistingModal(selectedCollection.id, handleRefresh)}
                    className="w-12 h-12 bg-blue-500 text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-blue-500/20 flex items-center justify-center"
                    title="Add Existing"
                  >
                    <PlusSquare size={20} />
                  </button>
                  <button 
                    onClick={() => openShareModal('collection', selectedCollection, handleRefresh)}
                    className="w-12 h-12 bg-secondary text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-secondary/20 flex items-center justify-center"
                    title="Share"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {detailLoading ? (
                  [1,2,3,4].map(i => <div key={i} className="glass-card h-[320px] animate-pulse" />)
                ) : selectedCollection.entries?.length > 0 ? (
                  selectedCollection.entries.map((entry, idx) => {
                    const colors = ['text-purple-400', 'text-emerald-400', 'text-amber-400', 'text-blue-400'];
                    const color = colors[idx % colors.length];
                    
                    return (
                      <motion.div
                        key={entry.id}
                        onClick={() => openEntryModal(entry)}
                        className="glass-card group overflow-hidden h-[320px] relative cursor-pointer border border-white/5 hover:border-white/20 transition-all hover:scale-[1.01] flex flex-col"
                      >
                        <div className="p-8 flex flex-col items-center h-full relative z-10">
                          {/* Entry Icon */}
                          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                            {entry.media?.[0] ? (
                              <img src={entry.media[0].url} alt="" className="w-full h-full object-cover rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity" />
                            ) : (
                              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
                                <LayoutGrid size={20} />
                              </div>
                            )}
                          </div>

                          <div className="text-center mb-6">
                            <h4 className="text-xl font-bold text-white mb-2 line-clamp-2">{entry.title || 'Untitled Moment'}</h4>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                              {entry.media?.length || 0} Media • {new Date(entry.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <button 
                            className="w-full py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-[0.2em] text-white mt-auto"
                          >
                            View Entry
                          </button>
                        </div>
                        
                        {/* Subtle background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-20 text-center glass-card border-dashed border-2 border-white/5">
                    <p className="text-gray-500 font-medium">No entries in this collection yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Collections;

