import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import CustomDatePicker from './CustomDatePicker';

const TimelineHeader = ({ onDateSelect, selectedDate = new Date() }) => {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dates, setDates] = useState([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      days.push({
        date: d,
        day: format(d, 'MMM d'),
        weekday: format(d, 'EEE'),
        active: isSameDay(d, selectedDate)
      });
    }
    setDates(days);
  }, [weekStart, selectedDate]);

  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const prevWeek = () => setWeekStart(addDays(weekStart, -7));

  return (
    <div className="flex items-center gap-4 mb-10 pb-2">
      <div className="flex gap-2 relative">
        <button 
          onClick={prevWeek}
          className="w-10 h-14 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <button 
          ref={calendarRef}
          onClick={(e) => { e.stopPropagation(); setIsDatePickerOpen(true); }}
          className="w-12 h-14 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 cursor-pointer hover:text-white hover:border-white/10 transition-all relative"
        >
          <CalendarIcon size={20} />
        </button>
        <CustomDatePicker 
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          selectedDate={selectedDate}
          anchorRef={calendarRef}
          onSelect={(d) => {
            onDateSelect?.(d);
            setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
          }}
        />
      </div>

      <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {dates.map((date) => (
          <motion.div
            key={date.day}
            whileHover={{ y: -2 }}
            onClick={() => onDateSelect?.(date.date)}
            className={`flex flex-col items-center justify-center min-w-[100px] h-14 rounded-xl cursor-pointer transition-all border ${
              date.active 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-white/[0.03] border-white/5 text-gray-500 hover:text-white hover:border-white/10'
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${date.active ? 'text-white/60' : 'opacity-60'}`}>
              {date.weekday}
            </span>
            <span className="text-sm font-bold tracking-tight">
              {date.day}
            </span>
          </motion.div>
        ))}
      </div>

      <button 
        onClick={nextWeek}
        className="w-10 h-14 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default TimelineHeader;

