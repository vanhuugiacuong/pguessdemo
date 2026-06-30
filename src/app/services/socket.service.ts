import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { RoomState, GameSettings, ChatMessage, DrawStroke } from '../models/game.model';

// Cấu hình URL Backend để test qua internet (ví dụ: Ngrok, LocalTunnel, hoặc khi deploy thực tế).
// Để trống ('') nếu chạy local thông thường để tự động nhận dạng IP.
const BACKEND_OVERRIDE_URL = '';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private roomStateSubject = new BehaviorSubject<RoomState | null>(null);
  public roomState$ = this.roomStateSubject.asObservable();

  private errorSubject = new Subject<string | null>();
  public error$ = this.errorSubject.asObservable();

  private chatMessagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public chatMessages$ = this.chatMessagesSubject.asObservable();

  private drawingStreamSubject = new Subject<DrawStroke>();
  public drawingStream$ = this.drawingStreamSubject.asObservable();

  private clearDrawingSubject = new Subject<void>();
  public clearDrawingEvent$ = this.clearDrawingSubject.asObservable();

  private getBackendUrl(): string {
    if (BACKEND_OVERRIDE_URL) {
      return BACKEND_OVERRIDE_URL;
    }
    if (typeof window === 'undefined') {
      return 'http://localhost:3000';
    }
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // 1. Chạy local dev
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }

    // 2. Chia sẻ mạng nội bộ LAN (ví dụ truy cập qua http://192.168.1.15:4200)
    const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (ipPattern.test(hostname)) {
      return `${protocol}//${hostname}:3000`;
    }

    // 3. Môi trường deploy (Production)
    // Mặc định tự động nhận diện cùng domain deploy.
    // Nếu deploy Backend ở tên miền khác Frontend (ví dụ: FE ở Netlify, BE ở Render), hãy sửa dòng dưới đây thành URL của Backend (ví dụ: 'https://pguess-api.onrender.com').
    return `${protocol}//${hostname}`;
  }

  constructor() {
    const backendUrl = this.getBackendUrl();
    console.log('Connecting to backend at:', backendUrl);
    
    this.socket = io(backendUrl, {
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
        this.errorSubject.next(response.error);
        alert(response.error);
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
        this.errorSubject.next(response.error);
        alert(response.error);
      }
    });
  }

  public updateRoomSettings(roomId: string, settings: Partial<GameSettings>): void {
    this.socket.emit('update_room_settings', { roomId, settings });
  }

  public startGame(roomId: string): void {
    this.socket.emit('start_game', { roomId }, (response: any) => {
      if (response && response.error) {
        this.errorSubject.next(response.error);
        alert(response.error);
      }
    });
  }

  public selectWord(roomId: string, word: string): void {
    this.socket.emit('select_word', { roomId, word }, (response: any) => {
      if (response && response.error) {
        console.error('Select word error:', response.error);
        this.errorSubject.next(response.error);
        alert(response.error);
      }
    });
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
    this.socket.emit('submit_guess', { roomId, guess }, (response: any) => {
      if (response && response.error) {
        console.error('Submit guess error:', response.error);
        this.errorSubject.next(response.error);
        alert(response.error);
      }
    });
  }

  public submitDrawing(roomId: string, strokes: DrawStroke[]): Observable<any> {
    return new Observable((observer) => {
      this.socket.emit('submit_drawing', { roomId, strokes }, (response: any) => {
        if (response && response.error) {
          observer.error(response.error);
        } else {
          observer.next(response);
          observer.complete();
        }
      });
    });
  }

  public returnToLobby(roomId: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.emit('return_to_lobby', { roomId }, (response: any) => {
        if (response && response.error) {
          observer.error(response.error);
        } else {
          observer.next(response);
          observer.complete();
        }
      });
    });
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

