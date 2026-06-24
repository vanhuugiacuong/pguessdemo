import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { RoomState, GameSettings, ChatMessage, DrawStroke } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private roomStateSubject = new BehaviorSubject<RoomState | null>(null);
  public roomState$ = this.roomStateSubject.asObservable();

  private chatMessagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public chatMessages$ = this.chatMessagesSubject.asObservable();

  private drawingStreamSubject = new Subject<DrawStroke>();
  public drawingStream$ = this.drawingStreamSubject.asObservable();

  private clearDrawingSubject = new Subject<void>();
  public clearDrawingEvent$ = this.clearDrawingSubject.asObservable();

  constructor() {
    // Khởi tạo kết nối tới server NestJS ở cổng 3000 nhưng không tự động kết nối
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: false
    });

    // Lắng nghe sự kiện room_state_updated từ server
    this.socket.on('room_state_updated', (state: any) => {
      if (state) {
        // Đảm bảo tương thích cả id và roomId
        const normalizedState: RoomState = {
          ...state,
          id: state.id || state.roomId
        };
        this.roomStateSubject.next(normalizedState);
      } else {
        this.roomStateSubject.next(null);
      }
    });

    this.socket.on('new_chat_message', (msg: ChatMessage) => {
      const current = this.chatMessagesSubject.value;
      this.chatMessagesSubject.next([...current, msg]);
    });

    this.socket.on('drawing_stream', (stroke: DrawStroke) => {
      this.drawingStreamSubject.next(stroke);
    });

    this.socket.on('clear_drawing', () => {
      this.clearDrawingSubject.next();
    });

    this.socket.on('connect', () => {
      console.log('Socket.io connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });
  }

  /**
   * Lấy socket ID hiện tại
   */
  public getSocketId(): string | null {
    return this.socket?.id || null;
  }

  public resetState(): void {
    this.chatMessagesSubject.next([]);
  }

  /**
   * Gửi sự kiện tạo phòng mới
   */
  public createRoom(nickname: string, avatar: string, settings: GameSettings): void {
    this.resetState();
    if (!this.socket.connected) {
      this.socket.connect();
    }
    this.socket.emit('create_room', { nickname, avatar, settings }, (response: any) => {
      if (response && !response.error) {
        const normalizedState: RoomState = {
          ...response,
          id: response.id || response.roomId
        };
        this.roomStateSubject.next(normalizedState);
      } else if (response && response.error) {
        console.error('Create room error:', response.error);
      }
    });
  }

  /**
   * Gửi sự kiện tham gia phòng có sẵn
   */
  public joinRoom(roomId: string, nickname: string, avatar: string): void {
    this.resetState();
    if (!this.socket.connected) {
      this.socket.connect();
    }
    this.socket.emit('join_room', { roomId, nickname, avatar }, (response: any) => {
      if (response && !response.error) {
        const normalizedState: RoomState = {
          ...response,
          id: response.id || response.roomId
        };
        this.roomStateSubject.next(normalizedState);
      } else if (response && response.error) {
        console.error('Join room error:', response.error);
      }
    });
  }

  public updateRoomSettings(roomId: string, settings: Partial<GameSettings>): void {
    this.socket.emit('update_room_settings', { roomId, settings });
  }

  public startGame(roomId: string): void {
    this.socket.emit('start_game', { roomId });
  }

  public sendStroke(roomId: string, stroke: DrawStroke): void {
    this.socket.emit('draw_stroke', { roomId, stroke });
  }

  public clearCanvas(roomId: string): void {
    this.socket.emit('clear_canvas', { roomId });
  }

  public sendMessage(roomId: string, text: string): void {
    this.socket.emit('send_message', { roomId, text });
  }

  public submitModeBGuess(roomId: string, guess: string): void {
    this.socket.emit('submit_guess', { roomId, guess });
  }

  /**
   * Rời khỏi phòng hiện tại
   */
  public leaveRoom(roomId: string): void {
    this.socket.emit('leave_room', { roomId });
    this.socket.disconnect();
    this.roomStateSubject.next(null);
    this.resetState();
  }
}

