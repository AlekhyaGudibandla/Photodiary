import { useState, useEffect } from "react";
import { apiRequest } from "../utils/api";
import { Plus, Trash2, CheckCircle, Target, Sparkles, BrainCircuit, Flame, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchGoals = async () => {
    try {
      const data = await apiRequest("/goals");
      setGoals(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;

    setLoading(true);
    try {
      await apiRequest("/goals", "POST", { title: newGoal });
      setNewGoal("");
      fetchGoals();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = async (id, currentStatus) => {
    try {
      await apiRequest(`/goals/${id}`, "PUT", { isCompleted: !currentStatus });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteGoal = async (id) => {
    try {
      await apiRequest(`/goals/${id}`, "DELETE");
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-10 min-h-screen">
      <Header />
      
      <main className="max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in">
          <div>
            <h2 className="text-4xl font-heading font-black text-white mb-2 tracking-tighter">
              Habit <span className="text-primary">Intelligence</span>
            </h2>
            <p className="text-gray-500 font-medium text-lg">Define your goals. Track your transformation.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {/* Create Goal Form */}
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreate} 
              className="glass-card p-2 flex items-center shadow-2xl focus-within:border-primary/50 transition-all"
            >
              <input
                className="bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-700 px-8 py-4 flex-1 text-lg"
                placeholder="I want to..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={loading || !newGoal.trim()}
                className="bg-primary p-4 rounded-[20px] text-white shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50"
              >
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={24} />}
              </button>
            </motion.form>

            {/* Goals List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {goals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`glass-card p-6 group flex items-center justify-between ${
                      goal.isCompleted ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => toggleGoal(goal.id, goal.isCompleted)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          goal.isCompleted 
                            ? "bg-secondary border-secondary text-white" 
                            : "border-white/10 group-hover:border-primary text-transparent"
                        }`}
                      >
                        <CheckCircle size={16} />
                      </button>
                      <span className={`text-lg font-bold transition-all ${goal.isCompleted ? "line-through text-gray-500" : "text-white"}`}>
                        {goal.title}
                      </span>
                    </div>

                    <button 
                      onClick={() => deleteGoal(goal.id)}
                      className="p-3 rounded-xl bg-white/5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {goals.length === 0 && (
                <div className="glass-card p-20 text-center border-dashed">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <Target size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-500 mb-2">No active objectives</h3>
                  <p className="text-gray-600 text-sm">Define what you want to achieve to start tracking.</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card p-8 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 opacity-5">
                <BrainCircuit size={160} className="text-primary" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8 flex items-center gap-3">
                <Sparkles size={16} className="text-secondary" />
                Transformation Engine
              </h3>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                    <span>Consistency Velocity</span>
                    <span className="text-secondary">72%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "72%" }}
                      className="h-full bg-gradient-to-r from-primary to-secondary" 
                    />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <Flame size={20} />
                  </div>
                  <p className="text-xs font-medium text-gray-400 leading-relaxed italic">
                    "Users with at least 3 active habits are 4x more likely to reach their monthly goals."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Goals;
