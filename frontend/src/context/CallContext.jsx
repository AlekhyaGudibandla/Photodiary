import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const [isCallMode, setIsCallMode] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your Photodiary AI. I'm here to listen and help you reflect on your day. How are you feeling?" }
    ]);
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [availableVoices, setAvailableVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [input, setInput] = useState('');

    const [isMuted, setIsMuted] = useState(true); // Default to muted as requested

    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const stateRef = useRef({ isCallMode: false, messages: [], hasLogged: false });

    useEffect(() => {
        stateRef.current = { ...stateRef.current, isCallMode, messages };
    }, [isCallMode, messages]);

    // Initialize Voices
    useEffect(() => {
        const loadVoices = () => {
            let voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Sort voices to put "Google" and "Natural" at the top
                const sortedVoices = [...voices].sort((a, b) => {
                    const aLower = a.name.toLowerCase();
                    const bLower = b.name.toLowerCase();
                    const aScore = (aLower.includes('google') ? 2 : 0) + (aLower.includes('natural') ? 2 : 0);
                    const bScore = (bLower.includes('google') ? 2 : 0) + (bLower.includes('natural') ? 2 : 0);
                    return bScore - aScore;
                });

                setAvailableVoices(sortedVoices);
                const savedVoiceName = localStorage.getItem('preferredVoice');
                let voice = sortedVoices.find(v => v.name === savedVoiceName);
                
                if (!voice) {
                    // Default to a high-quality natural voice
                    voice = sortedVoices.find(v => 
                        v.name.includes('Google US English') || 
                        v.name.includes('Natural') || 
                        v.name.includes('Microsoft Aria') || // Edge's best voice
                        v.name.includes('Google')
                    ) || sortedVoices[0];
                }
                setSelectedVoice(voice);
            }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const saveVoice = (voice) => {
        setSelectedVoice(voice);
        localStorage.setItem('preferredVoice', voice.name);
    };

    const voiceRef = useRef(null);

    useEffect(() => {
        voiceRef.current = selectedVoice;
    }, [selectedVoice]);

    const speakText = useCallback((text) => {
        if (isMuted && !stateRef.current.isCallMode) return; // Respect mute setting, but ignore in call mode
        window.speechSynthesis.cancel();
        
        // Remove markdown, brackets, parentheses, asterisks, and emojis
        const cleanText = text
            .replace(/\*\*.*?\*\*/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/\(.*?\)/g, '')
            .replace(/\*.*?\*/g, '')
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, '')
            .trim();
            
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Re-find voice to ensure it's the correct reference from current system voices
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === voiceRef.current?.name) || voiceRef.current;
        
        if (voice) utterance.voice = voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, [isMuted]); // Dependency on isMuted

    // Stop speaking immediately if muted
    useEffect(() => {
        if (isMuted && !stateRef.current.isCallMode) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isMuted]);

    const isFinalizingRef = useRef(false);

    const handleSend = useCallback(async (forcedInput, isFinalizing = false) => {
        const textToSend = isFinalizing 
            ? "finalize: Summarize our entire conversation and save a beautiful diary entry now."
            : (forcedInput || input).trim();
            
        if (!textToSend || (loading && !isFinalizing)) return;
        
        // Prevent multiple finalization calls
        if (isFinalizing) {
            if (isFinalizingRef.current) return;
            isFinalizingRef.current = true;
        }

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }

        if (!isFinalizing) {
            setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
            setInput('');
        }
        
        setInterimTranscript('');
        setLoading(true);

        try {
            const data = await apiRequest('/chat', 'POST', {
                message: textToSend,
                history: stateRef.current.messages.slice(-15).map(m => ({ role: m.role, content: m.content }))
            });

            let responseText = data.response;

            // Handle Logging Protocol
            const logMatch = responseText.match(/\[LOG_ENTRY: (.*?)\]/);
            if (logMatch && !stateRef.current.hasLogged) { // Check if already logged this session
                try {
                    const entryData = JSON.parse(logMatch[1]);
                    await apiRequest('/entries', 'POST', entryData);
                    stateRef.current.hasLogged = true; // Mark as logged
                    responseText = responseText.replace(/\[LOG_ENTRY: .*?\]/, "\n\n✨ **Reflection Automatically Logged!**");
                    window.dispatchEvent(new CustomEvent('entryCreated'));
                } catch (e) { console.error("Logging failed:", e); }
            } else if (logMatch) {
                // If already logged, just strip the tag
                responseText = responseText.replace(/\[LOG_ENTRY: .*?\]/, "");
            }

            if (!isFinalizing) {
                setMessages(prev => [...prev, { role: 'assistant', content: responseText.trim() }]);
                setLoading(false);
                speakText(responseText);
            } else {
                // If finalizing, we just end the call without speaking the long summary
                setIsCallMode(false);
                setMessages(prev => [...prev, { role: 'assistant', content: responseText.trim() }]);
                setLoading(false);
                isFinalizingRef.current = false;
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            if (!isFinalizing) {
                setMessages(prev => [...prev, { role: 'assistant', content: "I'm having a little trouble connecting. Could you say that again?" }]);
            } else {
                setIsCallMode(false);
                isFinalizingRef.current = false;
            }
        }
    }, [input, loading, speakText, isMuted]);

    // STT Initialization
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            }

            let finalTranscript = '';
            let currentInterim = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    currentInterim += transcript;
                }
            }

            if (finalTranscript) {
                if (stateRef.current.isCallMode) {
                    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = setTimeout(() => {
                        handleSend(finalTranscript);
                    }, 1500);
                } else {
                    setInput(prev => prev + ' ' + finalTranscript);
                }
            }
            setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event) => {
            console.error('STT Error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            if (stateRef.current.isCallMode) {
                try { recognition.start(); } catch (e) {}
            }
        };

        recognitionRef.current = recognition;
    }, [handleSend]);

    const resetChat = () => {
        setMessages([
            { role: 'assistant', content: "Hello! I'm your Photodiary AI. I'm here to listen and help you reflect on your day. How are you feeling?" }
        ]);
        stateRef.current.hasLogged = false;
        setLoading(false);
        setIsCallMode(false);
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    };

    const startCall = () => {
        stateRef.current.hasLogged = false; // Reset log flag for new call
        setIsCallMode(true);
        setIsMuted(false); // Force unmute for call
        const greeting = "Hey there! I'm so glad we're talking. How has your day been treating you? Tell me everything.";
        setMessages(prev => {
            // If it's just the initial message, replace it
            if (prev.length === 1 && prev[0].role === 'assistant' && prev[0].content.includes("How are you feeling?")) {
                return [{ role: 'assistant', content: greeting }];
            }
            return [...prev, { role: 'assistant', content: greeting }];
        });
        speakText(greeting);
        setTimeout(() => {
            try { recognitionRef.current?.start(); } catch (e) {}
        }, 500);
    };

    const endCall = async () => {
        // Trigger auto-save
        handleSend(null, true);
        
        recognitionRef.current?.stop();
        // Don't cancel TTS immediately, let it finish the summary
        setIsListening(false);
        setInterimTranscript('');
        // isCallMode will be set to false inside handleSend after a delay
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            try { recognitionRef.current?.start(); } catch (e) {}
        }
    };

    return (
        <CallContext.Provider value={{
            isCallMode, setIsCallMode,
            messages, setMessages,
            loading,
            isSpeaking,
            isListening,
            interimTranscript,
            availableVoices,
            selectedVoice,
            saveVoice,
            input, setInput,
            startCall, endCall, resetChat,
            handleSend, speakText,
            toggleListening,
            isMuted, setIsMuted
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
