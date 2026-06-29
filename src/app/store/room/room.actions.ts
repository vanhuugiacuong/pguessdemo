import { createAction, props } from '@ngrx/store';
import { GameSettings, RoomState, DrawStroke } from '../../models/game.model';

export const createRoom = createAction(
  '[Room] Create Room',
  props<{ playerName: string; avatar: string; settings: GameSettings }>()
);

export const joinRoom = createAction(
  '[Room] Join Room',
  props<{ roomId: string; playerName: string; avatar: string }>()
);

export const startGame = createAction(
  '[Room] Start Game',
  props<{ roomId: string }>()
);

export const setRoomState = createAction(
  '[Room] Set Room State',
  props<{ roomState: RoomState | null }>()
);

export const setError = createAction(
  '[Room] Set Error',
  props<{ error: string | null }>()
);

export const resetRoom = createAction('[Room] Reset/Leave Room');

export const submitDrawing = createAction(
  '[Room] Submit Drawing',
  props<{ roomId: string; strokes: DrawStroke[] }>()
);

export const submitDrawingSuccess = createAction(
  '[Room] Submit Drawing Success'
);

export const submitDrawingFailure = createAction(
  '[Room] Submit Drawing Failure',
  props<{ error: string }>()
);

export const returnToLobby = createAction(
  '[Room] Return To Lobby',
  props<{ roomId: string }>()
);

export const returnToLobbySuccess = createAction(
  '[Room] Return To Lobby Success'
);

export const returnToLobbyFailure = createAction(
  '[Room] Return To Lobby Failure',
  props<{ error: string }>()
);
