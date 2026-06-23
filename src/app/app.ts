import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from './services/game-state.service';
import { LobbyComponent } from './components/lobby/lobby.component';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { RoomState } from './models/game.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LobbyComponent, GameBoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  public roomState$!: Observable<RoomState | null>;

  constructor(private gameState: GameStateService) {}

  ngOnInit(): void {
    this.roomState$ = this.gameState.roomState$;
  }
}
