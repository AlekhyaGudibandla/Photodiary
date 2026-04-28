import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useSocket } from "../context/SocketContext";

const SystemAlert = () => {
  const { systemAlert } = useSocket();

  return (
    <AnimatePresence>
      {systemAlert && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: "-50%" }}
          animate={{ opacity: 1, y: 20, x: "-50%" }}
          exit={{ opacity: 0, y: -100, x: "-50%" }}
          className="fixed top-0 left-1/2 z-[100] w-full max-w-md px-4"
        >
          <div className="glass bg-red-500/20 border-red-500/40 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-red-400 mb-1">System Alert</h4>
              <p className="text-white text-xs font-bold leading-relaxed">
                {systemAlert.message || "High system load detected. AI analysis might be delayed."}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SystemAlert;
