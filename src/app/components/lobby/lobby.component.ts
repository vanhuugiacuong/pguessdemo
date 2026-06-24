import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { GameSettings, GameMode } from '../../models/game.model';
import {
  LucidePlay,
  LucideRefreshCw,
  LucideChevronLeft,
  LucideChevronRight,
  LucideMusic,
  LucideVideo,
  LucideMessageSquare,
  LucideCamera,
} from '@lucide/angular';

interface CarouselStep {
  image: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucidePlay,
    LucideRefreshCw,
    LucideChevronLeft,
    LucideChevronRight,
    LucideMusic,
    LucideVideo,
    LucideMessageSquare,
    LucideCamera,
  ],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.css',
})
export class LobbyComponent implements OnInit {
  public nickname = '';
  public selectedMode: GameMode = 'A';
  public botCount = 3;
  public drawTimeLimit = 60;
  public wordCategory = 'General';
  public roomIdToJoin = '';
  public isDirectJoin = false;

  // Avatars list from assets
  public avatars: string[] = ['2.svg', '30.svg', '33.svg', '34.svg', '39.svg', '52.svg', '58.svg'];
  public currentAvatar = '2.svg';

  // Carousel steps matching ilust_png illustrations
  public carouselSteps: CarouselStep[] = [
    {
      image: '1.png',
      title: '1. ĐẶT ĐỀ BÀI',
      desc: 'Mỗi người chơi viết ra một câu đề bài kỳ quặc hoặc hài hước.',
    },
    {
      image: '2.png',
      title: '2. ĐẾN GIỜ VẼ',
      desc: 'Mỗi người chơi phải vẽ một bức tranh mô tả câu đề bài nhận được.',
    },
    {
      image: '3.png',
      title: '3. ĐOÁN XEM',
      desc: 'Bạn sẽ nhìn bức tranh của người khác và đoán xem họ vẽ từ khóa gì.',
    },
    {
      image: '4.png',
      title: '4. VẼ TIẾP',
      desc: 'Vẽ mô tả lại từ khóa phán đoán mà người chơi trước viết ra.',
    },
    {
      image: '5.png',
      title: '5. LẠI ĐOÁN',
      desc: 'Tiếp tục chuỗi phán đoán từ nét vẽ của người chơi tiếp theo.',
    },
    {
      image: '6.png',
      title: '6. ĐỪNG DỪNG LẠI',
      desc: 'Mọi người thay phiên vẽ và đoán cho đến khi hoàn thành chuỗi.',
    },
    {
      image: '7.png',
      title: '7. BẤT NGỜ CHƯA',
      desc: 'Xem lại kết quả biến đổi của các câu đề bài ban đầu.',
    },
    {
      image: '8.png',
      title: '8. VUI VẺ LÀ CHÍNH',
      desc: 'Cười thả ga cùng bạn bè với những kết quả cực kỳ khó đỡ!',
    },
  ];
  public activeCarouselIndex = 1; // Default to step 2

  constructor(
    private gameState: GameStateService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const funnyNames = [
      'GamerPro',
      'DoodleKing',
      'NeoPainter',
      'CuongDzai',
    ];
    this.nickname = funnyNames[Math.floor(Math.random() * funnyNames.length)];
    this.randomizeAvatar();

    this.route.queryParams.subscribe((params) => {
      if (params['room']) {
        this.roomIdToJoin = params['room'];
      }
    });

    this.route.params.subscribe((params) => {
      if (params['roomId']) {
        this.roomIdToJoin = params['roomId'];
        this.isDirectJoin = true;
      }
    });

    if (this.route.parent) {
      this.route.parent.params.subscribe((params) => {
        if (params['roomId']) {
          this.roomIdToJoin = params['roomId'];
          this.isDirectJoin = true;
        }
      });
    }
  }

  public randomizeAvatar(): void {
    const available = this.avatars.filter((a) => a !== this.currentAvatar);
    this.currentAvatar = available[Math.floor(Math.random() * available.length)];
  }

  public selectAvatar(avatar: string): void {
    this.currentAvatar = avatar;
  }

  public prevCarousel(): void {
    this.activeCarouselIndex =
      (this.activeCarouselIndex - 1 + this.carouselSteps.length) % this.carouselSteps.length;
  }

  public nextCarousel(): void {
    this.activeCarouselIndex = (this.activeCarouselIndex + 1) % this.carouselSteps.length;
  }

  public onCreateRoom(): void {
    const settings: GameSettings = {
      mode: this.selectedMode,
      drawTimeLimit: this.drawTimeLimit,
      revealTimeLimit: 10,
      botCount: this.botCount,
      wordCategory: this.wordCategory,
    };

    this.gameState.createRoom(this.nickname, this.currentAvatar, settings);
  }

  public onJoinRoom(): void {
    if (!this.roomIdToJoin.trim()) {
      alert('Vui lòng nhập Mã phòng!');
      return;
    }
    this.gameState.joinRoom(this.roomIdToJoin.trim(), this.nickname, this.currentAvatar);
  }
}
