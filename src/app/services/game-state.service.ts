import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GameSettings, RoomState, ChatMessage, DrawStroke } from '../models/game.model';
import { SocketService } from './socket.service';
import { Observable } from 'rxjs';

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

  private currentRoomId: string | null = null;
  private playerName = 'Player 1';
  private playerAvatar = 'avatar_1.png';

  constructor(
    private socketService: SocketService,
    private router: Router
  ) {
    this.roomState$ = this.socketService.roomState$;
    this.chatMessages$ = this.socketService.chatMessages$;
    this.drawingStream$ = this.socketService.drawingStream$;
    this.clearDrawingEvent$ = this.socketService.clearDrawingEvent$;

    this.roomState$.subscribe((state) => {
      this.currentRoomId = state ? state.id : null;
      if (state) {
        const currentUrl = this.router.url;
        if (!currentUrl.includes(`/lobby/${state.id}`)) {
          this.router.navigate(['/lobby', state.id]);
        }
      } else {
        const currentUrl = this.router.url;
        if (currentUrl.includes('/lobby/')) {
          this.router.navigate(['/']);
        }
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
    this.socketService.createRoom(this.playerName, avatar, settings);
  }

  public joinRoom(roomId: string, playerName: string, avatar: string): void {
    this.playerName = playerName.trim() || 'Player 1';
    this.playerAvatar = avatar;
    this.socketService.joinRoom(roomId, this.playerName, avatar);
  }

  public updateRoomSettings(settings: Partial<GameSettings>): void {
    if (this.currentRoomId) {
      this.socketService.updateRoomSettings(this.currentRoomId, settings);
    }
  }

  public startGame(): void {
    if (this.currentRoomId) {
      this.socketService.startGame(this.currentRoomId);
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
    if (this.currentRoomId) {
      this.socketService.leaveRoom(this.currentRoomId);
    }
  }
}
