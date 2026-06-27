import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomState, Player, DrawStroke } from '../../../models/game.model';
import { CanvasComponent } from '../../gameplay/canvas/canvas.component';
import { ChatComponent } from '../../gameplay/chat/chat.component';
import { GalleryRevealComponent } from '../../gameplay/gallery-reveal/gallery-reveal.component';

@Component({
  selector: 'app-game-playing',
  standalone: true,
  imports: [
    CommonModule,
    CanvasComponent,
    ChatComponent,
    GalleryRevealComponent
  ],
  templateUrl: './game-playing.component.html'
})
export class GamePlayingComponent {
  @Input() roomState: RoomState | null = null;
  @Input() myPlayerId: string | null = null;
  @Input() isUserDrawer = false;
  @Input() isUserGuesser = false;
  @Input() currentDrawerPlayer: Player | undefined;
  @Input() previousPlayerDrawing: DrawStroke[] | undefined;
  @Input() isDrawingTurn = false;
  @Input() currentTurnPlayerName = '';
  @Input() totalDrawingTurns = 0;

  @Output() quit = new EventEmitter<void>();

  public isCardMinimized = false;
  public cardPosition: 'left' | 'right' = 'left';
  public cardZoomState: 'normal' | 'zoomed' = 'normal';

  public onQuit(): void {
    this.quit.emit();
  }

  public getTimerDashArray(): string {
    const timeLeft = this.roomState?.timeLeft ?? 0;
    const total = this.roomState?.settings?.drawTimeLimit ?? 60;
    const percentage = total > 0 ? (timeLeft / total) * 100 : 0;
    return `${percentage}, 100`;
  }
}
