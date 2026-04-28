import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Mic, Brain, User, Settings, Volume2, VolumeX, PhoneOff, RefreshCw
} from 'lucide-react';
import { useCall } from '../context/CallContext';
import Header from '../components/Header';
import { useModal } from '../context/ModalContext';

const AICopilot = () => {
  const {
    messages, loading, isSpeaking, isListening,
    input, setInput, interimTranscript,
    startCall, endCall, resetChat, isCallMode, handleSend, toggleListening,
    availableVoices, selectedVoice, saveVoice, speakText,
    isMuted, setIsMuted
  } = useCall();

  const messagesEndRef = useRef(null);
  const { openCamera } = useModal();
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden p-10 relative bg-mesh">
      <Header />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full glass-card overflow-hidden">
        {/* Header Area */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/20">
              <Brain size={28} />
            </div>
            <div>
              <h2 className="text-xl font-heading font-black text-white">AI Companion</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-primary animate-ping' : 'bg-secondary animate-pulse'}`} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {isSpeaking ? 'AI Speaking' : 'Ready to listen'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
              <button 
                onClick={resetChat}
                className="w-12 h-12 rounded-2xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                title="New Chat"
              >
                <RefreshCw size={20} />
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-white/5 text-gray-500' : 'bg-primary/10 text-primary border border-primary/20'}`}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              {!isCallMode && (
                  <button 
                    onClick={startCall} 
                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary text-black hover:scale-105 active:scale-95 transition-all font-heading font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-black"></span>
                        </span>
                        <span>Start Call</span>
                    </div>
                  </button>
              )}
          </div>
        </div>

        {/* Main Area */}
        {isCallMode ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-12 relative overflow-hidden bg-black/20">
                {/* AI Visualization */}
                <div className={`w-64 h-64 rounded-full border-4 flex items-center justify-center relative bg-black/40 ${
                    isSpeaking ? 'border-primary shadow-[0_0_80px_rgba(168,85,247,0.3)]' : 
                    isListening ? 'border-secondary shadow-[0_0_80px_rgba(244,63,94,0.3)]' : 
                    'border-white/5'
                }`}>
                    {isSpeaking ? (
                        <div className="flex gap-2 items-end h-16">
                            {[1,2,3,4].map(i => (
                                <motion.div 
                                    key={i}
                                    animate={{ height: [16, 48, 24, 40, 16] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                                    className="w-3 bg-primary rounded-full"
                                />
                            ))}
                        </div>
                    ) : (
                        <Brain size={80} className={isListening ? 'text-secondary animate-pulse' : 'text-gray-700'} />
                    )}
                </div>

                <div className="text-center space-y-4 max-w-lg z-10 h-24">
                    <h3 className="text-2xl font-bold text-white">
                        {isSpeaking ? 'AI is speaking...' : isListening ? 'Listening to you...' : 'AI Companion'}
                    </h3>
                    {(interimTranscript || input) && (
                        <p className="text-lg text-white/80 italic font-medium leading-relaxed">
                            "{interimTranscript || input}"
                        </p>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 z-10">
                    <button 
                        onClick={endCall}
                        className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-2xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <PhoneOff size={32} />
                    </button>
                </div>
                
                {/* Decor */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
            </div>
        ) : (
            <>
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          <AnimatePresence>
            {messages.filter(m => m.content?.trim() || m.preview).map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Brain size={20} />}
                </div>
                <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                  {msg.preview && (
                    <img src={msg.preview} alt="Captured" className="rounded-2xl border border-white/10 max-w-xs shadow-2xl" />
                  )}
                  {msg.content && !msg.content.startsWith('[Image Captured') && (
                    <div className={`p-5 rounded-2xl text-sm font-medium leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-secondary/10 text-white border border-secondary/20 rounded-tr-none' 
                        : 'bg-white/5 text-gray-300 border border-white/5 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div 
                key="loading-bubble"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Brain size={20} /></div>
                <div className="flex gap-1.5 items-center p-5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white/[0.01] border-t border-white/5">
          <div className="relative flex items-end gap-3">
            <textarea
              ref={textareaRef}
              rows="1"
              placeholder="Start typing or click the mic..."
              value={interimTranscript || input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
              }}
              className="flex-1 bg-white/5 border border-white/5 rounded-3xl py-4 px-8 text-white placeholder:text-gray-700 focus:outline-none focus:border-primary/50 transition-all text-lg resize-none min-h-[64px] max-h-[200px]"
            />
            <button onClick={toggleListening} className={`w-16 h-16 rounded-3xl flex-shrink-0 flex items-center justify-center transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                <Mic size={24} />
            </button>
            <button onClick={() => handleSend()} disabled={loading} className="w-16 h-16 rounded-3xl flex-shrink-0 bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                <Send size={24} />
            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default AICopilot;
