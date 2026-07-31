export interface Textbook {
  id: string;
  subject: string;
  grade: number;
  unitTitle: string;
  ownerId: string;
  createdAt: string;
}

export interface TextChunk {
  id: string;
  textbookId: string;
  content: string;
  chunkOrder: number;
  similarity?: number;
}

export interface Persona {
  id: string;
  textbookId: string;
  characterName: string;
  systemPrompt: string;
}
