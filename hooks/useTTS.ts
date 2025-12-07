import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { decode, decodeAudioData } from '../utils';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    // Initialize AI client if API key is present
    if (process.env.API_KEY) {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
        console.warn("API_KEY not found in process.env. TTS will be disabled.");
    }
  }, []);

  // Initialize or resume AudioContext (must be called after user interaction)
  const resumeContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000, // Matching the model's output rate
      });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!aiRef.current || !text) return;

    // Ensure previous audio is stopped
    stop();
    
    // Ensure context is running
    await resumeContext();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    setIsSpeaking(true);

    try {
      const response = await aiRef.current.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          // Use string 'AUDIO' explicitly to avoid potential Enum import issues with CDN
          responseModalities: ['AUDIO' as any], 
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!base64Audio) {
        // Check if it fell back to text (possible if modality was ignored or blocked)
        const textPart = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textPart) {
           console.warn("Gemini returned text instead of audio:", textPart);
        } else {
           console.error("No content returned from Gemini. FinishReason:", response.candidates?.[0]?.finishReason);
        }
        setIsSpeaking(false);
        return;
      }

      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      
      sourceRef.current = source;
      source.start();
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  }, [resumeContext, stop]);

  return { speak, stop, isSpeaking, resumeContext };
};