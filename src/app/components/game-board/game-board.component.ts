import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { RoomState, Player, GamePhase } from '../../models/game.model';
import { Subscription } from 'rxjs';
import { CanvasComponent } from '../canvas/canvas.component';
import { ChatComponent } from '../chat/chat.component';
import { GalleryRevealComponent } from '../gallery-reveal/gallery-reveal.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, CanvasComponent, ChatComponent, GalleryRevealComponent],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.css',
})
export class GameBoardComponent implements OnInit, OnDestroy {
  public roomState: RoomState | null = null;
  private subscription!: Subscription;

  constructor(private gameState: GameStateService) {}

  ngOnInit(): void {
    this.subscription = this.gameState.roomState$.subscribe((state) => {
      this.roomState = state;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public get isLobby(): boolean {
    return this.roomState?.phase === 'LOBBY';
  }

  public get isPlaying(): boolean {
    return this.roomState?.phase === 'PLAYING';
  }

  public get isReveal(): boolean {
    return this.roomState?.phase === 'REVEAL';
  }

  public get isGameOver(): boolean {
    return this.roomState?.phase === 'GAME_OVER';
  }

  public get isUserDrawer(): boolean {
    if (!this.roomState) return false;
    if (this.roomState.guesserId) {
      // Mode B: User draws if they are NOT the guesser
      return this.roomState.guesserId !== 'player-1';
    }
    // Mode A: User draws if they are the drawer
    return this.roomState.drawerId === 'player-1';
  }

  public get isUserGuesser(): boolean {
    if (!this.roomState) return false;
    if (this.roomState.guesserId) {
      // Mode B: User guesses if they are the guesser
      return this.roomState.guesserId === 'player-1';
    }
    // Mode A: User guesses if they are NOT the drawer
    return this.roomState.drawerId !== 'player-1';
  }

  public get currentDrawerPlayer(): Player | undefined {
    const state = this.roomState;
    if (!state) return undefined;
    return state.players.find((p) => p.id === state.drawerId);
  }

  public get activeGuesser(): Player | undefined {
    const state = this.roomState;
    if (!state) return undefined;
    return state.players.find((p) => p.id === state.guesserId);
  }

  public get drawingPlayers(): Player[] {
    const state = this.roomState;
    if (!state) return [];
    return state.players.filter((p) => p.id !== state.guesserId);
  }

  public get sortedPlayers(): Player[] {
    const state = this.roomState;
    if (!state) return [];
    return [...state.players].sort((a, b) => b.score - a.score);
  }

  public onStartGame(): void {
    this.gameState.startGame();
  }

  public onQuit(): void {
    this.gameState.resetRoom();
  }
}
