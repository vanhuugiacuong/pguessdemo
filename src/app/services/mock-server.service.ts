import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, map } from 'rxjs';
import { Player, GameSettings, ChatMessage, RoomState, DrawStroke, GamePhase, DrawPoint } from '../models/game.model';

const BOT_NAMES = ['Captain Draw', 'SketchBot', 'PencilPush', 'DoodleMaster', 'BrushWiz', 'ColorFly', 'ArtfulDodger', 'PixelPainter'];

const AVATARS = ['2.svg', '30.svg', '33.svg', '34.svg', '39.svg', '52.svg', '58.svg'];

const WORD_BANK = [
  'house', 'cat', 'tree', 'sun', 'car', 'flower', 'fish', 'cup', 'star', 'apple',
  'boat', 'bird', 'cake', 'hat', 'cloud', 'heart', 'moon', 'ball', 'book', 'face'
];

// Pre-defined drawing coordinates to simulate bot drawing in real-time
const BOT_PRESETS: { [key: string]: DrawStroke[] } = {
  'house': [
    { color: '#3b82f6', width: 6, points: [{ x: 100, y: 250 }, { x: 300, y: 250 }, { x: 300, y: 400 }, { x: 100, y: 400 }, { x: 100, y: 250 }] }, // Body
    { color: '#ef4444', width: 6, points: [{ x: 80, y: 250 }, { x: 200, y: 150 }, { x: 320, y: 250 }] }, // Roof
    { color: '#b45309', width: 6, points: [{ x: 180, y: 400 }, { x: 180, y: 320 }, { x: 220, y: 320 }, { x: 220, y: 400 }] }, // Door
    { color: '#eab308', width: 6, points: [{ x: 130, y: 290 }, { x: 160, y: 290 }, { x: 160, y: 320 }, { x: 130, y: 320 }, { x: 130, y: 290 }] } // Window
  ],
  'sun': [
    // Circle
    {
      color: '#eab308', width: 8, points: Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 19) * Math.PI * 2;
        return { x: 200 + Math.cos(angle) * 60, y: 200 + Math.sin(angle) * 60 };
      })
    },
    // Rays
    { color: '#f97316', width: 6, points: [{ x: 200, y: 110 }, { x: 200, y: 80 }] },
    { color: '#f97316', width: 6, points: [{ x: 200, y: 290 }, { x: 200, y: 320 }] },
    { color: '#f97316', width: 6, points: [{ x: 110, y: 200 }, { x: 80, y: 200 }] },
    { color: '#f97316', width: 6, points: [{ x: 290, y: 200 }, { x: 320, y: 200 }] },
    { color: '#f97316', width: 6, points: [{ x: 136, y: 136 }, { x: 115, y: 115 }] },
    { color: '#f97316', width: 6, points: [{ x: 264, y: 264 }, { x: 285, y: 285 }] },
    { color: '#f97316', width: 6, points: [{ x: 136, y: 264 }, { x: 115, y: 285 }] },
    { color: '#f97316', width: 6, points: [{ x: 264, y: 136 }, { x: 285, y: 115 }] }
  ],
  'tree': [
    { color: '#78350f', width: 10, points: [{ x: 190, y: 400 }, { x: 190, y: 280 }, { x: 210, y: 280 }, { x: 210, y: 400 }] }, // Trunk
    // Foliage
    {
      color: '#22c55e', width: 8, points: [
        { x: 200, y: 280 }, { x: 140, y: 260 }, { x: 120, y: 200 }, { x: 150, y: 140 },
        { x: 200, y: 120 }, { x: 250, y: 140 }, { x: 280, y: 200 }, { x: 260, y: 260 },
        { x: 200, y: 280 }
      ]
    }
  ],
  'flower': [
    { color: '#16a34a', width: 6, points: [{ x: 200, y: 400 }, { x: 200, y: 260 }] }, // Stem
    { color: '#16a34a', width: 6, points: [{ x: 200, y: 330 }, { x: 160, y: 310 }, { x: 200, y: 330 }, { x: 240, y: 310 }] }, // Leaves
    // Center circle
    {
      color: '#eab308', width: 8, points: Array.from({ length: 15 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        return { x: 200 + Math.cos(angle) * 25, y: 220 + Math.sin(angle) * 25 };
      })
    },
    // Petals
    { color: '#ec4899', width: 6, points: [{ x: 200, y: 195 }, { x: 180, y: 170 }, { x: 220, y: 170 }, { x: 200, y: 195 }] },
    { color: '#ec4899', width: 6, points: [{ x: 200, y: 245 }, { x: 180, y: 270 }, { x: 220, y: 270 }, { x: 200, y: 245 }] },
    { color: '#ec4899', width: 6, points: [{ x: 175, y: 220 }, { x: 150, y: 200 }, { x: 150, y: 240 }, { x: 175, y: 220 }] },
    { color: '#ec4899', width: 6, points: [{ x: 225, y: 220 }, { x: 250, y: 200 }, { x: 250, y: 240 }, { x: 225, y: 220 }] }
  ],
  'cat': [
    { color: '#4b5563', width: 6, points: Array.from({ length: 20 }, (_, i) => {
      const angle = (i / 19) * Math.PI * 2;
      return { x: 200 + Math.cos(angle) * 50, y: 250 + Math.sin(angle) * 45 };
    })}, // Head
    { color: '#4b5563', width: 6, points: [{ x: 160, y: 210 }, { x: 150, y: 160 }, { x: 180, y: 205 }] }, // Left ear
    { color: '#4b5563', width: 6, points: [{ x: 240, y: 210 }, { x: 250, y: 160 }, { x: 220, y: 205 }] }, // Right ear
    { color: '#ef4444', width: 5, points: [{ x: 195, y: 250 }, { x: 205, y: 250 }, { x: 200, y: 255 }, { x: 195, y: 250 }] }, // Nose
    { color: '#3b82f6', width: 6, points: [{ x: 180, y: 235 }] }, // Eye L
    { color: '#3b82f6', width: 6, points: [{ x: 220, y: 235 }] }, // Eye R
    { color: '#9ca3af', width: 4, points: [{ x: 170, y: 250 }, { x: 120, y: 240 }, { x: 170, y: 255 }, { x: 120, y: 255 }, { x: 170, y: 260 }, { x: 120, y: 270 }] }, // Whiskers L
    { color: '#9ca3af', width: 4, points: [{ x: 230, y: 250 }, { x: 280, y: 240 }, { x: 230, y: 255 }, { x: 280, y: 255 }, { x: 230, y: 260 }, { x: 280, y: 270 }] }  // Whiskers R
  ]
};

// Fallback generator for unknown drawings
function getBotFallbackDrawing(word: string): DrawStroke[] {
  const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
  const strokeColor = colors[hash % colors.length];

  // Draw some basic geometry, smiley face, or generic box
  return [
    {
      color: strokeColor, width: 6, points: Array.from({ length: 25 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        return { x: 200 + Math.cos(angle) * 70, y: 230 + Math.sin(angle) * 70 };
      })
    },
    { color: strokeColor, width: 6, points: [{ x: 170, y: 200 }] },
    { color: strokeColor, width: 6, points: [{ x: 230, y: 200 }] },
    {
      color: strokeColor, width: 6, points: Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 9) * Math.PI * 0.8 + 0.1;
        return { x: 200 + Math.cos(angle + Math.PI) * 40, y: 230 + Math.sin(angle + Math.PI) * 40 };
      })
    }
  ];
}

@Injectable({
  providedIn: 'root'
})
export class MockServerService {
  private roomState = new BehaviorSubject<RoomState | null>(null);
  public roomState$ = this.roomState.asObservable();

  private chatMessages = new BehaviorSubject<ChatMessage[]>([]);
  public chatMessages$ = this.chatMessages.asObservable();

  private drawingStream = new Subject<DrawStroke>();
  public drawingStream$ = this.drawingStream.asObservable();

  private clearDrawingEvent = new Subject<void>();
  public clearDrawingEvent$ = this.clearDrawingEvent.asObservable();

  private timerIntervalId: any;
  private botActionsTimeoutIds: any[] = [];
  private currentDrawStrokeIndex = 0;
  private currentDrawPointIndex = 0;
  private drawingTimeLimit = 60;
  private revealTimeLimit = 10;
  private activeRoomWords: string[] = [];
  private selectedGameMode: 'A' | 'B' = 'A';
  private botCount = 3;

  constructor() {}

  public getWordBank(): string[] {
    return WORD_BANK;
  }

  public createRoom(hostName: string, hostAvatar: string, settings: GameSettings): void {
    this.cleanup();
    this.selectedGameMode = settings.mode;
    this.botCount = settings.botCount;
    this.drawingTimeLimit = settings.drawTimeLimit;
    this.revealTimeLimit = settings.revealTimeLimit;

    // Build player list
    const players: Player[] = [
      { id: 'player-1', name: hostName, avatar: hostAvatar, isBot: false, score: 0, isDrawing: false, hasGuessedCorrectly: false }
    ];

    // Add bots
    const shuffledBotNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    const availableAvatars = AVATARS.filter(a => a !== hostAvatar);
    for (let i = 0; i < this.botCount; i++) {
      players.push({
        id: `bot-${i + 1}`,
        name: shuffledBotNames[i % shuffledBotNames.length],
        avatar: availableAvatars[i % availableAvatars.length],
        isBot: true,
        score: 0,
        isDrawing: false,
        hasGuessedCorrectly: false
      });
    }

    this.activeRoomWords = [...WORD_BANK];

    const state: RoomState = {
      id: 'room-' + Math.floor(1000 + Math.random() * 9000),
      players,
      phase: 'LOBBY',
      currentWord: '',
      obfuscatedWord: '',
      timeLeft: this.drawingTimeLimit,
      roundNumber: 0,
      maxRounds: this.selectedGameMode === 'A' ? players.length : 3 // Mode A: each player gets to draw once, Mode B: 3 rounds
    };

    this.roomState.next(state);
    this.chatMessages.next([
      { id: 'system-1', playerId: 'system', playerName: 'System', text: `Room created successfully. Playing: ${this.selectedGameMode === 'A' ? 'Skribbl Style' : 'Ice Breaker Style'}`, timestamp: Date.now(), isSystem: true, isCorrectGuess: false }
    ]);
  }

  public updateRoomSettings(settings: Partial<GameSettings>): void {
    const state = this.roomState.value;
    if (!state || state.phase !== 'LOBBY') return;

    if (settings.mode !== undefined) {
      this.selectedGameMode = settings.mode;
    }
    if (settings.drawTimeLimit !== undefined) {
      this.drawingTimeLimit = settings.drawTimeLimit;
    }

    let players = [...state.players];
    if (settings.botCount !== undefined) {
      this.botCount = settings.botCount;
      const host = players.find(p => p.id === 'player-1')!;
      players = [host];
      const shuffledBotNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);
      const availableAvatars = AVATARS.filter(a => a !== host.avatar);
      for (let i = 0; i < this.botCount; i++) {
        players.push({
          id: `bot-${i + 1}`,
          name: shuffledBotNames[i % shuffledBotNames.length],
          avatar: availableAvatars[i % availableAvatars.length],
          isBot: true,
          score: 0,
          isDrawing: false,
          hasGuessedCorrectly: false
        });
      }
    }

    const modeText = this.selectedGameMode === 'A' ? 'Skribbl Style' : 'Ice Breaker Style';

    this.roomState.next({
      ...state,
      players,
      timeLeft: this.drawingTimeLimit,
      maxRounds: this.selectedGameMode === 'A' ? players.length : 3
    });

    const messages = this.chatMessages.value;
    this.chatMessages.next([
      ...messages,
      {
        id: `sys-update-${Date.now()}`,
        playerId: 'system',
        playerName: 'System',
        text: `Room configurations updated. Mode: ${modeText}, Time Limit: ${this.drawingTimeLimit}s, Bots: ${this.botCount}`,
        timestamp: Date.now(),
        isSystem: true,
        isCorrectGuess: false
      }
    ]);
  }

  public startGame(): void {
    const state = this.roomState.value;
    if (!state) return;

    this.startNewRound(state);
  }

  private startNewRound(state: RoomState): void {
    const nextRound = state.roundNumber + 1;
    if (nextRound > state.maxRounds) {
      this.endGame(state);
      return;
    }

    this.clearAllTimeouts();
    this.clearDrawing();

    // Reset guessing flags
    const players = state.players.map(p => ({
      ...p,
      hasGuessedCorrectly: false,
      isDrawing: false,
      drawingData: undefined
    }));

    // Mode A vs Mode B setups
    let drawerId: string | undefined;
    let guesserId: string | undefined;
    let currentWord = '';
    let obfuscatedWord = '';

    const settingsMode = this.getGameSettingsMode(state.id);

    if (settingsMode === 'A') {
      // Pick drawer sequentially based on round number
      const drawerIndex = (nextRound - 1) % players.length;
      players[drawerIndex].isDrawing = true;
      drawerId = players[drawerIndex].id;

      // Select target word randomly
      currentWord = this.getRandomWord();
      obfuscatedWord = this.obfuscatedWordOf(currentWord);

      this.roomState.next({
        ...state,
        players,
        phase: 'PLAYING',
        roundNumber: nextRound,
        currentWord,
        obfuscatedWord,
        drawerId,
        guesserId: undefined,
        timeLeft: this.drawingTimeLimit
      });

      this.chatMessages.next([
        {
          id: `sys-round-${nextRound}`,
          playerId: 'system',
          playerName: 'System',
          text: `Round ${nextRound} started. ${players[drawerIndex].name} is drawing!`,
          timestamp: Date.now(),
          isSystem: true,
          isCorrectGuess: false
        }
      ]);

      this.startCountdown();

      // Trigger bot drawing / typing if applicable
      if (players[drawerIndex].isBot) {
        this.simulateBotDrawing(players[drawerIndex].name, currentWord);
      } else {
        // Human is drawing: Bots will try to guess during the round
        this.scheduleBotGuesses(currentWord);
      }

    } else {
      // Mode B: Ice Breaker style (everyone draws, 1 person guesses)
      // Pick guesser sequentially
      const guesserIndex = (nextRound - 1) % players.length;
      guesserId = players[guesserIndex].id;

      // Set everyone drawing EXCEPT the guesser
      const updatedPlayers = players.map(p => ({
        ...p,
        isDrawing: p.id !== guesserId
      }));

      currentWord = this.getRandomWord();
      obfuscatedWord = this.obfuscatedWordOf(currentWord);

      this.roomState.next({
        ...state,
        players: updatedPlayers,
        phase: 'PLAYING',
        roundNumber: nextRound,
        currentWord,
        obfuscatedWord,
        drawerId: undefined,
        guesserId,
        timeLeft: this.drawingTimeLimit
      });

      this.chatMessages.next([
        {
          id: `sys-round-${nextRound}`,
          playerId: 'system',
          playerName: 'System',
          text: `Round ${nextRound} started. Everyone draws "${currentWord}". ${players[guesserIndex].name} will guess!`,
          timestamp: Date.now(),
          isSystem: true,
          isCorrectGuess: false
        }
      ]);

      this.startCountdown();

      // Simulate bot drawings in parallel (Mode B)
      this.simulateBotsDrawingModeB(currentWord, guesserId);
    }
  }

  private startCountdown(): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);

    this.timerIntervalId = setInterval(() => {
      const state = this.roomState.value;
      if (!state) {
        clearInterval(this.timerIntervalId);
        return;
      }

      if (state.timeLeft <= 1) {
        clearInterval(this.timerIntervalId);
        this.revealRoundResults();
      } else {
        // If all guessers in Mode A have guessed correctly, finish immediately
        const settingsMode = this.getGameSettingsMode(state.id);
        if (settingsMode === 'A') {
          const guessers = state.players.filter(p => p.id !== state.drawerId);
          const allGuessed = guessers.every(p => p.hasGuessedCorrectly);
          if (allGuessed && guessers.length > 0) {
            clearInterval(this.timerIntervalId);
            this.revealRoundResults();
            return;
          }
        }

        this.roomState.next({
          ...state,
          timeLeft: state.timeLeft - 1
        });
      }
    }, 1000);
  }

  public sendMessage(text: string): void {
    const state = this.roomState.value;
    if (!state) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    // Check if player is allowed to guess
    const player = state.players.find(p => p.id === 'player-1');
    if (!player) return;

    // System messages or correct guesses are masked
    const isModeA = !state.guesserId;
    let isCorrect = false;

    if (isModeA && state.phase === 'PLAYING') {
      const isDrawer = state.drawerId === 'player-1';
      if (!isDrawer && !player.hasGuessedCorrectly) {
        if (trimmed.toLowerCase() === state.currentWord.toLowerCase()) {
          isCorrect = true;
          this.handleCorrectGuess('player-1');
        }
      }
    }

    const messages = this.chatMessages.value;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      playerId: 'player-1',
      playerName: player.name,
      text: isCorrect ? 'Guessed the correct word! 🎉' : trimmed,
      timestamp: Date.now(),
      isSystem: isCorrect,
      isCorrectGuess: isCorrect
    };

    this.chatMessages.next([...messages, newMsg]);
  }

  public submitDrawing(strokes: DrawStroke[]): void {
    const currentState = this.roomState.value;
    if (currentState) {
      const updatedPlayers = currentState.players.map(p => {
        if (p.id === 'player-1') {
          return {
            ...p,
            drawingData: strokes
          };
        }
        return p;
      });
      this.roomState.next({
        ...currentState,
        players: updatedPlayers
      });
    }
  }

  public submitModeBGuess(guess: string): void {
    const state = this.roomState.value;
    if (!state || state.phase !== 'PLAYING') return;

    const guesser = state.players.find(p => p.id === state.guesserId);
    if (!guesser || guesser.isBot) return; // Only human input triggers this directly

    const isCorrect = guess.trim().toLowerCase() === state.currentWord.toLowerCase();
    
    // Add chat alert
    const messages = this.chatMessages.value;
    this.chatMessages.next([...messages, {
      id: `msg-${Date.now()}`,
      playerId: 'player-1',
      playerName: guesser.name,
      text: `guessed: "${guess}" - ${isCorrect ? 'CORRECT! 🎉' : 'INCORRECT ❌'}`,
      timestamp: Date.now(),
      isSystem: true,
      isCorrectGuess: isCorrect
    }]);

    if (isCorrect) {
      // Award score to guesser
      const score = Math.round(150 * (state.timeLeft / this.drawingTimeLimit)) + 50;
      this.awardScore(guesser.id, score);
      
      // Award score to each drawer who submitted a drawing
      state.players.forEach(p => {
        if (p.id !== guesser.id && p.drawingData && p.drawingData.length > 0) {
          this.awardScore(p.id, 100);
        }
      });
    }

    // Advance to reveal results immediately on submission
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
    this.revealRoundResults();
  }

  public sendDrawingStroke(stroke: DrawStroke): void {
    const state = this.roomState.value;
    if (!state || state.phase !== 'PLAYING') return;

    // Emits drawings to observers
    this.drawingStream.next(stroke);

    // For Mode B, save the human player's drawing data in local state
    if (state.guesserId && state.guesserId !== 'player-1') {
      const updatedPlayers = state.players.map(p => {
        if (p.id === 'player-1') {
          const currentDrawing = p.drawingData || [];
          return { ...p, drawingData: [...currentDrawing, stroke] };
        }
        return p;
      });
      this.roomState.next({ ...state, players: updatedPlayers });
    }
  }

  public clearDrawing(): void {
    this.clearDrawingEvent.next();
  }

  private handleCorrectGuess(playerId: string): void {
    const state = this.roomState.value;
    if (!state) return;

    const player = state.players.find(p => p.id === playerId);
    if (!player || player.hasGuessedCorrectly) return;

    // Mark as guessed
    const updatedPlayers = state.players.map(p => {
      if (p.id === playerId) {
        // Score scale based on remaining time
        const timeLeftScale = state.timeLeft / this.drawingTimeLimit;
        const scoreGain = Math.round(100 * timeLeftScale) + 20; // min 20 points
        return {
          ...p,
          hasGuessedCorrectly: true,
          score: p.score + scoreGain,
          lastGuessTime: Date.now()
        };
      }
      return p;
    });

    // Award point to drawer
    const updatedWithDrawer = updatedPlayers.map(p => {
      if (p.id === state.drawerId) {
        return {
          ...p,
          score: p.score + 30 // 30 points for drawer per correct guess
        };
      }
      return p;
    });

    this.roomState.next({
      ...state,
      players: updatedWithDrawer
    });
  }

  private revealRoundResults(): void {
    this.clearAllTimeouts();
    const state = this.roomState.value;
    if (!state) return;

    this.roomState.next({
      ...state,
      phase: 'REVEAL',
      timeLeft: this.revealTimeLimit
    });

    const messages = this.chatMessages.value;
    this.chatMessages.next([
      ...messages,
      {
        id: `reveal-${Date.now()}`,
        playerId: 'system',
        playerName: 'System',
        text: `Round finished! The word was "${state.currentWord}".`,
        timestamp: Date.now(),
        isSystem: true,
        isCorrectGuess: false
      }
    ]);

    // Timer for reveal period
    let revealTime = this.revealTimeLimit;
    this.timerIntervalId = setInterval(() => {
      revealTime--;
      const curr = this.roomState.value;
      if (!curr) {
        clearInterval(this.timerIntervalId);
        return;
      }

      if (revealTime <= 0) {
        clearInterval(this.timerIntervalId);
        this.startNewRound(curr);
      } else {
        this.roomState.next({
          ...curr,
          timeLeft: revealTime
        });
      }
    }, 1000);
  }

  private endGame(state: RoomState): void {
    this.roomState.next({
      ...state,
      phase: 'GAME_OVER',
      timeLeft: 0
    });

    const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    const messages = this.chatMessages.value;
    this.chatMessages.next([
      ...messages,
      {
        id: `end-${Date.now()}`,
        playerId: 'system',
        playerName: 'System',
        text: `Game Over! The winner is ${winner.name} with ${winner.score} pts! 🏆`,
        timestamp: Date.now(),
        isSystem: true,
        isCorrectGuess: false
      }
    ]);
  }

  public resetRoom(): void {
    this.cleanup();
    this.roomState.next(null);
    this.chatMessages.next([]);
  }

  private cleanup(): void {
    this.clearAllTimeouts();
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }
  }

  private clearAllTimeouts(): void {
    this.botActionsTimeoutIds.forEach(id => clearTimeout(id));
    this.botActionsTimeoutIds = [];
  }

  private getGameSettingsMode(roomId: string): 'A' | 'B' {
    return this.selectedGameMode;
  }

  // --- BOT SIMULATION HELPER LOGIC ---

  private simulateBotDrawing(botName: string, word: string): void {
    // Load presets or use procedural fallback
    const strokes = BOT_PRESETS[word.toLowerCase()] || getBotFallbackDrawing(word);
    this.currentDrawStrokeIndex = 0;
    this.currentDrawPointIndex = 0;

    const drawNextPoint = () => {
      const state = this.roomState.value;
      if (!state || state.phase !== 'PLAYING') return;

      if (this.currentDrawStrokeIndex >= strokes.length) {
        return; // Finished drawing
      }

      const activeStroke = strokes[this.currentDrawStrokeIndex];
      
      // If start of a stroke
      if (this.currentDrawPointIndex === 0) {
        this.drawingStream.next({
          color: activeStroke.color,
          width: activeStroke.width,
          points: [activeStroke.points[0]]
        });
        this.currentDrawPointIndex++;
      } else {
        // Append point
        const drawnPoints = activeStroke.points.slice(0, this.currentDrawPointIndex + 1);
        this.drawingStream.next({
          color: activeStroke.color,
          width: activeStroke.width,
          points: drawnPoints
        });

        this.currentDrawPointIndex++;
        if (this.currentDrawPointIndex >= activeStroke.points.length) {
          // Next stroke
          this.currentDrawStrokeIndex++;
          this.currentDrawPointIndex = 0;
        }
      }

      // Schedule next draw event (about every 80ms)
      const timeoutId = setTimeout(drawNextPoint, 80);
      this.botActionsTimeoutIds.push(timeoutId);
    };

    // Begin drawing after 1.5s delay
    const startTimeoutId = setTimeout(drawNextPoint, 1500);
    this.botActionsTimeoutIds.push(startTimeoutId);
  }

  private scheduleBotGuesses(word: string): void {
    const state = this.roomState.value;
    if (!state) return;

    // Filter bots
    const bots = state.players.filter(p => p.isBot);

    bots.forEach(bot => {
      // Decide if bot guesses correctly, and at what second in the timer
      const willGuessCorrectly = Math.random() > 0.3; // 70% chance of guessing correctly
      
      if (willGuessCorrectly) {
        // Guess correct between 5s and 45s of the round
        const guessDelay = 5000 + Math.random() * 35000;
        const guessTimeout = setTimeout(() => {
          const currentState = this.roomState.value;
          if (currentState && currentState.phase === 'PLAYING') {
            // Log Correct Guess
            this.handleCorrectGuess(bot.id);
            
            const messages = this.chatMessages.value;
            this.chatMessages.next([
              ...messages,
              {
                id: `bot-guess-${Date.now()}`,
                playerId: bot.id,
                playerName: bot.name,
                text: 'Guessed the correct word! 🎉',
                timestamp: Date.now(),
                isSystem: true,
                isCorrectGuess: true
              }
            ]);
          }
        }, guessDelay);
        this.botActionsTimeoutIds.push(guessTimeout);
      }

      // Periodically make incorrect guesses
      const incorrectGuessesCount = Math.floor(Math.random() * 3);
      for (let i = 0; i < incorrectGuessesCount; i++) {
        const incorrectDelay = 3000 + Math.random() * 40000;
        const incorrectTimeout = setTimeout(() => {
          const currentState = this.roomState.value;
          if (currentState && currentState.phase === 'PLAYING' && !bot.hasGuessedCorrectly) {
            // Pick a close or random word
            const wrongWords = ['house', 'cat', 'sun', 'car', 'flower', 'dog', 'ball', 'cake', 'pizza', 'building', 'plane'];
            const randomWrong = wrongWords[Math.floor(Math.random() * wrongWords.length)];
            
            if (randomWrong !== word.toLowerCase()) {
              const messages = this.chatMessages.value;
              this.chatMessages.next([
                ...messages,
                {
                  id: `bot-guess-wrong-${Date.now()}`,
                  playerId: bot.id,
                  playerName: bot.name,
                  text: randomWrong,
                  timestamp: Date.now(),
                  isSystem: false,
                  isCorrectGuess: false
                }
              ]);
            }
          }
        }, incorrectDelay);
        this.botActionsTimeoutIds.push(incorrectTimeout);
      }
    });
  }

  private simulateBotsDrawingModeB(word: string, guesserId: string): void {
    const state = this.roomState.value;
    if (!state) return;

    // Draw for all bots that are NOT the guesser
    const drawingBots = state.players.filter(p => p.isBot && p.id !== guesserId);

    drawingBots.forEach(bot => {
      // Pick coordinate set
      const strokes = BOT_PRESETS[word.toLowerCase()] || getBotFallbackDrawing(word);

      // Instantly or progressively assign drawing data to the bot in local state after a slight delay
      const finishDrawingTimeout = setTimeout(() => {
        const currentState = this.roomState.value;
        if (currentState && currentState.phase === 'PLAYING') {
          const updatedPlayers = currentState.players.map(p => {
            if (p.id === bot.id) {
              return {
                ...p,
                drawingData: strokes
              };
            }
            return p;
          });
          this.roomState.next({
            ...currentState,
            players: updatedPlayers
          });
        }
      }, 2000 + Math.random() * 8000); // bots complete drawing in 2-10 seconds
      this.botActionsTimeoutIds.push(finishDrawingTimeout);
    });

    // If the guesser is a BOT, we simulate the bot guesser guessing after 15 seconds
    const guesser = state.players.find(p => p.id === guesserId);
    if (guesser && guesser.isBot) {
      const botGuesserTimeout = setTimeout(() => {
        const currentState = this.roomState.value;
        if (currentState && currentState.phase === 'PLAYING') {
          // 80% chance of guessing correct word, otherwise guessing a random word
          const correct = Math.random() > 0.2;
          const guess = correct ? word : 'something else';

          const messages = this.chatMessages.value;
          this.chatMessages.next([
            ...messages,
            {
              id: `bot-guess-b-${Date.now()}`,
              playerId: guesser.id,
              playerName: guesser.name,
              text: `guessed: "${guess}" - ${correct ? 'CORRECT! 🎉' : 'INCORRECT ❌'}`,
              timestamp: Date.now(),
              isSystem: true,
              isCorrectGuess: correct
            }
          ]);

          if (correct) {
            // Award scores
            this.awardScore(guesser.id, 100);
            currentState.players.forEach(p => {
              if (p.id !== guesser.id) {
                this.awardScore(p.id, 80);
              }
            });
          }

          if (this.timerIntervalId) clearInterval(this.timerIntervalId);
          this.revealRoundResults();
        }
      }, 15000);
      this.botActionsTimeoutIds.push(botGuesserTimeout);
    }
  }

  private awardScore(playerId: string, scoreGain: number): void {
    const currentState = this.roomState.value;
    if (!currentState) return;

    const players = currentState.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          score: p.score + scoreGain
        };
      }
      return p;
    });

    this.roomState.next({
      ...currentState,
      players
    });
  }

  private getRandomWord(): string {
    if (this.activeRoomWords.length === 0) {
      this.activeRoomWords = [...WORD_BANK];
    }
    const index = Math.floor(Math.random() * this.activeRoomWords.length);
    const word = this.activeRoomWords[index];
    this.activeRoomWords.splice(index, 1);
    return word;
  }

  private obfuscatedWordOf(word: string): string {
    return word.split('').map(() => '_').join(' ');
  }
}
