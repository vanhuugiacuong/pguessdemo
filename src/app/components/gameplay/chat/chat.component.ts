import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../../services/game-state.service';
import { ChatMessage, Player, RoomState } from '../../../models/game.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatScrollContainer') private chatContainer!: ElementRef;

  public messages: ChatMessage[] = [];
  public currentGuess = '';
  public players: Player[] = [];
  public currentRoom: RoomState | null = null;
  private subscription!: Subscription;
  private roomStateSubscription!: Subscription;
  private shouldScroll = true;

  constructor(private gameState: GameStateService) {}

  ngOnInit(): void {
    this.subscription = this.gameState.chatMessages$.subscribe((msgs) => {
      this.messages = msgs;
      this.shouldScroll = true;
    });

    this.roomStateSubscription = this.gameState.roomState$.subscribe((state) => {
      if (state) {
        this.players = state.players;
        this.currentRoom = state;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.roomStateSubscription) {
      this.roomStateSubscription.unsubscribe();
    }
  }

  public get myPlayerId(): string | null {
    return this.gameState.getMyPlayerId();
  }

  public get hasGuessedCorrectly(): boolean {
    const myId = this.myPlayerId;
    if (!myId) return false;
    const me = this.players.find((p) => p.id === myId);
    return me?.hasGuessedCorrectly || false;
  }

  public get isDrawer(): boolean {
    const myId = this.myPlayerId;
    if (!myId || !this.currentRoom) return false;
    return this.currentRoom.drawerId === myId;
  }

  public get isTimeUp(): boolean {
    if (!this.currentRoom) return false;
    return this.currentRoom.timeLeft <= 0;
  }

  public getPlayerAvatar(playerId: string): string {
    const player = this.players.find((p) => p.id === playerId);
    return player?.avatar || '2.svg';
  }

  public onSend(): void {
    const text = this.currentGuess.trim();
    if (!text) return;

    this.gameState.submitGuess(text);
    this.currentGuess = '';
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch (err) {}
  }
}
