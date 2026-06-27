import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomState } from '../../../models/game.model';

@Component({
  selector: 'app-word-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './word-selection.component.html'
})
export class WordSelectionComponent {
  @Input() roomState: RoomState | null = null;
  @Input() wordChoices: string[] = [];
  @Input() isWordSelector = false;
  @Input() wordSelectorName = '';

  @Output() selectWordChoice = new EventEmitter<string>();
  @Output() confirmCustomWord = new EventEmitter<string>();

  public customWordInput = '';

  public onSelectWord(word: string): void {
    this.selectWordChoice.emit(word);
  }

  public onSubmitCustomWord(): void {
    const word = this.customWordInput.trim();
    if (!word) return;
    this.confirmCustomWord.emit(word);
    this.customWordInput = '';
  }

  public getTimerDashArray(): string {
    const timeLeft = this.roomState?.timeLeft ?? 0;
    const total = 20; // Word selection limit
    const percentage = (timeLeft / total) * 100;
    return `${percentage}, 100`;
  }
}
