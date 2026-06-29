import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameStateService } from './services/game-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private roomSubscription!: Subscription;
  public currentGradient = 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)';

  constructor(private gameState: GameStateService) {}

  ngOnInit(): void {
    this.roomSubscription = this.gameState.roomState$.subscribe((state) => {
      if (!state) {
        // Home screen
        this.currentGradient = 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)';
        return;
      }

      switch (state.phase) {
        case 'LOBBY':
          // Room Lobby
          this.currentGradient = 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)';
          break;
        case 'WORD_SELECTION':
          // Word selection: Capture 2 orange-to-pink
          this.currentGradient = 'linear-gradient(135deg, #e55c6e 0%, #f28243 100%)';
          break;
        case 'PLAYING':
          // Check if active drawer
          const myId = this.gameState.getMyPlayerId();
          const isDrawer = state.drawerId && myId === state.drawerId;
          if (isDrawer) {
            // Concentration deep rose/red
            this.currentGradient = 'linear-gradient(135deg, #f05469 0%, #aa2338 100%)';
          } else {
            // Guessing/Spectating: Cool blue-cyan
            this.currentGradient = 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)';
          }
          break;
        case 'REVEAL':
          // Album reveal: Teal/green
          this.currentGradient = 'linear-gradient(135deg, #0d9488 0%, #059669 100%)';
          break;
        case 'GAME_OVER':
          // Celebratory golden/rose
          this.currentGradient = 'linear-gradient(135deg, #db2777 0%, #e11d48 50%, #f59e0b 100%)';
          break;
        default:
          this.currentGradient = 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
    }
  }

  public getBackgroundStyle() {
    return {
      'background': `url('/assets/textura.png') no-repeat center / cover fixed, ${this.currentGradient}`
    };
  }
}
