import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Sparkles, Send, Camera, Mic, Smile, Frown, Meh, Sun, CloudRain, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest, fileUpload } from '../utils/api';
import { useModal } from '../context/ModalContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const moods = [
  { icon: <Frown />, label: 'Sad', color: 'text-blue-400', bg: 'bg-blue-400/10', score: 2 },
  { icon: <CloudRain />, label: 'Gloomy', color: 'text-indigo-400', bg: 'bg-indigo-400/10', score: 4 },
  { icon: <Meh />, label: 'Okay', color: 'text-gray-400', bg: 'bg-gray-400/10', score: 5 },
  { icon: <Smile />, label: 'Good', color: 'text-yellow-400', bg: 'bg-yellow-400/10', score: 8 },
  { icon: <Sun />, label: 'Amazing', color: 'text-orange-400', bg: 'bg-orange-400/10', score: 10 },
];

const EntryModal = ({ isOpen, onClose, onEntryCreated, editingEntry = null, collectionId = null, sharedHash = null }) => {
  const { openCamera } = useModal();
  const [title, setTitle] = useState(editingEntry?.title || '');
  const [content, setContent] = useState(editingEntry?.content || '');
  const [aiEnabled, setAiEnabled] = useState(editingEntry ? false : true); // Disable AI for manual edits by default
  const [isPublic, setIsPublic] = useState(editingEntry?.isPublic || false);
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState(
    editingEntry ? moods.find(m => m.score === Number(editingEntry.mood)) || moods[2] : moods[2]
  );
  const [previews, setPreviews] = useState(editingEntry?.media?.map(m => ({ url: m.url })) || []);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  
  const fileInputRef = useRef(null);

  // Re-sync if editingEntry changes
  useEffect(() => {
    if (editingEntry) {
        setTitle(editingEntry.title || '');
        setContent(editingEntry.content || '');
        setIsPublic(editingEntry.isPublic || false);
        setSelectedMood(moods.find(m => m.score === Number(editingEntry.mood)) || moods[2]);
        setPreviews(editingEntry.media?.map(m => ({ url: m.url })) || []);
        
        const fetchComments = async () => {
          try {
            const data = await apiRequest(`/entries/${editingEntry.id}/comments`);
            setComments(data);
          } catch (err) {
            console.error(err);
          }
        };
        fetchComments();
    } else {
        setComments([]);
    }
  }, [editingEntry]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !editingEntry) return;

    try {
      const newComment = await apiRequest(`/entries/${editingEntry.id}/comments`, 'POST', { content: commentInput });
      setComments(prev => [...prev, newComment]);
      setCommentInput('');
      if (onEntryCreated) onEntryCreated(editingEntry); // Refresh parent view if needed
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, { url: reader.result, file }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = (capturedMedia) => {
    setPreviews(prev => [...prev, { url: capturedMedia.preview, file: capturedMedia.file }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const uploadedMedia = [];
      
      // Upload only new previews
      for (const item of previews) {
        if (item.file) {
          let result;
          if (sharedHash) {
            // Use shared upload endpoint for collaborative mode
            result = await fileUpload(`/shared/entry/${sharedHash}/upload`, item.file);
          } else {
            result = await fileUpload('/upload', item.file);
          }
          uploadedMedia.push(result);
        }
      }

      const payload = {
        title: title || 'Untitled Moment',
        content,
        aiEnabled: sharedHash ? false : aiEnabled, // Disable AI for shared edits
        isPublic,
        mood: selectedMood.score,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined
      };

      let result;
      if (sharedHash) {
        // Collaborative mode — save via shared endpoint
        const res = await fetch(`${API_URL}/shared/entry/${sharedHash}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to save shared entry');
        result = await res.json();
      } else if (editingEntry) {
        result = await apiRequest(`/entries/${editingEntry.id}`, 'PUT', payload);
      } else {
        result = await apiRequest('/entries', 'POST', payload);
        
        // Link to collection if provided
        if (collectionId) {
          await apiRequest(`/collections/${collectionId}/entries/${result.id}`, 'POST');
        }
      }

      if (onEntryCreated) onEntryCreated(result);
      if (!sharedHash) {
        window.dispatchEvent(new CustomEvent('entryCreated'));
      }
      onClose();
      // Reset
      if (!editingEntry && !sharedHash) {
        setTitle('');
        setContent('');
        setPreviews([]);
        setSelectedMood(moods[2]);
      }
    } catch (err) {
      console.error(err);
      if (err.status === 429) {
        alert("🚀 AI Limit Reached!\n\n" + (err.message || "You've hit your daily limit. Upgrade to Premium for unlimited AI insights and longer conversations!"));
      } else {
        alert('Failed to save entry: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeMedia = (index) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-[#12121A] border border-white/5 rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Top Pattern Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-20" />
            
            <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar flex-1 relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-black text-white tracking-tight">{sharedHash ? 'Collaborative Edit' : 'New Reflection'}</h2>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${sharedHash ? 'bg-green-400' : 'bg-secondary'} animate-pulse`} />
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{sharedHash ? 'Shared Entry' : 'Crafting Memories'}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Mood Picker */}
                <div className="flex flex-wrap items-center gap-3">
                  {moods.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setSelectedMood(m)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 border ${
                        selectedMood.label === m.label 
                          ? `${m.bg} ${m.color} border-${m.color.split('-')[1]}-500/30 scale-105 shadow-lg shadow-${m.color.split('-')[1]}-500/10` 
                          : 'bg-white/[0.02] text-gray-500 border-transparent hover:bg-white/5'
                      }`}
                    >
                      {m.icon}
                      <span className="text-xs font-black uppercase tracking-wider">{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Moment Title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent border-none text-3xl font-heading font-black text-white placeholder:text-white/10 focus:ring-0 p-0"
                  />

                  <textarea
                    placeholder="Tell your diary anything... secrets, dreams, or just a quick recap."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-transparent border-none text-xl text-gray-400 placeholder:text-gray-800 focus:ring-0 p-0 min-h-[180px] resize-none leading-relaxed"
                    autoFocus
                  />
                </div>

                {/* Media Grid */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previews.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-3xl overflow-hidden group border border-white/5 shadow-xl"
                      >
                        <img src={item.url} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => removeMedia(idx)}
                            className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/40 hover:scale-110 transition-transform"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => openCamera(handleCapture)}
                      className="group relative w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-primary/20 rounded-2xl text-gray-400 hover:text-primary transition-all border border-transparent hover:border-primary/30"
                    >
                      <Camera size={22} />
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Snap Photo</span>
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-secondary/20 rounded-2xl text-gray-400 hover:text-secondary transition-all border border-transparent hover:border-secondary/30"
                    >
                      <ImageIcon size={22} />
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Upload</span>
                    </button>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      className="hidden" 
                      multiple
                      accept="image/*"
                    />

                    <button 
                      type="button" 
                      onClick={() => {
                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                        if (!SpeechRecognition) {
                          alert("Speech recognition not supported in this browser.");
                          return;
                        }
                        const recognition = new SpeechRecognition();
                        recognition.lang = 'en-US';
                        recognition.continuous = true; 
                        recognition.interimResults = true;

                        recognition.onstart = () => {
                          setLoading(true);
                        };
                        recognition.onresult = (event) => {
                          const current = event.resultIndex;
                          const transcript = event.results[current][0].transcript;
                          
                          // Only append if it's a final result to prevent duplicates
                          if (event.results[current].isFinal) {
                             setContent(prev => {
                               // Check if the transcript is already at the end to prevent double-appends from glitchy STT
                               if (prev.endsWith(transcript.trim())) return prev;
                               return prev.trim() + (prev ? " " : "") + transcript.trim();
                             });
                          }
                        };
                        recognition.onend = () => setLoading(false);
                        recognition.onerror = (e) => {
                          console.error("STT Error:", e);
                          setLoading(false);
                        };
                        recognition.start();
                      }}
                      className={`group relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${
                        loading ? 'bg-blue-500/20 text-blue-500 animate-pulse border-blue-500/30' : 'bg-white/5 text-gray-400 hover:text-blue-400 border-transparent hover:border-blue-500/30'
                      }`}
                    >
                      <Mic size={22} />
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {loading ? 'Listening...' : 'Audio Log'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Public</span>
                        <span className="text-[8px] text-secondary/50 font-bold">Sharable Link</span>
                      </div>
                      <div 
                        onClick={() => setIsPublic(!isPublic)}
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${isPublic ? 'bg-secondary shadow-lg shadow-secondary/20' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: isPublic ? 20 : 2 }}
                          className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AI Engine</span>
                        <span className="text-[8px] text-primary/50 font-bold">Deep Analysis</span>
                      </div>
                      <div 
                        onClick={() => setAiEnabled(!aiEnabled)}
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${aiEnabled ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: aiEnabled ? 20 : 2 }}
                          className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading || !content.trim()}
                      className="relative group overflow-hidden bg-primary px-8 py-3.5 rounded-2xl text-black font-heading font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="relative z-10">Save Reflection</span>
                          <Send size={18} className="relative z-10" />
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Thoughts Section (Comments) */}
                {editingEntry && (
                    <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-heading font-black text-white">Thoughts & Reflections</h3>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{comments.length} Thoughts</span>
                        </div>
                        
                        <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {comments.map((c, i) => (
                                <motion.div 
                                    key={c.id || i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                                >
                                    <p className="text-sm text-gray-300 leading-relaxed">{c.content}</p>
                                    <div className="mt-2 text-[8px] text-gray-600 font-bold uppercase tracking-widest">
                                        {format(new Date(c.createdAt), 'MMM dd, yyyy • h:mm a')}
                                    </div>
                                </motion.div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-xs text-gray-600 italic">No thoughts shared yet. Add your first reflection below.</p>
                            )}
                        </div>

                        <div className="relative flex items-center gap-3">
                            <input 
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(e)}
                                placeholder="Add a thought..."
                                className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-3 px-5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-secondary/50 transition-all"
                            />
                            <button 
                                onClick={handleAddComment}
                                disabled={!commentInput.trim()}
                                className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EntryModal;
