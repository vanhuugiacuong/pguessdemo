export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  score: number;
  isDrawing: boolean;
  hasGuessedCorrectly: boolean;
  lastGuessTime?: number;
  drawingData?: DrawStroke[]; // Used in Mode B to store completed drawings for reveal
  avatar?: string;
  drawingWord?: string;
}

export type GameMode = 'A' | 'B';

export type GamePhase = 'LOBBY' | 'WORD_SELECTION' | 'PLAYING' | 'REVEAL' | 'GAME_OVER';

export interface GameSettings {
  mode: GameMode;
  drawTimeLimit: number; // in seconds
  revealTimeLimit: number; // in seconds
  botCount: number;
  wordCategory: string;
  customWordBank?: string[];
  maxPlayers?: number;
}

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawStroke {
  points: DrawPoint[];
  color: string;
  width: number;
  isEraser?: boolean;
  shapeType?: 'brush' | 'eraser' | 'rectangle' | 'circle' | 'line';
  opacity?: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
  isSystem: boolean;
  isCorrectGuess: boolean;
}

export interface RoomState {
  id: string;
  players: Player[];
  phase: GamePhase;
  currentWord: string;
  obfuscatedWord: string; // e.g. "_ _ _ _"
  drawerId?: string; // Mode A: active drawer
  guesserId?: string; // Mode B: active guesser
  timeLeft: number;
  roundNumber: number;
  maxRounds: number;
  settings?: GameSettings;
  hostId?: string;
  finalGuess?: string;
  finalGuessIsCorrect?: boolean;
  revealedIndexes?: number[];
  hintsRevealed?: number;
  modeBChains?: ModeBChain[];
}

export interface ModeBChainStep {
  type: 'word' | 'drawing' | 'guess';
  player: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: any; // string for word/guess, DrawStroke[] for drawing
  isCorrect?: boolean;
  index?: number;
}

export interface ModeBChain {
  ownerId: string;
  ownerName: string;
  word: string;
  steps: ModeBChainStep[];
}
