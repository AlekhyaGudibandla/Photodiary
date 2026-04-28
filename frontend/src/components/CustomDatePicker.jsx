import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomDatePicker = ({ isOpen, onClose, onSelect, selectedDate = new Date(), anchorRef }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [view, setView] = useState('days'); // 'days', 'months', 'years'
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 10,
        left: Math.max(20, Math.min(window.innerWidth - 360, rect.left + window.scrollX))
      });
    }
  }, [isOpen, anchorRef]);

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setView(view === 'months' ? 'days' : 'months')}
            className={`text-lg font-black transition-colors ${view === 'months' ? 'text-primary' : 'text-white hover:text-primary'}`}
          >
            {format(currentMonth, 'MMMM')}
          </button>
          <button 
            onClick={() => setView(view === 'years' ? 'days' : 'years')}
            className={`text-lg font-black transition-colors ${view === 'years' ? 'text-primary' : 'text-white/50 hover:text-primary'}`}
          >
            {format(currentMonth, 'yyyy')}
          </button>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => {
              if (view === 'years') setCurrentMonth(new Date(currentMonth.getFullYear() - 24, currentMonth.getMonth(), 1));
              else setCurrentMonth(subMonths(currentMonth, 1));
            }} 
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => {
              if (view === 'years') setCurrentMonth(new Date(currentMonth.getFullYear() + 24, currentMonth.getMonth(), 1));
              else setCurrentMonth(addMonths(currentMonth, 1));
            }} 
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  const renderMonths = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return (
      <div className="grid grid-cols-3 gap-2 py-4">
        {months.map((month, idx) => (
          <button
            key={month}
            onClick={() => {
              setCurrentMonth(new Date(currentMonth.getFullYear(), idx, 1));
              setView('days');
            }}
            className={`p-3 rounded-xl text-sm font-bold transition-all ${idx === currentMonth.getMonth() ? 'bg-primary text-black' : 'hover:bg-white/5 text-gray-400'}`}
          >
            {month}
          </button>
        ))}
      </div>
    );
  };

  const renderYears = () => {
    const currentYear = currentMonth.getFullYear();
    const years = [];
    for (let i = currentYear - 12; i <= currentYear + 11; i++) {
      years.push(i);
    }
    return (
      <div className="grid grid-cols-4 gap-2 py-4">
        {years.map(year => (
          <button
            key={year}
            onClick={() => {
              setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
              setView('days');
            }}
            className={`p-3 rounded-xl text-sm font-bold transition-all ${year === currentYear ? 'bg-primary text-black' : 'hover:bg-white/5 text-gray-400'}`}
          >
            {year}
          </button>
        ))}
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`relative p-2 text-center cursor-pointer transition-all rounded-xl h-10 flex items-center justify-center font-bold text-sm
              ${!isCurrentMonth ? "text-gray-700 pointer-events-none opacity-20" : "text-white"}
              ${isSelected ? "bg-primary text-black shadow-lg shadow-primary/20" : "hover:bg-white/5"}
            `}
            onClick={() => {
              onSelect(cloneDay);
              onClose();
            }}
          >
            <span>{formattedDate}</span>
            {isSameDay(day, new Date()) && !isSelected && (
              <div className="absolute bottom-1 w-1 h-1 bg-secondary rounded-full" />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            style={{ 
              position: 'absolute',
              top: coords.top,
              left: coords.left,
            }}
            className="w-[340px] glass-card p-6 z-[999] border border-white/10 shadow-2xl"
          >
            {renderHeader()}
            {view === 'months' ? renderMonths() : 
             view === 'years' ? renderYears() : (
              <>
                {renderDays()}
                {renderCells()}
              </>
            )}
            
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => { onSelect(new Date()); onClose(); }}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white"
              >
                Today
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CustomDatePicker;
