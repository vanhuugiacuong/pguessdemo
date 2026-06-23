import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawStroke, DrawPoint } from '../../models/game.model';
import { GameStateService } from '../../services/game-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css',
})
export class CanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('drawingCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() readOnly = false;
  @Input() streamRealTime = false; // Subscribe to real-time mock drawing events
  @Input() set externalStrokes(strokes: DrawStroke[] | undefined) {
    this._externalStrokes = strokes || [];
    if (this.isCanvasInitialized) {
      this.redrawAll();
    }
  }
  get externalStrokes(): DrawStroke[] {
    return this._externalStrokes;
  }

  private _externalStrokes: DrawStroke[] = [];
  private isCanvasInitialized = false;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private currentStroke: DrawPoint[] = [];

  // Brush settings
  public currentColor = '#1f2937'; // Default dark gray
  public currentWidth = 6;
  public selectedTool: 'brush' | 'eraser' = 'brush';

  public colors = [
    '#1f2937', // Dark Gray
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#78350f', // Brown
    '#9ca3af', // Light Gray
  ];

  public brushSizes = [
    { label: 'S', value: 3 },
    { label: 'M', value: 6 },
    { label: 'L', value: 12 },
    { label: 'XL', value: 24 },
  ];

  // Local drawing data (for undo/redo)
  private strokes: DrawStroke[] = [];
  private redoStack: DrawStroke[] = [];

  private subscriptions: Subscription = new Subscription();

  // Internal logical canvas resolution (keeps drawing consistent across different screen sizes)
  private readonly internalWidth = 800;
  private readonly internalHeight = 500;

  constructor(private gameState: GameStateService) {}

  ngOnInit(): void {
    if (this.readOnly && this.streamRealTime) {
      // Listen to real-time streams
      this.subscriptions.add(
        this.gameState.drawingStream$.subscribe((stroke) => {
          this.drawExternalStroke(stroke);
        }),
      );

      this.subscriptions.add(
        this.gameState.clearDrawingEvent$.subscribe(() => {
          this.clearLocalCanvas();
        }),
      );
    }
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.internalWidth;
    canvas.height = this.internalHeight;
    this.ctx = canvas.getContext('2d')!;
    this.setupContext();
    this.isCanvasInitialized = true;

    // Draw static strokes if any
    if (this.readOnly && this.externalStrokes.length > 0) {
      this.redrawAll();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupContext(): void {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  // --- DRAWING LOGIC ---

  public onMouseDown(event: MouseEvent): void {
    if (this.readOnly) return;
    this.startDrawing(this.getCanvasCoords(event.clientX, event.clientY));
  }

  public onMouseMove(event: MouseEvent): void {
    if (!this.drawing || this.readOnly) return;
    this.drawMove(this.getCanvasCoords(event.clientX, event.clientY));
  }

  public onMouseUp(): void {
    if (this.readOnly) return;
    this.stopDrawing();
  }

  public onTouchStart(event: TouchEvent): void {
    if (this.readOnly || event.touches.length === 0) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.startDrawing(this.getCanvasCoords(touch.clientX, touch.clientY));
  }

  public onTouchMove(event: TouchEvent): void {
    if (!this.drawing || this.readOnly || event.touches.length === 0) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.drawMove(this.getCanvasCoords(touch.clientX, touch.clientY));
  }

  public onTouchEnd(): void {
    if (this.readOnly) return;
    this.stopDrawing();
  }

  private startDrawing(point: DrawPoint): void {
    this.drawing = true;
    this.currentStroke = [point];
    this.redoStack = []; // Clear redo stack on new action

    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);

    // Apply tools
    if (this.selectedTool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.lineWidth = this.currentWidth * 2; // eraser is thicker
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.currentWidth;
    }
  }

  private drawMove(point: DrawPoint): void {
    if (this.currentStroke.length === 0) return;

    const prevPoint = this.currentStroke[this.currentStroke.length - 1];
    this.currentStroke.push(point);

    this.ctx.beginPath();
    this.ctx.moveTo(prevPoint.x, prevPoint.y);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();

    // Stream out realtime drawing strokes
    const stroke: DrawStroke = {
      points: this.currentStroke,
      color: this.currentColor,
      width: this.currentWidth,
      isEraser: this.selectedTool === 'eraser',
    };
    this.gameState.sendStroke(stroke);
  }

  private stopDrawing(): void {
    if (!this.drawing) return;
    this.drawing = false;

    if (this.currentStroke.length > 0) {
      const stroke: DrawStroke = {
        points: [...this.currentStroke],
        color: this.currentColor,
        width: this.currentWidth,
        isEraser: this.selectedTool === 'eraser',
      };
      this.strokes.push(stroke);
      this.gameState.sendStroke(stroke);
    }
    this.currentStroke = [];
  }

  private getCanvasCoords(clientX: number, clientY: number): DrawPoint {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Translate client coordinates relative to canvas bounding box
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // Scale coordinates to internal standard coordinates (800x500)
    const scaleX = this.internalWidth / rect.width;
    const scaleY = this.internalHeight / rect.height;

    return {
      x: Math.round(relativeX * scaleX),
      y: Math.round(relativeY * scaleY),
    };
  }

  // --- DRAWING UTILITIES ---

  public setTool(tool: 'brush' | 'eraser'): void {
    this.selectedTool = tool;
  }

  public selectColor(color: string): void {
    this.currentColor = color;
    this.selectedTool = 'brush'; // automatically switch to brush
  }

  public selectWidth(width: number): void {
    this.currentWidth = width;
  }

  public undo(): void {
    if (this.strokes.length === 0) return;
    const undone = this.strokes.pop()!;
    this.redoStack.push(undone);
    this.redrawAll();
    this.syncStrokesToGameState();
  }

  public redo(): void {
    if (this.redoStack.length === 0) return;
    const redone = this.redoStack.pop()!;
    this.strokes.push(redone);
    this.redrawAll();
    this.syncStrokesToGameState();
  }

  public clearCanvas(): void {
    this.strokes = [];
    this.redoStack = [];
    this.clearLocalCanvas();
    this.gameState.clearCanvas();
  }

  private clearLocalCanvas(): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.internalWidth, this.internalHeight);
  }

  private syncStrokesToGameState(): void {
    // Overwrite backend canvas state with local updates (for client sync)
    this.gameState.clearCanvas();
    this.strokes.forEach((stroke) => {
      this.gameState.sendStroke(stroke);
    });
  }

  private redrawAll(): void {
    this.clearLocalCanvas();
    const listToDraw = this.readOnly ? this.externalStrokes : this.strokes;

    listToDraw.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      this.ctx.beginPath();
      this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      if (stroke.isEraser) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = stroke.width * 2;
      } else {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = stroke.color;
        this.ctx.lineWidth = stroke.width;
      }

      for (let i = 1; i < stroke.points.length; i++) {
        this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      this.ctx.stroke();
    });
  }

  // --- OBSERVER PLAYBACK ---

  private drawExternalStroke(stroke: DrawStroke): void {
    if (!this.ctx) return;
    if (stroke.points.length === 0) return;

    // Direct draw segment by segment
    this.ctx.beginPath();

    if (stroke.isEraser) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.lineWidth = stroke.width * 2;
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.width;
    }

    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      this.ctx.arc(p.x, p.y, this.ctx.lineWidth / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = stroke.isEraser ? 'transparent' : stroke.color;
      this.ctx.fill();
    } else {
      const start = stroke.points[stroke.points.length - 2];
      const end = stroke.points[stroke.points.length - 1];
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.stroke();
    }
  }
}
