import { useState, useEffect } from "react";
import { apiRequest } from "../utils/api";
import { Plus, Trash2, CheckCircle, Target, Sparkles, Bookmark, Compass, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";

const BucketList = () => {
  const [items, setItems] = useState([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchItems = async () => {
    try {
      const data = await apiRequest("/bucket");
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    setLoading(true);
    try {
      const newItem = await apiRequest("/bucket", "POST", { title: newItemTitle });
      setItems(prev => [newItem, ...prev]);
      setNewItemTitle("");
    } catch (err) {
      alert("Failed to add item: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (id, currentStatus) => {
    try {
      const updated = await apiRequest(`/bucket/${id}`, "PUT", { isCompleted: !currentStatus });
      setItems(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id) => {
    try {
      await apiRequest(`/bucket/${id}`, "DELETE");
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-10 min-h-screen relative z-10">
      <Header />
      
      <main className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in">
          <div>
            <h2 className="text-4xl font-heading font-black text-white mb-2 tracking-tighter flex items-center gap-3">
              <Bookmark className="text-primary" size={32} />
              Bucket <span className="text-primary">List</span>
            </h2>
            <p className="text-gray-500 font-medium text-lg">Track your dreams and life goals.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {/* Create Item Form */}
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreate} 
              className="glass-card p-2 flex items-center shadow-2xl focus-within:border-primary/50 transition-all border border-white/5"
            >
              <input
                className="bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-700 px-8 py-4 flex-1 text-lg"
                placeholder="Before I die I want to..."
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={loading || !newItemTitle.trim()}
                className="bg-primary p-4 rounded-[20px] text-black font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Add</>}
              </button>
            </motion.form>

            {/* Bucket List Items */}
            <div className="space-y-4">
              {fetching ? (
                <div className="flex justify-center py-20">
                  <Loader2 size={40} className="text-primary animate-spin opacity-20" />
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`glass-card p-6 group flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors ${
                        item.isCompleted ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => toggleItem(item.id, item.isCompleted)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                            item.isCompleted 
                              ? "bg-secondary border-secondary text-white shadow-lg shadow-secondary/20" 
                              : "border-white/10 group-hover:border-primary text-transparent"
                          }`}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <span className={`text-lg font-bold transition-all ${item.isCompleted ? "line-through text-gray-500" : "text-white"}`}>
                          {item.title}
                        </span>
                      </div>

                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="p-3 rounded-xl bg-white/5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {!fetching && items.length === 0 && (
                <div className="glass-card p-20 text-center border-dashed border-2 border-white/5">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <Compass size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-500 mb-2">No bucket list items</h3>
                  <p className="text-gray-600 text-sm">Add a dream to start tracking your life's adventures.</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card p-8 relative overflow-hidden border border-white/5">
              <div className="absolute -top-10 -right-10 opacity-5">
                <Target size={160} className="text-secondary" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8 flex items-center gap-3">
                <Sparkles size={16} className="text-secondary" />
                Life Progress
              </h3>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                    <span>Dreams Realized</span>
                    <span className="text-secondary">
                        {items.length > 0 ? Math.round((items.filter(i => i.isCompleted).length / items.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${items.length > 0 ? (items.filter(i => i.isCompleted).length / items.length) * 100 : 0}%` }}
                      className="h-full bg-gradient-to-r from-primary to-secondary" 
                    />
                  </div>
                  <div className="mt-4 text-xs font-bold text-gray-400">
                      {items.filter(i => i.isCompleted).length} of {items.length} completed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BucketList;

