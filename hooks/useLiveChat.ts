import { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed the import for 'LiveSession' as it is not an exported member of the '@google/genai' package.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';

// Hook to manage the Gemini Live API chat session
export function useLiveChat(character: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<{ user: string, model: string }[]>([]);
  
  // FIX: Replaced the 'LiveSession' type with 'any' because 'LiveSession' is not exported from the '@google/genai' package.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const stopAudioPlayback = useCallback(function() {
    if (outputAudioContextRef.current) {
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }
  }, []);
  
  const startChat = useCallback(async function() {
    if (isConnected) return;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      setIsProcessing(true);
      setTranscript([]);
      currentInputTranscriptionRef.current = '';
      currentOutputTranscriptionRef.current = '';

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            systemInstruction: `You are ${character}, a seasoned street racer from the CSR Racing 2 universe. You live and breathe car culture. Your personality is a mix of cool confidence and gritty determination. You're talking to a fellow racer. Keep your answers brief, to the point, and in character. Use some street racing slang if it feels natural.`,
        },
        callbacks: {
          onopen: async () => {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (event) => {
                const inputData = event.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const pcmBlob: Blob = {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
            scriptProcessorRef.current = scriptProcessor;

            setIsConnected(true);
            setIsProcessing(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
                currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.inputTranscription) {
                currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }

            if(message.serverContent?.turnComplete){
                const fullInput = currentInputTranscriptionRef.current.trim();
                const fullOutput = currentOutputTranscriptionRef.current.trim();
                if (fullInput || fullOutput) {
                    setTranscript(prev => [...prev, {user: fullInput, model: fullOutput}]);
                }
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
                setIsSpeaking(true);
                const ctx = outputAudioContextRef.current;
                const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                source.addEventListener('ended', () => {
                    audioSourcesRef.current.delete(source);
                    if (audioSourcesRef.current.size === 0) {
                        setIsSpeaking(false);
                    }
                });

                const currentTime = ctx.currentTime;
                const startTime = Math.max(currentTime, nextStartTimeRef.current);
                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
                audioSourcesRef.current.add(source);
            }
             if (message.serverContent?.interrupted) {
                stopAudioPlayback();
            }
          },
          onclose: () => {
            setIsConnected(false);
            setIsProcessing(false);
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            setIsConnected(false);
            setIsProcessing(false);
          },
        },
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (error) {
      console.error('Failed to start chat:', error);
      setIsProcessing(false);
    }
  }, [character, isConnected, stopAudioPlayback]);

  const stopChat = useCallback(async function() {
    if (!isConnected && !sessionPromiseRef.current) return;

    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    
    stopAudioPlayback();

    if(outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setIsConnected(false);
    setIsSpeaking(false);
  }, [isConnected, stopAudioPlayback]);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
        stopChat();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { startChat, stopChat, isConnected, isSpeaking, isProcessing, transcript };
}