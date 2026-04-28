import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Trash2, Image as ImageIcon, Edit2, Dumbbell, Heart as HeartIcon, Share2, Smile, Frown, Meh, Sun, CloudRain } from 'lucide-react';
import { format } from 'date-fns';
import { useModal } from '../context/ModalContext';
import { apiRequest } from '../utils/api';

const moodIcons = {
  2: { icon: <Frown size={14} />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  4: { icon: <CloudRain size={14} />, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  5: { icon: <Meh size={14} />, color: 'text-gray-400', bg: 'bg-gray-400/10' },
  8: { icon: <Smile size={14} />, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  10: { icon: <Sun size={14} />, color: 'text-orange-400', bg: 'bg-orange-400/10' },
};

const EntryCard = ({ entry, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [liked, setLiked] = useState(entry.likedByMe);
  const [likesCount, setLikesCount] = useState(entry.likesCount || 0);
  const { openEntryModal } = useModal();

  const getIcon = () => {
    if (entry.media?.length > 0) return <ImageIcon size={18} />;
    return <Edit2 size={18} />;
  };

  const getIconColor = () => {
    if (entry.media?.length > 0) return 'bg-purple-500';
    return 'bg-blue-500';
  };

  const mood = moodIcons[entry.mood] || moodIcons[5];

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const data = await apiRequest(`/entries/${entry.id}/like`, 'POST');
      setLiked(data.liked);
      setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this memory?')) {
        try {
            await apiRequest(`/entries/${entry.id}`, 'DELETE');
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
        }
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (entry.shareHash) {
      const url = `${window.location.origin}/shared/${entry.shareHash}`;
      navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard!');
    }
  };

  const moodColorMap = {
    2: 'rgba(96, 165, 250, 0.05)', // blue
    4: 'rgba(129, 140, 248, 0.05)', // indigo
    5: 'rgba(156, 163, 175, 0.05)', // gray
    8: 'rgba(250, 204, 21, 0.05)', // yellow
    10: 'rgba(251, 146, 60, 0.05)', // orange
  };

  const moodGlow = moodColorMap[entry.mood] || moodColorMap[5];

  return (
    <div className="relative pl-14 mb-10 group">
      {/* Timeline Icon */}
      <div className={`absolute left-0 top-2 w-10 h-10 rounded-full ${getIconColor()} flex items-center justify-center text-white z-10 shadow-lg`}>
        {getIcon()}
      </div>

      <motion.div
        whileHover={{ y: -4 }}
        style={{ backgroundColor: moodGlow }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass-card p-6 flex flex-col md:flex-row gap-8 items-start group-hover:border-primary/20 transition-all cursor-pointer"
      >
        {entry.media && entry.media.length > 0 && (
          <div className="w-full md:w-[240px] h-[180px] rounded-2xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/5">
            <img src={entry.media[0].url} alt={entry.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}

        <div className="flex-1 space-y-4 pt-1 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-heading font-black tracking-tight">{entry.title || 'Untitled Moment'}</h3>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${mood.bg} ${mood.color}`}>
                {mood.icon}
              </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {format(new Date(entry.createdAt), 'h:mm a')}
                </span>
                <span className="text-[8px] text-gray-600 font-bold uppercase">{format(new Date(entry.createdAt), 'MMM dd, yyyy')}</span>
            </div>
          </div>

          <p className={`text-gray-400 text-sm leading-relaxed font-medium transition-all ${isExpanded ? '' : 'line-clamp-3'}`}>
            {entry.content}
          </p>

          <div className="flex flex-wrap gap-2">
            {entry.tags?.map((tag) => (
              <span 
                key={tag.id || tag.name} 
                className="badge bg-white/[0.03] border border-white/5 text-gray-400 group-hover:border-primary/20 group-hover:text-primary transition-all"
              >
                {tag.name || tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-6">
                <button 
                    onClick={handleLike}
                    className={`flex items-center gap-2 transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                >
                    <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">{likesCount > 0 ? likesCount : 'Love'}</span>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); openEntryModal(entry); }}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
                >
                    <MessageCircle size={16} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">{entry.commentsCount > 0 ? entry.commentsCount : 'Thoughts'}</span>
                </button>
            </div>
            
            <div className="flex items-center gap-2">
                {entry.isPublic && (
                    <button 
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-all border border-secondary/10"
                    >
                        <Share2 size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                    </button>
                )}
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); openEntryModal(entry); }}
                        className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EntryCard;
