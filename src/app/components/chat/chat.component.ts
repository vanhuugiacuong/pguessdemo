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
import { GameStateService } from '../../services/game-state.service';
import { ChatMessage } from '../../models/game.model';
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
  private subscription!: Subscription;
  private shouldScroll = true;

  constructor(private gameState: GameStateService) {}

  ngOnInit(): void {
    this.subscription = this.gameState.chatMessages$.subscribe((msgs) => {
      this.messages = msgs;
      this.shouldScroll = true;
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
