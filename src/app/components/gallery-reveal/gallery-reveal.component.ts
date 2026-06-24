import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../services/game-state.service';
import { RoomState, Player } from '../../models/game.model';
import { CanvasComponent } from '../canvas/canvas.component';

@Component({
  selector: 'app-gallery-reveal',
  standalone: true,
  imports: [CommonModule, FormsModule, CanvasComponent],
  templateUrl: './gallery-reveal.component.html',
  styleUrl: './gallery-reveal.component.css',
})
export class GalleryRevealComponent {
  @Input() roomState!: RoomState;

  public guessText = '';

  constructor(private gameState: GameStateService) {}

  public get myPlayerId(): string | null {
    return this.gameState.getMyPlayerId();
  }

  public get isPlayerGuesser(): boolean {
    return this.roomState?.guesserId === this.myPlayerId;
  }

  public get activeGuesser(): Player | undefined {
    return this.roomState?.players.find((p) => p.id === this.roomState.guesserId);
  }

  public get drawingPlayers(): Player[] {
    if (!this.roomState) return [];
    // Everyone who is NOT the guesser
    return this.roomState.players.filter((p) => p.id !== this.roomState.guesserId);
  }

  public onSubmitGuess(): void {
    const text = this.guessText.trim();
    if (!text) return;

    this.gameState.submitModeBGuess(text);
    this.guessText = '';
  }
}
