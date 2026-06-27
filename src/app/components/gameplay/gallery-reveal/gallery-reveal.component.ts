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
    if (!state) return [];
    // Trong lúc chơi (lượt đoán), người đoán chỉ được nhìn bức tranh cuối cùng trong chuỗi vẽ truyền tay
    if (state.phase === 'PLAYING') {
      const lastDrawerIndex = state.players.length - 2;
      if (lastDrawerIndex >= 0) {
        return [state.players[lastDrawerIndex]];
      }
    }
    // Khi kết thúc game/reveal, hiển thị toàn bộ chuỗi tranh vẽ của các họa sĩ
    return state.players.filter((p) => p.id !== state.guesserId);
  }

  public onSubmitGuess(): void {
    const text = this.guessText.trim();
    if (!text) return;

    this.gameState.submitModeBGuess(text);
    this.guessText = '';
  }
}
