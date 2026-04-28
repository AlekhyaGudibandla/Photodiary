import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, ArrowRight, Brain } from "lucide-react";
import { motion } from "framer-motion";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isLogin ? "/login" : "/signup";
      const data = await apiRequest(endpoint, "POST", { email, password });

      if (!isLogin) {
        // Auto-login after signup
        const loginData = await apiRequest("/login", "POST", { email, password });
        login(loginData.token, { email, role: loginData.role });
      } else {
        login(data.token, { email, role: data.role });
      }
      
      navigate("/");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Mesh Background */}
      <div className="fixed inset-0 bg-mesh pointer-events-none z-0 opacity-50" />
      
      {/* Animated Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="glass-card p-10 relative overflow-hidden">
          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20"
            >
              <Brain size={32} className="text-white" />
            </motion.div>
            <h1 className="text-4xl font-heading font-black mb-3 tracking-tight">
              Photo<span className="text-primary">diary</span>
            </h1>
            <p className="text-gray-500 text-sm font-bold tracking-widest uppercase">
              Capture. Reflect. Grow.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-600 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-600 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center group mt-4 h-14"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Get Started"}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-gray-500 hover:text-white transition-colors"
            >
              {isLogin ? "Need an account? " : "Existing member? "}
              <span className="text-primary">{isLogin ? "Create one" : "Sign in"}</span>
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">
          <Sparkles size={12} className="text-secondary" />
          AI-Powered Insights
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
