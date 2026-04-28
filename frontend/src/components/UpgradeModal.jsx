import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Star, Zap, Crown } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose }) => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for starters',
      icon: <Zap size={24} className="text-gray-400" />,
      features: ['100 MB Storage', 'Basic AI Insights', 'Daily Journaling'],
      notIncluded: ['Custom Themes', 'Advanced Analytics', 'Voice Journals'],
      color: 'border-white/10'
    },
    {
      name: 'Premium',
      price: '$9',
      description: 'Most popular choice',
      icon: <Star size={24} className="text-primary" />,
      features: ['5 GB Storage', 'Advanced AI Insights', 'Voice Journals', 'Custom Themes'],
      notIncluded: ['Unlimited Storage', 'White Label Support'],
      color: 'border-primary',
      popular: true
    },
    {
      name: 'Pro',
      price: '$19',
      description: 'For power users',
      icon: <Crown size={24} className="text-secondary" />,
      features: ['Unlimited Storage', 'Enterprise AI Copilot', 'Priority Support', 'API Access'],
      notIncluded: [],
      color: 'border-secondary'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-5xl glass-card p-10 relative overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-12">
              <h2 className="text-4xl font-heading font-black text-white mb-4">
                Choose your <span className="text-primary">path</span>
              </h2>
              <p className="text-gray-500 font-medium">Unlock the full power of your AI Photodiary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div 
                  key={plan.name}
                  className={`glass-card p-8 flex flex-col border-2 ${plan.color} relative ${plan.popular ? 'bg-primary/5' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <div className="mb-4">{plan.icon}</div>
                    <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-white">{plan.price}</span>
                      <span className="text-gray-500 font-bold">/mo</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-medium">{plan.description}</p>
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shrink-0">
                          <Check size={12} />
                        </div>
                        {f}
                      </div>
                    ))}
                    {plan.notIncluded.map(f => (
                      <div key={f} className="flex items-center gap-3 text-sm text-gray-600 font-medium opacity-50">
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-gray-600 shrink-0">
                          <X size={12} />
                        </div>
                        {f}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => { alert(`Plan ${plan.name} selected! This is a demo.`); onClose(); }}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                      plan.popular 
                        ? 'bg-primary text-black shadow-lg shadow-primary/20 hover:scale-[1.02]' 
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {plan.price === '$0' ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
