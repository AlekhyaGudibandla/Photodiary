import { useState } from 'react';
import { Search, Plus, Bell, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

const Header = () => {
  const { user } = useAuth();
  const { openEntryModal, openSearchModal } = useModal();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const firstName = user?.email?.split('@')[0] || 'User';

  const notifications = [
    { id: 1, type: 'success', text: 'AI analysis complete for your last entry', time: '2m ago', icon: <CheckCircle2 size={14} className="text-green-500" /> },
    { id: 2, type: 'info', text: 'New insight: You seem happy on Tuesdays!', time: '1h ago', icon: <Info size={14} className="text-blue-500" /> },
    { id: 3, type: 'warning', text: 'Storage reaching 80% limit', time: '3h ago', icon: <AlertTriangle size={14} className="text-yellow-500" /> },
  ];

  return (
    <header className="flex items-center justify-between mb-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-3xl font-heading font-black text-white flex items-center gap-3 tracking-tight">
          Good morning, {firstName}! <span className="animate-bounce">👋</span>
        </h1>
        <p className="text-gray-500 font-medium mt-1">Capture. Reflect. Grow.</p>
      </motion.div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <button 
          onClick={openSearchModal}
          className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
        >
          <Search size={20} className="group-hover:scale-110 transition-transform" />
        </button>

        {/* New Entry Button */}
        <button onClick={() => openEntryModal()} className="btn-primary">
          <Plus size={20} />
          <span>New Entry</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${showNotifications ? 'bg-white/10 border-primary text-white' : 'bg-white/[0.03] border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            <Bell size={20} />
          </button>
          <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full border-2 border-[#0B0B0F]" />

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-80 bg-[#12121A] border border-white/10 rounded-2xl p-4 shadow-2xl z-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Notifications</h4>
                  <button className="text-[10px] text-primary font-black uppercase tracking-widest hover:text-white transition-colors">Clear all</button>
                </div>
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div key={n.id} className="flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="mt-0.5">{n.icon}</div>
                      <div>
                        <p className="text-xs text-gray-300 font-medium leading-tight group-hover:text-white transition-colors">{n.text}</p>
                        <span className="text-[10px] text-gray-600 font-bold">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 text-[10px] text-gray-500 font-black uppercase tracking-widest hover:text-white transition-colors border-t border-white/5 pt-4">
                  View all activity
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;

