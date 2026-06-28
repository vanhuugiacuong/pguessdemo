import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomState } from '../../../models/game.model';
import {
  LucidePlay,
  LucideVolume2,
  LucideVolumeX,
  LucideCopy,
  LucideArrowLeft
} from '@lucide/angular';

@Component({
  selector: 'app-room-lobby',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucidePlay,
    LucideVolume2,
    LucideVolumeX,
    LucideCopy,
    LucideArrowLeft
  ],
  templateUrl: './room-lobby.component.html'
})
export class RoomLobbyComponent {
  @Input() roomState: RoomState | null = null;
  @Input() myPlayerId: string | null = null;
  @Input() loading = false;
  @Input() isHost = false;
  @Input() selectedGameMode: 'A' | 'B' = 'A';
  @Input() currentBotCount = 0;
  @Input() playerSlots: number[] = [];

  @Output() changeMode = new EventEmitter<'A' | 'B'>();
  @Output() changeTimeLimit = new EventEmitter<number>();
  @Output() changeMaxPlayers = new EventEmitter<number>();
  @Output() changeBotCount = new EventEmitter<number>();
  @Output() startGame = new EventEmitter<void>();
  @Output() quit = new EventEmitter<void>();
  @Output() copyInviteLink = new EventEmitter<void>();
  @Output() copyRoomId = new EventEmitter<void>();

  public activeSettingsTab: 'preset' | 'custom' = 'preset';
  public isMuted = false;

  public changeModeAction(mode: 'A' | 'B'): void {
    this.changeMode.emit(mode);
  }

  public changeTimeLimitAction(limit: number): void {
    this.changeTimeLimit.emit(limit);
  }

  public changeMaxPlayersAction(limit: number): void {
    this.changeMaxPlayers.emit(limit);
  }

  public changeBotCountAction(bots: number): void {
    this.changeBotCount.emit(bots);
  }

  public onStartGame(): void {
    this.startGame.emit();
  }

  public onQuit(): void {
    this.quit.emit();
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  public copyInviteLinkAction(): void {
    this.copyInviteLink.emit();
  }

  public copyRoomIdAction(): void {
    this.copyRoomId.emit();
  }
}
