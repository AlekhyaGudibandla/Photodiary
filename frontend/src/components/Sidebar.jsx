import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  LineChart, 
  ShieldCheck, 
  Brain, 
  Bookmark, 
  Library, 
  Settings,
  ChevronDown,
  LogOut,
  User as UserIcon,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useModal } from '../context/ModalContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isCallMode } = useCall();
  const { openUpgradeModal } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [stats, setStats] = useState({ totalEntries: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiRequest('/profile');
        setStats(data);
      } catch (err) {
        console.warn('Failed to fetch profile stats');
      }
    };
    if (user) fetchStats();
  }, [user]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Timeline', path: '/' },
    { icon: LineChart, label: 'Insights', path: '/insights' },
    { icon: ShieldCheck, label: 'Habits', path: '/goals' },
    { icon: Brain, label: 'AI Copilot', path: '/ai' },
    { icon: Bookmark, label: 'Bucket List', path: '/bucket' },
    { icon: Library, label: 'Collections', path: '/collections' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Simulated storage calculation
  const storageUsed = (stats.totalEntries * 0.5).toFixed(1); // 0.5 MB per entry avg
  const storageLimit = 100; // MB for free plan
  const storagePercent = Math.min((storageUsed / storageLimit) * 100, 100);

  return (
    <aside className="w-[280px] h-screen bg-card border-r border-white/5 flex flex-col p-6 sticky top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Brain size={24} className="text-white" />
        </div>
        <span className="text-2xl font-heading font-black tracking-tight text-white">Photodiary</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`nav-item relative ${isActive ? 'nav-item-active' : ''}`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
              {item.label === 'AI Copilot' && isCallMode && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Storage Indicator */}
      <div className="mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
          <span className="text-gray-500">Storage</span>
          <span className="text-white/60">{storageUsed} MB / {storageLimit} MB</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${storagePercent}%` }}
            className="h-full bg-primary" 
          />
        </div>
        <button 
          onClick={openUpgradeModal}
          className="mt-4 w-full text-[10px] font-black text-primary uppercase tracking-widest text-right hover:text-white transition-colors"
        >
          Upgrade
        </button>
      </div>

      {/* User Profile */}
      <div className="relative">
        <div 
          onClick={() => setShowAccountMenu(!showAccountMenu)}
          className={`flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border transition-all cursor-pointer group ${showAccountMenu ? 'border-primary/50 bg-white/[0.05]' : 'border-white/5 hover:bg-white/[0.05]'}`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                <span className="text-white font-bold">{user?.email?.[0].toUpperCase() || 'U'}</span>
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white truncate">
                {user?.email.split('@')[0] || 'New User'}
              </div>
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                Free Plan
              </div>
            </div>
          </div>
          <ChevronDown size={16} className={`text-gray-500 group-hover:text-white transition-transform duration-300 ${showAccountMenu ? 'rotate-180' : ''}`} />
        </div>

        <AnimatePresence>
          {showAccountMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 w-full mb-2 bg-[#12121A] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
            >
              <button 
                onClick={() => { navigate('/settings'); setShowAccountMenu(false); }}
                className="w-full flex items-center gap-3 p-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <UserIcon size={18} />
                Profile
              </button>
              <button 
                onClick={() => { openUpgradeModal(); setShowAccountMenu(false); }}
                className="w-full flex items-center gap-3 p-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <CreditCard size={18} />
                Billing
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 p-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <LogOut size={18} />
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default Sidebar;

