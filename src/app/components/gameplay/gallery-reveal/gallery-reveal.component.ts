import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../../services/game-state.service';
import { RoomState, Player } from '../../../models/game.model';
import { CanvasComponent } from '../canvas/canvas.component';

@Component({
  selector: 'app-gallery-reveal',
  standalone: true,
  imports: [CommonModule, FormsModule, CanvasComponent],
  templateUrl: './gallery-reveal.component.html',
  styleUrl: './gallery-reveal.component.css',
})
export class GalleryRevealComponent {
  @Input() roomState: RoomState | null = null;

  public guessText = '';

  constructor(private gameState: GameStateService) {}

  public get myPlayerId(): string | null {
    return this.gameState.getMyPlayerId();
  }

  public get isPlayerGuesser(): boolean {
    return this.roomState?.guesserId === this.myPlayerId;
  }

  public get activeGuesser(): Player | undefined {
    const state = this.roomState;
    if (!state) return undefined;
    return state.players.find((p) => p.id === state.guesserId);
  }

  public get drawingPlayers(): Player[] {
    const state = this.roomState;
    if (!state || !state.modeBChains || state.modeBChains.length === 0) return [];

    if (state.phase === 'PLAYING') {
      const N = state.players.length;
      const k = Math.floor(((state.roundNumber || 1) - 1) / N);
      const chain = state.modeBChains[k];
      if (!chain) return [];

      const drawingSteps = chain.steps.filter((s) => s.type === 'drawing');
      if (drawingSteps.length === 0) return [];
      const lastStep = drawingSteps[drawingSteps.length - 1];

      const mockPlayer: Player = {
        id: lastStep.player.id,
        name: lastStep.player.name,
        avatar: lastStep.player.avatar,
        isBot: false,
        score: 0,
        isDrawing: false,
        hasGuessedCorrectly: false,
        drawingData: lastStep.content,
      };
      return [mockPlayer];
    }
    return state.players.filter((p) => p.id !== state.guesserId);
  }

  public onSubmitGuess(): void {
    const text = this.guessText.trim();
    if (!text) return;

    this.gameState.submitModeBGuess(text);
    this.guessText = '';
  }
}
