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
import { DrawStroke, DrawPoint, RoomState } from '../../../models/game.model';
import { GameStateService } from '../../../services/game-state.service';
import { Subscription, Observable } from 'rxjs';
import { SoundService } from '../../../services/sound.service';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css',
})
export class CanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('drawingCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() bareCanvas = false;
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
  public currentColor = '#000000'; // Default black
  public currentWidth = 6;
  public currentOpacity = 1.0;
  public selectedTool: 'brush' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'picker' | 'bucket' = 'brush';

  public colors = [
    '#000000', '#555555', '#004de6',
    '#ffffff', '#c1c1c1', '#00ccff',
    '#006600', '#800000', '#663300',
    '#00cc00', '#ff0000', '#ff6600',
    '#808000', '#990066', '#cc9966',
    '#ffff00', '#ff00ff', '#ffcc99'
  ];

  public brushSizes = [
    { label: 'XS', value: 2 },
    { label: 'S', value: 6 },
    { label: 'M', value: 12 },
    { label: 'L', value: 24 },
    { label: 'XL', value: 48 }
  ];

  // Local drawing data (for undo/redo)
  private strokes: DrawStroke[] = [];
  private redoStack: DrawStroke[] = [];

  public roomState: RoomState | null = null;
  public isDoneDrawing = false;
  public loading$: Observable<boolean>;
  private lastRoundNumber = 0;
  private subscriptions: Subscription = new Subscription();

  // Internal logical canvas resolution (keeps drawing consistent across different screen sizes)
  private readonly internalWidth = 800;
  private readonly internalHeight = 500;

  constructor(private gameState: GameStateService, private soundService: SoundService) {
    this.loading$ = this.gameState.loading$;
  }

  public get myPlayerId(): string | null {
    return this.gameState.getMyPlayerId();
  }

  public maxTimeObserved = 60;

  public get timerPercentage(): number {
    if (!this.roomState || this.maxTimeObserved <= 0) return 100;
    return (this.roomState.timeLeft / this.maxTimeObserved) * 100;
  }

  public get opacityPercent(): number {
    return Math.round(this.currentOpacity * 100);
  }

  ngOnInit(): void {
    // Listen to roomState to display draw instruction
    this.subscriptions.add(
      this.gameState.roomState$.subscribe((state) => {
        this.roomState = state;
        if (state) {
          if (state.roundNumber !== this.lastRoundNumber) {
            this.lastRoundNumber = state.roundNumber;
            this.maxTimeObserved = state.timeLeft;
            this.isDoneDrawing = false; // Reset done state on new round
            this.strokes = []; // Clear canvas for new round
            this.redoStack = [];
            if (this.isCanvasInitialized) {
              this.clearLocalCanvas();
            }
          } else if (state.timeLeft > this.maxTimeObserved) {
            this.maxTimeObserved = state.timeLeft;
          }
        }
      })
    );

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

  public submitDone(): void {
    if (this.isDoneDrawing) return;
    this.isDoneDrawing = true;
    this.stopDrawing();
    this.gameState.submitDrawing(this.strokes);
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
    if (this.readOnly || this.isDoneDrawing) return;
    const coords = this.getCanvasCoords(event.clientX, event.clientY);
    this.startDrawing(coords);
  }

  public onMouseMove(event: MouseEvent): void {
    if (!this.drawing || this.readOnly || this.isDoneDrawing) return;
    const coords = this.getCanvasCoords(event.clientX, event.clientY);
    this.drawMove(coords);
  }

  public onMouseUp(): void {
    if (this.readOnly || this.isDoneDrawing) return;
    this.stopDrawing();
  }

  public onTouchStart(event: TouchEvent): void {
    if (this.readOnly || this.isDoneDrawing || event.touches.length === 0) return;
    event.preventDefault();
    const touch = event.touches[0];
    const coords = this.getCanvasCoords(touch.clientX, touch.clientY);
    this.startDrawing(coords);
  }

  public onTouchMove(event: TouchEvent): void {
    if (!this.drawing || this.readOnly || this.isDoneDrawing || event.touches.length === 0) return;
    event.preventDefault();
    const touch = event.touches[0];
    const coords = this.getCanvasCoords(touch.clientX, touch.clientY);
    this.drawMove(coords);
  }

  public onTouchEnd(): void {
    if (this.readOnly || this.isDoneDrawing) return;
    this.stopDrawing();
  }

  private startDrawing(point: DrawPoint): void {
    if (this.selectedTool === 'picker') {
      this.pickColorAtPoint(point);
      return;
    }

    if (this.selectedTool === 'bucket') {
      this.fillCanvasBackground();
      return;
    }

    this.drawing = true;
    this.soundService.playDrawStroke();
    // For freehand drawing, points list contains path. For shapes, points[0] is start, points[1] is end
    this.currentStroke = [point, point];
    this.redoStack = []; // Clear redo stack on new action
  }

  private drawMove(point: DrawPoint): void {
    if (this.currentStroke.length === 0) return;

    if (this.selectedTool === 'brush' || this.selectedTool === 'eraser') {
      const prevPoint = this.currentStroke[this.currentStroke.length - 1];
      this.currentStroke.push(point);

      this.ctx.beginPath();
      this.ctx.globalAlpha = this.currentOpacity;

      if (this.selectedTool === 'eraser') {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = this.currentWidth * 2;
      } else {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentWidth;
      }

      this.ctx.moveTo(prevPoint.x, prevPoint.y);
      this.ctx.lineTo(point.x, point.y);
      this.ctx.stroke();

      // Stream out realtime drawing strokes
      const stroke: DrawStroke = {
        points: this.currentStroke,
        color: this.currentColor,
        width: this.currentWidth,
        isEraser: this.selectedTool === 'eraser',
        shapeType: this.selectedTool as any,
        opacity: this.currentOpacity
      };
      this.gameState.sendStroke(stroke);
    } else {
      // Shape drawing preview
      this.currentStroke[1] = point;
      this.redrawAll();
      this.drawShapePreview(this.currentStroke[0], this.currentStroke[1], this.selectedTool);
    }
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
        shapeType: this.selectedTool as any,
        opacity: this.currentOpacity
      };
      this.strokes.push(stroke);
      this.gameState.sendStroke(stroke);
    }
    this.currentStroke = [];
    this.redrawAll();
  }

  private getCanvasCoords(clientX: number, clientY: number): DrawPoint {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const scaleX = this.internalWidth / rect.width;
    const scaleY = this.internalHeight / rect.height;

    return {
      x: Math.round(relativeX * scaleX),
      y: Math.round(relativeY * scaleY),
    };
  }

  private pickColorAtPoint(point: DrawPoint): void {
    try {
      const imgData = this.ctx.getImageData(point.x, point.y, 1, 1).data;
      const r = imgData[0];
      const g = imgData[1];
      const b = imgData[2];
      const a = imgData[3];

      if (a === 0) {
        this.currentColor = '#ffffff';
      } else {
        const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        this.currentColor = hex;
      }
      this.selectedTool = 'brush'; // switch back to brush after picking
    } catch (e) {
      console.error('Error picking color: ', e);
    }
  }

  private fillCanvasBackground(): void {
    // Fill background by adding a full canvas rectangle stroke
    const stroke: DrawStroke = {
      points: [{ x: 0, y: 0 }, { x: this.internalWidth, y: this.internalHeight }],
      color: this.currentColor,
      width: 0,
      shapeType: 'rectangle',
      opacity: this.currentOpacity
    };
    this.strokes.push(stroke);
    this.gameState.sendStroke(stroke);
    this.redrawAll();
    this.selectedTool = 'brush'; // switch back to brush
  }

  // --- DRAWING UTILITIES ---

  public setTool(tool: 'brush' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'picker' | 'bucket'): void {
    this.selectedTool = tool;
  }

  public selectColor(color: string): void {
    this.currentColor = color;
    if (this.selectedTool === 'eraser' || this.selectedTool === 'picker') {
      this.selectedTool = 'brush'; // automatically switch to brush
    }
  }

  public selectWidth(width: number): void {
    this.currentWidth = width;
  }

  public setOpacity(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentOpacity = parseFloat(input.value);
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
    this.gameState.clearCanvas();
    this.strokes.forEach((stroke) => {
      this.gameState.sendStroke(stroke);
    });
  }

  private renderStroke(stroke: DrawStroke, ctx: CanvasRenderingContext2D): void {
    if (!stroke || !stroke.points || stroke.points.length === 0) return;

    ctx.beginPath();
    const type = stroke.shapeType || (stroke.isEraser ? 'eraser' : 'brush');

    ctx.globalAlpha = stroke.opacity !== undefined ? stroke.opacity : 1.0;

    if (type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.width * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.fillStyle = stroke.color;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'brush' || type === 'eraser') {
      if (stroke.points.length === 1) {
        const p = stroke.points[0];
        ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
    } else if (type === 'line') {
      if (stroke.points.length >= 2) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
        ctx.stroke();
      }
    } else if (type === 'rectangle') {
      if (stroke.points.length >= 2) {
        const p1 = stroke.points[0];
        const p2 = stroke.points[1];
        // If width is 0, treat as filled rectangle (for background bucket fill)
        if (stroke.width === 0) {
          ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        } else {
          ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        }
      }
    } else if (type === 'circle') {
      if (stroke.points.length >= 2) {
        const p1 = stroke.points[0];
        const p2 = stroke.points[1];
        const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private redrawAll(): void {
    this.clearLocalCanvas();
    const listToDraw = this.readOnly ? this.externalStrokes : this.strokes;
    listToDraw.forEach((stroke) => {
      this.renderStroke(stroke, this.ctx);
    });
  }

  private drawShapePreview(p1: DrawPoint, p2: DrawPoint, type: string): void {
    this.ctx.beginPath();
    this.ctx.globalAlpha = this.currentOpacity;
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = this.currentWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (type === 'line') {
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    } else if (type === 'rectangle') {
      this.ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    } else if (type === 'circle') {
      const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      this.ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  // --- OBSERVER PLAYBACK ---

  private drawExternalStroke(stroke: DrawStroke): void {
    if (!this.ctx) return;
    this.renderStroke(stroke, this.ctx);
  }
}
