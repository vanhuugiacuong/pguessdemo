import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { RoomState, ChatMessage, DrawStroke, GameSettings } from '../models/game.model';
import { MockServerService } from './mock-server.service';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  public roomState$: Observable<RoomState | null>;
  public chatMessages$: Observable<ChatMessage[]>;
  public drawingStream$: Observable<DrawStroke>;
  public clearDrawingEvent$: Observable<void>;

  private playerName: string = 'Player 1';
  private playerAvatar: string = '2.svg';
  private currentRoomId: string | null = null;

  constructor(
    private mockServer: MockServerService,
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
    return this.mockServer.getWordBank();
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
    } else {
      this.mockServer.updateRoomSettings(settings);
    }
  }

  public startGame(): void {
    if (this.currentRoomId) {
      this.socketService.startGame(this.currentRoomId);
    } else {
      this.mockServer.startGame();
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
    } else {
      this.mockServer.sendMessage(text);
    }
  }

  public submitModeBGuess(guess: string): void {
    if (this.currentRoomId) {
      this.socketService.submitModeBGuess(this.currentRoomId, guess);
    } else {
      this.mockServer.submitModeBGuess(guess);
    }
  }

  public submitDrawing(strokes: DrawStroke[]): void {
    if (this.currentRoomId) {
      this.socketService.submitDrawing(this.currentRoomId, strokes);
    } else {
      // Mock server could just save strokes to the active drawer
      this.mockServer.submitDrawing(strokes);
    }
  }

  public sendStroke(stroke: DrawStroke): void {
    if (this.currentRoomId) {
      this.socketService.sendStroke(this.currentRoomId, stroke);
    } else {
      this.mockServer.sendDrawingStroke(stroke);
    }
  }

  public clearCanvas(): void {
    if (this.currentRoomId) {
      this.socketService.clearCanvas(this.currentRoomId);
    } else {
      this.mockServer.clearDrawing();
    }
  }

  public resetRoom(): void {
    if (this.currentRoomId) {
      this.socketService.leaveRoom(this.currentRoomId);
    } else {
      this.mockServer.resetRoom();
    }
  }
}
