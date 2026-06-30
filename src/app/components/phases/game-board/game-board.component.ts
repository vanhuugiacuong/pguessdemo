import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../services/game-state.service';
import { SoundService } from '../../../services/sound.service';
import { RoomState, Player, DrawStroke } from '../../../models/game.model';
import { Subscription, Observable } from 'rxjs';
import { RoomLobbyComponent } from '../room-lobby/room-lobby.component';
import { WordSelectionComponent } from '../word-selection/word-selection.component';
import { GamePlayingComponent } from '../game-playing/game-playing.component';
import { GameRevealComponent } from '../game-reveal/game-reveal.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule,
    RoomLobbyComponent,
    WordSelectionComponent,
    GamePlayingComponent,
    GameRevealComponent
  ],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.css',
})
export class GameBoardComponent implements OnInit, OnDestroy {
  public roomState: RoomState | null = null;
  public loading$: Observable<boolean>;
  public showRoundIntro = false;
  public isTransitioning = false;
  private subscription!: Subscription;

  public activeSettingsTab: 'preset' | 'custom' = 'preset';
  public isCardMinimized = false;
  public cardPosition: 'left' | 'right' = 'left';
  public cardZoomState: 'normal' | 'zoomed' = 'normal';

  public wordChoices: string[] = [];
  public currentRevealChainIndex = 0;

  constructor(private gameState: GameStateService, public soundService: SoundService) {
    this.loading$ = this.gameState.loading$;
  }

  ngOnInit(): void {
    let previousPhase: string | null = null;
    this.subscription = this.gameState.roomState$.subscribe((state) => {
      if (state) {
        console.log(`[GameBoard] State updated: phase=${state.phase}, round=${state.roundNumber}, drawer=${state.drawerId}, guesser=${state.guesserId}, prevPhase=${previousPhase}`);
        if (previousPhase && previousPhase !== state.phase) {
          console.log(`[GameBoard] Phase transitioned: ${previousPhase} -> ${state.phase}`);
          if (state.phase === 'WORD_SELECTION') {
            this.showRoundIntro = true;
            setTimeout(() => {
              this.showRoundIntro = false;
              console.log(`[GameBoard] showRoundIntro reset to false`);
            }, 2500);
          } else {
            this.isTransitioning = true;
            console.log(`[GameBoard] isTransitioning set to true`);
            setTimeout(() => {
              this.isTransitioning = false;
              console.log(`[GameBoard] isTransitioning reset to false`);
            }, 1000);
          }
        }
        previousPhase = state.phase;
      } else {
        previousPhase = null;
      }

      this.roomState = state;
      if (state) {
        if (state.phase === 'REVEAL') {
          const N = state.players.length;
          this.currentRevealChainIndex = Math.floor(((state.roundNumber || 1) - 1) / N);
        }
      }
      if (state && state.phase === 'WORD_SELECTION') {
        if (this.isWordSelector && this.wordChoices.length === 0) {
          const wordBank = this.gameState.getWordBank(state.settings?.wordCategory, state.settings?.customWordBank) || [];
          if (wordBank.length > 0) {
            const shuffled = [...wordBank].sort(() => 0.5 - Math.random());
            this.wordChoices = shuffled.slice(0, 3);
          } else {
            this.wordChoices = ['Trái táo', 'Ngôi nhà', 'Con mèo'];
          }
        }
      } else {
        this.wordChoices = [];
      }
    });
  }

  public get isWordSelector(): boolean {
    const state = this.roomState;
    if (!state) return false;
    const mode = state.settings?.mode || 'A';
    if (mode === 'A') {
      return state.drawerId === this.myPlayerId;
    } else {
      const N = state.players.length;
      const r = ((state.roundNumber || 1) - 1) % N + 1;
      return r === 1 && state.drawerId === this.myPlayerId;
    }
  }

  public get wordSelectorName(): string {
    const state = this.roomState;
    if (!state) return '';
    const mode = state.settings?.mode || 'A';
    if (mode === 'A') {
      const drawer = state.players.find((p) => p.id === state.drawerId);
      return drawer ? drawer.name : 'Họa sĩ';
    } else {
      const drawer = state.players.find((p) => p.id === state.drawerId);
      return drawer ? drawer.name : 'Họa sĩ';
    }
  }

  public onSelectWordChoice(word: string): void {
    this.gameState.selectWord(word);
  }

  public onConfirmCustomWord(word: string): void {
    this.gameState.selectWord(word);
  }

  public selectRevealChain(index: number): void {
    this.currentRevealChainIndex = index;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public get isLobby(): boolean {
    return this.roomState?.phase === 'LOBBY';
  }

  public get isWordSelection(): boolean {
    return this.roomState?.phase === 'WORD_SELECTION';
  }

  public get isPlaying(): boolean {
    return this.roomState?.phase === 'PLAYING';
  }

  public get isReveal(): boolean {
    return this.roomState?.phase === 'REVEAL' || this.roomState?.phase === 'GAME_OVER';
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
    // Both Mode A and B: User draws if they are designated as the active drawer
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

  public get previousPlayerDrawing(): DrawStroke[] | undefined {
    if (!this.roomState || !this.roomState.roundNumber || !this.roomState.modeBChains) return undefined;
    const mode = this.roomState.settings?.mode || 'A';
    if (mode === 'A') return undefined;

    const N = this.roomState.players.length;
    const k = Math.floor((this.roomState.roundNumber - 1) / N);
    const chain = this.roomState.modeBChains[k];
    if (!chain) return undefined;

    const drawingSteps = chain.steps.filter((s) => s.type === 'drawing');
    if (drawingSteps.length === 0) return undefined;
    return drawingSteps[drawingSteps.length - 1].content;
  }

  public get isDrawingTurn(): boolean {
    if (!this.roomState) return false;
    const mode = this.roomState.settings?.mode || 'A';
    if (mode === 'A') {
      return true;
    } else {
      const N = this.roomState.players.length;
      const r = ((this.roomState.roundNumber || 1) - 1) % N + 1;
      return r < N;
    }
  }

  public get currentChainRound(): number {
    if (!this.roomState) return 1;
    const N = this.roomState.players.length;
    return ((this.roomState.roundNumber || 1) - 1) % N + 1;
  }

  public get currentTurnPlayerName(): string {
    if (!this.roomState) return '';
    return this.roomState.players.find(p => p.id === this.roomState?.drawerId)?.name || '';
  }

  public get totalDrawingTurns(): number {
    if (!this.roomState) return 0;
    return this.roomState.players.length - 1;
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

  public get albumSteps(): any[] {
    if (!this.roomState) return [];

    const mode = this.roomState.settings?.mode || 'A';
    if (mode === 'A') {
      return [];
    }

    if (!this.roomState.modeBChains || this.roomState.modeBChains.length === 0) {
      return [];
    }

    const idx = Math.min(this.currentRevealChainIndex, this.roomState.modeBChains.length - 1);
    const chain = this.roomState.modeBChains[idx];
    return chain ? chain.steps : [];
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
    return this.roomState?.settings?.mode || 'A';
  }

  public get currentBotCount(): number {
    if (!this.roomState) return 3;
    return this.roomState.players.filter(p => p.isBot).length;
  }

  public get selectedWordCategory(): string {
    return this.roomState?.settings?.wordCategory || 'general';
  }

  public get customWordBankText(): string {
    return this.roomState?.settings?.customWordBank?.join(', ') || '';
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

  public changeWordCategory(category: string): void {
    if (!this.isHost) return;
    this.gameState.updateRoomSettings({ wordCategory: category });
  }

  public changeCustomWordBank(value: string): void {
    if (!this.isHost) return;
    const customWordBank = value
      .split(',')
      .map((word) => word.trim())
      .filter((word) => word.length > 0);

    this.gameState.updateRoomSettings({
      customWordBank,
    });
  }

  public toggleMute(): void {
    this.soundService.toggleMute();
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

  public copyRoomId(): void {
    if (!this.roomState) return;
    const roomId = this.roomState.id || (this.roomState as any).roomId;
    navigator.clipboard.writeText(roomId).then(() => {
      alert('Đã sao chép mã phòng: ' + roomId);
    }).catch((err) => {
      console.error('Không thể sao chép mã phòng: ', err);
    });
  }

  public getTimerDashArray(): string {
    const timeLeft = this.roomState?.timeLeft ?? 0;
    const total = this.roomState?.settings?.drawTimeLimit ?? 60;
    const percentage = total > 0 ? (timeLeft / total) * 100 : 0;
    return `${percentage}, 100`;
  }

  // --- GAME ACTIONS ---

  public onStartGame(): void {
    if (!this.isHost) return;
    const mode = this.roomState?.settings?.mode || 'A';
    const playersCount = this.roomState?.players?.length || 0;
    const minPlayers = mode === 'B' ? 3 : 2;
    if (playersCount < minPlayers) {
      alert(`Chế độ Phá băng yêu cầu tối thiểu ${minPlayers} người chơi để bắt đầu!`);
      return;
    }
    this.gameState.startGame();
  }

  public onQuit(): void {
    this.gameState.resetRoom();
  }
}
