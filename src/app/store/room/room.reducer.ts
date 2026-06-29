import { createReducer, on } from '@ngrx/store';
import * as RoomActions from './room.actions';
import { initialState } from './room.state';

export const roomReducer = createReducer(
  initialState,
  on(RoomActions.createRoom, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(RoomActions.joinRoom, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(RoomActions.startGame, (state) => ({
    ...state,
    loading: true,
  })),
  on(RoomActions.setRoomState, (state, { roomState }) => ({
    ...state,
    roomState,
    loading: false,
    error: null,
  })),
  on(RoomActions.setError, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(RoomActions.submitDrawing, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(RoomActions.submitDrawingSuccess, (state) => ({
    ...state,
    loading: false,
  })),
  on(RoomActions.submitDrawingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(RoomActions.returnToLobby, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(RoomActions.returnToLobbySuccess, (state) => ({
    ...state,
    loading: false,
  })),
  on(RoomActions.returnToLobbyFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(RoomActions.resetRoom, () => initialState)
);
