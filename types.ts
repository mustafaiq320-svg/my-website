
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  imagePrompt?: string; 
  audio?: string; 
  timestamp: Date;
  loadingImage?: boolean;
  loadingAudio?: boolean;
  isSpeaking?: boolean;
  isPaused?: boolean;
  playbackOffset?: number; 
  currentTime?: number;
  duration?: number;
  suggestions?: string[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export interface HSETopic {
  id: string;
  title: string;
  icon: string;
  description: string;
}
