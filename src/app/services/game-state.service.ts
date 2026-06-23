import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RoomState, ChatMessage, DrawStroke, GameSettings } from '../models/game.model';
import { MockServerService } from './mock-server.service';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  public roomState$: Observable<RoomState | null>;
  public chatMessages$: Observable<ChatMessage[]>;
  public drawingStream$: Observable<DrawStroke>;
  public clearDrawingEvent$: Observable<void>;

  private playerName: string = 'Player 1';

  constructor(private mockServer: MockServerService) {
    this.roomState$ = this.mockServer.roomState$;
    this.chatMessages$ = this.mockServer.chatMessages$;
    this.drawingStream$ = this.mockServer.drawingStream$;
    this.clearDrawingEvent$ = this.mockServer.clearDrawingEvent$;
  }

  public getPlayerName(): string {
    return this.playerName;
  }

  public getWordBank(): string[] {
    return this.mockServer.getWordBank();
  }

  public createRoom(playerName: string, settings: GameSettings): void {
    this.playerName = playerName.trim() || 'Player 1';
    this.mockServer.createRoom(this.playerName, settings);
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
