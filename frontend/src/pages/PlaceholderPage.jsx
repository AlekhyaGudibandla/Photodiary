import { motion } from 'framer-motion';
import Header from '../components/Header';
import { PackageOpen } from 'lucide-react';

const PlaceholderPage = ({ title, description, icon: Icon }) => {
  return (
    <div className="flex-1 p-10 min-h-screen relative z-10">
      <Header />
      
      <main className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-heading font-black text-white mb-2 tracking-tighter">
            {title}
          </h2>
          <p className="text-gray-500 font-medium text-lg">{description}</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-20 flex flex-col items-center text-center max-w-3xl mx-auto border-dashed border-2 border-white/5"
        >
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 relative z-10">
            {Icon ? <Icon size={40} className="text-primary" /> : <PackageOpen size={40} className="text-primary" />}
          </div>

          <h3 className="text-2xl font-bold text-white mb-3">Coming Soon</h3>
          <p className="text-gray-500 mb-8 max-w-md">
            We are actively building the {title} module. It will be available in the next major update.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default PlaceholderPage;
