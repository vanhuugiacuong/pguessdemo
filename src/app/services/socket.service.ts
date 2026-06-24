import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { RoomState, GameSettings } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private roomStateSubject = new BehaviorSubject<RoomState | null>(null);
  public roomState$ = this.roomStateSubject.asObservable();

  constructor() {
    // Khởi tạo kết nối tới server NestJS ở cổng 3000
    this.socket = io('http://localhost:3000', {
      transports: ['websocket']
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

  /**
   * Gửi sự kiện tạo phòng mới
   */
  public createRoom(nickname: string, avatar: string, settings: GameSettings): void {
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
}
