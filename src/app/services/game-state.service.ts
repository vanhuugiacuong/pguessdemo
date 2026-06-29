import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GameSettings, RoomState, ChatMessage, DrawStroke, GamePhase } from '../models/game.model';
import { SocketService } from './socket.service';
import { SoundService } from './sound.service';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import * as RoomActions from '../store/room/room.actions';
import * as RoomSelectors from '../store/room/room.selectors';

const WORD_BANK = [
  'house', 'cat', 'tree', 'sun', 'car', 'flower', 'fish', 'cup', 'star', 'apple',
  'boat', 'bird', 'cake', 'hat', 'cloud', 'heart', 'moon', 'ball', 'book', 'face'
];

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  public roomState$: Observable<RoomState | null>;
  public chatMessages$: Observable<ChatMessage[]>;
  public drawingStream$: Observable<DrawStroke>;
  public clearDrawingEvent$: Observable<void>;
  public loading$: Observable<boolean>;
  public error$: Observable<string | null>;

  private currentRoomId: string | null = null;
  private playerName = 'Player 1';
  private playerAvatar = 'avatar_1.png';

  // Track previous phase & round for sound triggers
  private previousPhase: GamePhase | null = null;
  private previousRound = 0;
  private previousPlayerCount = 0;

  constructor(
    private socketService: SocketService,
    private router: Router,
    private store: Store,
    private soundService: SoundService
  ) {
    this.roomState$ = this.socketService.roomState$;
    this.chatMessages$ = this.socketService.chatMessages$;
    this.loading$ = this.store.select(RoomSelectors.selectLoading);
    this.error$ = this.store.select(RoomSelectors.selectError);

    this.drawingStream$ = this.socketService.drawingStream$;
    this.clearDrawingEvent$ = this.socketService.clearDrawingEvent$;

    // --- Room state subscription: routing + sounds ---
    this.roomState$.subscribe((state) => {
      this.currentRoomId = state ? state.id : null;

      if (state) {
        // Routing
        const currentUrl = this.router.url;
        if (!currentUrl.includes(`/lobby/${state.id}`)) {
          this.router.navigate(['/lobby', state.id]);
        }

        // Sound: someone new joins the lobby
        if (
          state.phase === 'LOBBY' &&
          state.players.length > this.previousPlayerCount &&
          this.previousPlayerCount > 0
        ) {
          this.soundService.playJoin();
        }
        this.previousPlayerCount = state.players.length;

        // Sound: phase transitions
        const phase = state.phase;
        if (phase !== this.previousPhase) {
          if (phase === 'WORD_SELECTION' && this.previousPhase === 'LOBBY') {
            // Game just started
            this.soundService.playGameStart();
          } else if (phase === 'PLAYING' && this.previousPhase === 'WORD_SELECTION') {
            // Word selected, drawing begins
            this.soundService.playRoundStart();
          } else if (phase === 'REVEAL') {
            // Round ended
            this.soundService.playWrong();
          } else if (phase === 'GAME_OVER') {
            this.soundService.playGameOver();
          }
          this.previousPhase = phase;
        }

        // Sound: new round starts (round number incremented while not LOBBY)
        if (
          phase !== 'LOBBY' &&
          state.roundNumber > this.previousRound &&
          this.previousRound > 0
        ) {
          this.soundService.playRoundStart();
        }
        this.previousRound = state.roundNumber;

        // Sound: timer warning tick (≤ 10s, during PLAYING phase)
        if (phase === 'PLAYING' && state.timeLeft > 0 && state.timeLeft <= 10) {
          this.soundService.playTimerTick();
        }
      } else {
        // State is null -> left room
        this.previousPhase = null;
        this.previousRound = 0;
        this.previousPlayerCount = 0;

        const currentUrl = this.router.url;
        if (currentUrl.includes('/lobby/')) {
          this.router.navigate(['/']);
        }
      }
    });

    // Sound: correct guess from chat messages
    this.chatMessages$.subscribe((messages) => {
      if (messages.length === 0) return;
      const latest = messages[messages.length - 1];
      if (latest.isCorrectGuess) {
        this.soundService.playCorrectGuess();
      }
    });
  }

  public getPlayerName(): string {
    return this.playerName;
  }

  public getPlayerAvatar(): string {
    return this.playerAvatar;
  }

  public getWordBank(): string[] {
    return WORD_BANK;
  }

  public getMyPlayerId(): string | null {
    return this.socketService.getSocketId();
  }

  public createRoom(playerName: string, avatar: string, settings: GameSettings): void {
    this.playerName = playerName.trim() || 'Player 1';
    this.playerAvatar = avatar;
    this.soundService.playJoin();
    this.store.dispatch(RoomActions.createRoom({ playerName, avatar, settings }));
  }

  public joinRoom(roomId: string, playerName: string, avatar: string): void {
    this.playerName = playerName.trim() || 'Player 1';
    this.playerAvatar = avatar;
    this.soundService.playJoin();
    this.store.dispatch(RoomActions.joinRoom({ roomId, playerName, avatar }));
  }

  public updateRoomSettings(settings: Partial<GameSettings>): void {
    if (this.currentRoomId) {
      this.socketService.updateRoomSettings(this.currentRoomId, settings);
    }
  }

  public startGame(): void {
    if (this.currentRoomId) {
      this.store.dispatch(RoomActions.startGame({ roomId: this.currentRoomId }));
    }
  }

  public selectWord(word: string): void {
    if (this.currentRoomId) {
      this.socketService.selectWord(this.currentRoomId, word);
    }
  }

  public submitGuess(text: string): void {
    if (this.currentRoomId) {
      this.socketService.sendMessage(this.currentRoomId, text);
    }
  }

  public submitModeBGuess(guess: string): void {
    if (this.currentRoomId) {
      this.socketService.submitModeBGuess(this.currentRoomId, guess);
    }
  }

  public submitDrawing(strokes: DrawStroke[]): void {
    if (this.currentRoomId) {
      this.socketService.submitDrawing(this.currentRoomId, strokes);
    }
  }

  public sendStroke(stroke: DrawStroke): void {
    if (this.currentRoomId) {
      this.socketService.sendStroke(this.currentRoomId, stroke);
    }
  }

  public clearCanvas(): void {
    if (this.currentRoomId) {
      this.socketService.clearCanvas(this.currentRoomId);
    }
  }

  public resetRoom(): void {
    this.store.dispatch(RoomActions.resetRoom());
    if (this.currentRoomId) {
      this.socketService.leaveRoom(this.currentRoomId);
    }
  }
}
