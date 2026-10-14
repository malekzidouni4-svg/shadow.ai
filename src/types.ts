export type ActiveTab = 'chat' | 'image' | 'vision' | 'voice' | 'prompts';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  image?: {
    data: string;
    mimeType: string;
    url?: string;
  };
  audioUrl?: string;
  thinkingLevel?: 'LOW' | 'HIGH';
  isStreaming?: boolean;
  groundingSources?: GroundingSource[];
  isWebGrounded?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  nameEn: string;
  title: string;
  titleEn: string;
  icon: string;
  description: string;
  descriptionEn: string;
  systemInstruction: string;
  systemInstructionEn: string;
  gradient: string;
  badge: string;
  badgeEn: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  titleEn: string;
  category: 'business' | 'coding' | 'writing' | 'learning' | 'productivity';
  description: string;
  descriptionEn: string;
  prompt: string;
  promptEn: string;
  icon: string;
}

export interface ImageGeneration {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  imageUrl: string;
  timestamp: number;
  enhancedPrompt?: string;
}
