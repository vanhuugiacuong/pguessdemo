import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucidePencil,
  LucideEraser,
  LucideSquare,
  LucideCircle,
  LucideSlash,
  LucidePipette,
  LucidePaintBucket,
  LucideTrash2,
  LucideUndo,
  LucideRedo,
  LucidePlay,
  LucideRefreshCw,
  LucideChevronLeft,
  LucideChevronRight,
  LucideMusic,
  LucideVideo,
  LucideMessageSquare,
  LucideCamera,
  LucideArrowLeft,
  LucideVolume2,
  LucideVolumeX,
  LucideCopy,
  LucideSettings,
  LucideBot,
  LucideUser,
  LucideCrown,
} from '@lucide/angular';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [
    CommonModule,
    LucidePencil,
    LucideEraser,
    LucideSquare,
    LucideCircle,
    LucideSlash,
    LucidePipette,
    LucidePaintBucket,
    LucideTrash2,
    LucideUndo,
    LucideRedo,
    LucidePlay,
    LucideRefreshCw,
    LucideChevronLeft,
    LucideChevronRight,
    LucideMusic,
    LucideVideo,
    LucideMessageSquare,
    LucideCamera,
    LucideArrowLeft,
    LucideVolume2,
    LucideVolumeX,
    LucideCopy,
    LucideSettings,
    LucideBot,
    LucideUser,
    LucideCrown,
  ],
  template: `
    @switch (name) {
      @case ('pencil') {
        <svg lucidePencil [class]="class"></svg>
      }
      @case ('eraser') {
        <svg lucideEraser [class]="class"></svg>
      }
      @case ('square') {
        <svg lucideSquare [class]="class"></svg>
      }
      @case ('circle') {
        <svg lucideCircle [class]="class"></svg>
      }
      @case ('slash') {
        <svg lucideSlash [class]="class"></svg>
      }
      @case ('pipette') {
        <svg lucidePipette [class]="class"></svg>
      }
      @case ('paintBucket') {
        <svg lucidePaintBucket [class]="class"></svg>
      }
      @case ('trash2') {
        <svg lucideTrash2 [class]="class"></svg>
      }
      @case ('undo') {
        <svg lucideUndo [class]="class"></svg>
      }
      @case ('redo') {
        <svg lucideRedo [class]="class"></svg>
      }
      @case ('play') {
        <svg lucidePlay [class]="class"></svg>
      }
      @case ('refreshCw') {
        <svg lucideRefreshCw [class]="class"></svg>
      }
      @case ('chevronLeft') {
        <svg lucideChevronLeft [class]="class"></svg>
      }
      @case ('chevronRight') {
        <svg lucideChevronRight [class]="class"></svg>
      }
      @case ('music') {
        <svg lucideMusic [class]="class"></svg>
      }
      @case ('video') {
        <svg lucideVideo [class]="class"></svg>
      }
      @case ('messageSquare') {
        <svg lucideMessageSquare [class]="class"></svg>
      }
      @case ('camera') {
        <svg lucideCamera [class]="class"></svg>
      }
      @case ('arrowLeft') {
        <svg lucideArrowLeft [class]="class"></svg>
      }
      @case ('volume2') {
        <svg lucideVolume2 [class]="class"></svg>
      }
      @case ('volumeX') {
        <svg lucideVolumeX [class]="class"></svg>
      }
      @case ('copy') {
        <svg lucideCopy [class]="class"></svg>
      }
      @case ('settings') {
        <svg lucideSettings [class]="class"></svg>
      }
      @case ('bot') {
        <svg lucideBot [class]="class"></svg>
      }
      @case ('user') {
        <svg lucideUser [class]="class"></svg>
      }
      @case ('crown') {
        <svg lucideCrown [class]="class"></svg>
      }
    }
  `,
  styles: [
    `
      :host {
        display: inline-block;
        line-height: 0;
      }
    `,
  ],
})
export class IconComponent {
  @Input() name!: string;
  @Input() class = '';
}
