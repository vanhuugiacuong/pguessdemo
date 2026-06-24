import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../services/game-state.service';
import { RoomState, Player, GamePhase } from '../../models/game.model';
import { Subscription } from 'rxjs';
import { CanvasComponent } from '../canvas/canvas.component';
import { ChatComponent } from '../chat/chat.component';
import { GalleryRevealComponent } from '../gallery-reveal/gallery-reveal.component';
import {
  LucidePlay,
  LucideVolume2,
  LucideVolumeX,
  LucideCopy,
  LucideQrCode,
  LucideArrowLeft
} from '@lucide/angular';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CanvasComponent,
    ChatComponent,
    GalleryRevealComponent,
    LucidePlay,
    LucideVolume2,
    LucideVolumeX,
    LucideCopy,
    LucideQrCode,
    LucideArrowLeft
  ],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.css',
})
export class GameBoardComponent implements OnInit, OnDestroy {
  public roomState: RoomState | null = null;
  private subscription!: Subscription;

  public activeSettingsTab: 'preset' | 'custom' = 'preset';
  public isMuted = false;

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

  public get myPlayerId(): string | null {
    return this.gameState.getMyPlayerId();
  }

  public get isUserDrawer(): boolean {
    if (!this.roomState) return false;
    const myId = this.myPlayerId;
    if (!myId) return false;
    if (this.roomState.guesserId) {
      // Mode B: User draws if they are NOT the guesser
      return this.roomState.guesserId !== myId;
    }
    // Mode A: User draws if they are the drawer
    return this.roomState.drawerId === myId;
  }

  public get isUserGuesser(): boolean {
    if (!this.roomState) return false;
    const myId = this.myPlayerId;
    if (!myId) return false;
    if (this.roomState.guesserId) {
      // Mode B: User guesses if they are the guesser
      return this.roomState.guesserId === myId;
    }
    // Mode A: User guesses if they are NOT the drawer
    return this.roomState.drawerId !== myId;
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

  public get playerSlots(): number[] {
    const limit = this.roomState?.settings?.maxPlayers || 10;
    return Array.from({ length: limit }, (_, i) => i);
  }

  public get isHost(): boolean {
    if (!this.roomState) return false;
    return this.roomState.hostId === this.myPlayerId;
  }

  // --- LOBBY ROOM SETTINGS ACTIONS ---

  public get selectedGameMode(): 'A' | 'B' {
    return this.roomState?.maxRounds === 3 ? 'B' : 'A';
  }

  public get currentBotCount(): number {
    if (!this.roomState) return 3;
    return this.roomState.players.filter(p => p.isBot).length;
  }

  public changeMode(mode: 'A' | 'B'): void {
    if (!this.isHost) return;
    this.gameState.updateRoomSettings({ mode });
  }

  public changeTimeLimit(limit: number): void {
    if (!this.isHost) return;
    this.gameState.updateRoomSettings({ drawTimeLimit: limit });
  }

  public changeMaxPlayers(limit: number): void {
    if (!this.isHost) return;
    this.gameState.updateRoomSettings({ maxPlayers: limit });
  }

  public changeBotCount(bots: number): void {
    if (!this.isHost) return;
    this.gameState.updateRoomSettings({ botCount: bots });
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  public copyInviteLink(): void {
    if (!this.roomState) return;
    const roomId = this.roomState.id || (this.roomState as any).roomId;
    const inviteUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      alert('Đã sao chép link mời: ' + inviteUrl);
    }).catch((err) => {
      console.error('Không thể sao chép link mời: ', err);
    });
  }

  public showQRCode(): void {
    alert('QR Code cho phòng: ' + this.roomState?.id);
  }

  // --- GAME ACTIONS ---

  public onStartGame(): void {
    if (!this.isHost) return;
    this.gameState.startGame();
  }

  public onQuit(): void {
    this.gameState.resetRoom();
  }
}
