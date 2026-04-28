import { useState, useEffect } from 'react';
import Header from '../components/Header';
import TimelineHeader from '../components/TimelineHeader';
import EntryCard from '../components/EntryCard';
import { apiRequest } from '../utils/api';
import { motion } from 'framer-motion';
import { BookOpen, Camera, Sparkles, LineChart, Plus } from 'lucide-react';
import { useModal } from '../context/ModalContext';

const Dashboard = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { openEntryModal } = useModal();

  const fetchEntries = async () => {
    try {
      const data = await apiRequest('/entries');
      setEntries(data || []);
    } catch (err) {
      console.warn('Backend connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Filter entries based on selectedDate
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    return (
      entryDate.getDate() === selectedDate.getDate() &&
      entryDate.getMonth() === selectedDate.getMonth() &&
      entryDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  return (
    <div className="flex-1 p-10 min-h-screen relative z-10">
      <Header />
      
      <main className="max-w-5xl mx-auto">
        <TimelineHeader 
          selectedDate={selectedDate} 
          onDateSelect={setSelectedDate} 
        />

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="relative timeline-line">
            {filteredEntries.map((entry) => (
              <EntryCard 
                key={entry.id} 
                entry={entry} 
                onUpdate={fetchEntries}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            onNewEntry={openEntryModal} 
            isFiltered={entries.length > 0} 
            date={selectedDate}
          />
        )}
      </main>
    </div>
  );
};

const EmptyState = ({ onNewEntry, isFiltered, date }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass-card p-20 flex flex-col items-center text-center max-w-3xl mx-auto border-dashed border-2 border-white/5"
  >
    <div className="relative mb-12">
      <div className="w-32 h-32 rounded-3xl bg-primary/10 flex items-center justify-center rotate-3 relative z-10">
        <BookOpen size={48} className="text-primary" />
      </div>
    </div>

    <h2 className="text-4xl font-heading font-black text-white mb-4 tracking-tight">
      {isFiltered ? "No entries for this day" : "Your story starts now ✨"}
    </h2>
    <p className="text-gray-500 font-medium text-lg mb-12 max-w-md">
      {isFiltered 
        ? `You haven't captured any moments on ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`
        : "Capture your day, add photos, notes, and let AI help you find insights over time."}
    </p>

    <button onClick={onNewEntry} className="btn-primary w-full max-w-sm justify-center h-14 text-lg">
      <Plus size={24} />
      <span>{isFiltered ? "Add Entry for Today" : "Create Your First Entry"}</span>
    </button>
  </motion.div>
);


export default Dashboard;
