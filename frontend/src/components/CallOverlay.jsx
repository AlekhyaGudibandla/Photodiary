import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Camera, PhoneOff, Settings, X, Maximize2, Minimize2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useCall } from '../context/CallContext';
import { useModal } from '../context/ModalContext';
import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CallOverlay = () => {
    const { 
        isCallMode, endCall, isSpeaking, isListening, 
        interimTranscript, input, speakText, availableVoices, 
        selectedVoice, saveVoice, loading,
        isMuted, setIsMuted
    } = useCall();
    
    const { openCamera } = useModal();
    const location = useLocation();
    const navigate = useNavigate();
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const constraintsRef = useRef(null);

    const isAIPage = location.pathname === '/ai';

    const handleCapture = async (media) => {
        console.log("Captured image:", media);
    };

    if (!isCallMode || isAIPage) return null;

    return (
        <AnimatePresence>
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[200]">
                <motion.div
                    drag
                    dragConstraints={constraintsRef}
                    initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1,
                        width: isMinimized ? '280px' : '360px',
                        height: isMinimized ? '80px' : 'auto'
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed bottom-10 right-10 pointer-events-auto bg-[#12121A]/95 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
                >
                    {/* Header / Grab Handle */}
                    <div className="p-4 flex items-center justify-between bg-white/[0.02] border-b border-white/5 cursor-move">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-primary animate-ping' : isListening ? 'bg-secondary animate-pulse' : 'bg-gray-700'}`} />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {isSpeaking ? 'AI Speaking' : isListening ? 'Listening' : 'AI Companion'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                            >
                                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                            </button>
                            {!isAIPage && (
                                <button 
                                    onClick={() => navigate('/ai')}
                                    className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {!isMinimized && (
                        <div className="p-6 space-y-6">
                            {/* AI Visualization */}
                            <div className="flex flex-col items-center justify-center py-4">
                                <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center relative bg-black/40 ${
                                    isSpeaking ? 'border-primary shadow-[0_0_40px_rgba(168,85,247,0.2)]' : 
                                    isListening ? 'border-secondary shadow-[0_0_40px_rgba(244,63,94,0.2)]' : 
                                    'border-white/5'
                                }`}>
                                    {isSpeaking ? (
                                        <div className="flex gap-1 items-end h-8">
                                            {[1,2,3,4].map(i => (
                                                <motion.div 
                                                    key={i}
                                                    animate={{ height: [8, 24, 12, 20, 8] }}
                                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                                                    className="w-1.5 bg-primary rounded-full"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <Brain size={48} className={isListening ? 'text-secondary animate-pulse' : 'text-gray-700'} />
                                    )}
                                </div>
                            </div>

                            {/* Transcript Area */}
                            {(interimTranscript || input) && (
                                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 max-h-[120px] overflow-y-auto custom-scrollbar">
                                    <p className="text-sm text-white/80 font-medium italic leading-relaxed text-center">
                                        "{interimTranscript || input}"
                                    </p>
                                </div>
                            )}

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-4 pt-2">
                                <button 
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-400'}`}
                                >
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                                
                                <button 
                                    onClick={endCall}
                                    className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <PhoneOff size={28} />
                                </button>

                                <button 
                                    onClick={() => setShowVoiceSettings(true)}
                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all"
                                >
                                    <Settings size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {isMinimized && (
                        <div className="px-6 h-[80px] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-black/40 border ${isSpeaking ? 'border-primary' : 'border-white/5'}`}>
                                    <Brain size={18} className={isSpeaking ? 'text-primary' : 'text-gray-500'} />
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Live Call</div>
                                    <div className="text-xs font-bold text-white">AI is listening...</div>
                                </div>
                            </div>
                            <button 
                                onClick={endCall}
                                className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg"
                            >
                                <PhoneOff size={16} />
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Voice Settings Modal */}
            <AnimatePresence>
                {showVoiceSettings && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVoiceSettings(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md bg-[#12121A] border border-white/5 rounded-[40px] p-10 relative z-10 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-heading font-black text-white">Voice Customization</h3>
                                <button onClick={() => setShowVoiceSettings(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><X size={24} /></button>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">AI Personality Voice</p>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {availableVoices.map((voice, idx) => (
                                            <button key={idx} onClick={() => { saveVoice(voice); speakText("How do I sound now?"); }} className={`w-full text-left p-5 rounded-2xl transition-all border ${selectedVoice?.name === voice.name ? 'bg-primary/20 border-primary/50 text-white' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}>
                                                <div className="font-bold text-sm">{voice.name}</div>
                                                <div className="text-[10px] opacity-50 uppercase tracking-widest">{voice.lang}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowVoiceSettings(false)} className="w-full mt-10 btn-primary justify-center h-16 text-lg">Save Changes</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
};

export default CallOverlay;
