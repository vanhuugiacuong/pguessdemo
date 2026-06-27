import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomState, Player } from '../../../models/game.model';
import { CanvasComponent } from '../../gameplay/canvas/canvas.component';

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
  @Input() albumSteps: any[] = [];
  @Input() sortedPlayers: Player[] = [];

  @Output() quit = new EventEmitter<void>();

  public onQuit(): void {
    this.quit.emit();
  }
}
