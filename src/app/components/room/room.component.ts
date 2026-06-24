import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { LobbyComponent } from '../lobby/lobby.component';
import { GameBoardComponent } from '../game-board/game-board.component';

@Component({
  selector: 'app-room-container',
  standalone: true,
  imports: [CommonModule, LobbyComponent, GameBoardComponent],
  template: `
    <div class="min-h-screen bg-transparent flex flex-col justify-center items-center w-full">
      <ng-container *ngIf="(roomState$ | async) as state; else showLobby">
        <app-game-board class="w-full min-h-screen"></app-game-board>
      </ng-container>
      <ng-template #showLobby>
        <app-lobby class="w-full p-4"></app-lobby>
      </ng-template>
    </div>
  `
})
export class RoomComponent implements OnInit, OnDestroy {
  public get roomState$() {
    return this.gameState.roomState$;
  }

  constructor(private gameState: GameStateService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    // Tự động giải phóng trạng thái phòng khi rời khỏi route phòng này
    this.gameState.resetRoom();
  }
}
