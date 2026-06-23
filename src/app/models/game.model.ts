export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  score: number;
  isDrawing: boolean;
  hasGuessedCorrectly: boolean;
  lastGuessTime?: number;
  drawingData?: DrawStroke[]; // Used in Mode B to store completed drawings for reveal
}

export type GameMode = 'A' | 'B';

export type GamePhase = 'LOBBY' | 'WORD_SELECTION' | 'PLAYING' | 'REVEAL' | 'GAME_OVER';

export interface GameSettings {
  mode: GameMode;
  drawTimeLimit: number; // in seconds
  revealTimeLimit: number; // in seconds
  botCount: number;
  wordCategory: string;
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
}
