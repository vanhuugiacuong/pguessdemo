import { Injectable } from '@angular/core';
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

  constructor(
    private mockServer: MockServerService,
    private socketService: SocketService
  ) {
    // Trỏ trạng thái phòng trực tiếp sang SocketService để tương tác với NestJS
    this.roomState$ = this.socketService.roomState$;
    
    // Giữ kết nối Canvas và Chat bằng MockServerService như cũ
    this.chatMessages$ = this.mockServer.chatMessages$;
    this.drawingStream$ = this.mockServer.drawingStream$;
    this.clearDrawingEvent$ = this.mockServer.clearDrawingEvent$;
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
    this.mockServer.updateRoomSettings(settings);
  }

  public startGame(): void {
    this.mockServer.startGame();
  }

  public submitGuess(text: string): void {
    this.mockServer.sendMessage(text);
  }

  public submitModeBGuess(guess: string): void {
    this.mockServer.submitModeBGuess(guess);
  }

  public sendStroke(stroke: DrawStroke): void {
    this.mockServer.sendDrawingStroke(stroke);
  }

  public clearCanvas(): void {
    this.mockServer.clearDrawing();
  }

  public resetRoom(): void {
    this.mockServer.resetRoom();
  }
}
