import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';
import * as RoomActions from './room.actions';
import { SocketService } from '../../services/socket.service';

@Injectable()
export class RoomEffects {
  private actions$ = inject(Actions);
  private socketService = inject(SocketService);

  syncRoomState$ = createEffect(() =>
    this.socketService.roomState$.pipe(
      map((roomState) => RoomActions.setRoomState({ roomState }))
    )
  );

  syncError$ = createEffect(() =>
    this.socketService.error$.pipe(
      map((error) => RoomActions.setError({ error }))
    )
  );

  createRoom$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RoomActions.createRoom),
        tap(({ playerName, avatar, settings }) => {
          this.socketService.createRoom(playerName, avatar, settings);
        })
      ),
    { dispatch: false }
  );

  joinRoom$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RoomActions.joinRoom),
        tap(({ roomId, playerName, avatar }) => {
          this.socketService.joinRoom(roomId, playerName, avatar);
        })
      ),
    { dispatch: false }
  );

  startGame$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RoomActions.startGame),
        tap(({ roomId }) => {
          this.socketService.startGame(roomId);
        })
      ),
    { dispatch: false }
  );
}
