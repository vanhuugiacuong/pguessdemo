import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomState, Player } from '../../../models/game.model';
import { CanvasComponent } from '../../gameplay/canvas/canvas.component';
import { GameStateService } from '../../../services/game-state.service';

@Component({
  selector: 'app-game-reveal',
  standalone: true,
  imports: [CommonModule, CanvasComponent],
  templateUrl: './game-reveal.component.html'
})
export class GameRevealComponent {
  @Input() roomState: RoomState | null = null;
  @Input() myPlayerId: string | null = null;
  @Input() currentDrawerPlayer: Player | undefined;
  @Input() currentRevealChainIndex = 0;
  @Output() currentRevealChainIndexChange = new EventEmitter<number>();
  @Input() albumSteps: any[] = [];
  @Input() sortedPlayers: Player[] = [];

  @Output() quit = new EventEmitter<void>();

  constructor(private gameState: GameStateService) {}

  public selectChain(index: number): void {
    this.currentRevealChainIndex = index;
    this.currentRevealChainIndexChange.emit(index);
  }

  public get isHost(): boolean {
    if (!this.roomState || !this.myPlayerId) return false;
    return this.roomState.hostId === this.myPlayerId;
  }

  public onReturnToLobby(): void {
    this.gameState.returnToLobby();
  }

  public onQuit(): void {
    this.quit.emit();
  }
}
