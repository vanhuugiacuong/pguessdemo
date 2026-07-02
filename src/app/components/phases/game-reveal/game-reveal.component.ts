import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomState, Player } from '../../../models/game.model';
import { CanvasComponent } from '../../gameplay/canvas/canvas.component';
import { GameStateService } from '../../../services/game-state.service';

@Component({
  selector: 'app-game-reveal',
  standalone: true,
  imports: [CommonModule, CanvasComponent],
  templateUrl: './game-reveal.component.html',
  styles: [`
    @keyframes revealStep {
      0% {
        opacity: 0;
        transform: scale(0.85) translateY(30px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    .animate-reveal-step {
      animation: revealStep 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      will-change: transform, opacity;
    }
  `]
})
export class GameRevealComponent implements OnChanges {
  @Input() roomState: RoomState | null = null;
  @Input() myPlayerId: string | null = null;
  @Input() currentDrawerPlayer: Player | undefined;
  @Input() currentRevealChainIndex = 0;
  @Output() currentRevealChainIndexChange = new EventEmitter<number>();
  @Input() albumSteps: any[] = [];
  @Input() sortedPlayers: Player[] = [];

  @Output() quit = new EventEmitter<void>();

  public visibleStepsCount = 1;

  constructor(private gameState: GameStateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['albumSteps']) {
      const prev = changes['albumSteps'].previousValue;
      const curr = changes['albumSteps'].currentValue;
      if (
        !prev ||
        !curr ||
        prev.length !== curr.length ||
        (curr.length > 0 && prev[0]?.content !== curr[0]?.content)
      ) {
        this.visibleStepsCount = 1;
      }
    }
  }

  public selectChain(index: number): void {
    this.currentRevealChainIndex = index;
    this.currentRevealChainIndexChange.emit(index);
    this.visibleStepsCount = 1;
  }

  public showNextStep(): void {
    if (this.visibleStepsCount < this.albumSteps.length) {
      this.visibleStepsCount++;
      this.scrollToBottom();
    }
  }

  public revealAllSteps(): void {
    this.visibleStepsCount = this.albumSteps.length;
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.timeline-container');
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  }

  public get myPlayer(): Player | undefined {
    if (!this.roomState || !this.myPlayerId) return undefined;
    return this.roomState.players.find((p) => p.id === this.myPlayerId);
  }

  public get isReady(): boolean {
    return this.myPlayer?.readyForNextRound ?? false;
  }

  public toggleReady(): void {
    this.gameState.setReadyForNextRound(!this.isReady);
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
