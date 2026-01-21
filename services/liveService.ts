
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const connectToLiveSafety = (callbacks: {
  onAudioChunk: (base64: string) => void;
  onInterrupted: () => void;
  onTranscription: (text: string, role: 'user' | 'model') => void;
  onClose: () => void;
}) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
      systemInstruction: 'أنت الآن في مكالمة صوتية مباشرة بصفتك "سلامتك" من وحدة HSE. كن سريع الاستجابة ومختصراً.',
    },
    callbacks: {
      onopen: () => console.log('Live session opened'),
      onmessage: async (message: LiveServerMessage) => {
        if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
          callbacks.onAudioChunk(message.serverContent.modelTurn.parts[0].inlineData.data);
        }
        if (message.serverContent?.interrupted) callbacks.onInterrupted();
        if (message.serverContent?.inputAudioTranscription) {
          callbacks.onTranscription(message.serverContent.inputAudioTranscription.text, 'user');
        }
        if (message.serverContent?.outputTranscription) {
          callbacks.onTranscription(message.serverContent.outputTranscription.text, 'model');
        }
      },
      onclose: () => callbacks.onClose(),
      onerror: (e) => console.error('Live error', e),
    },
  });
};
