import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RoomFeatureState } from './room.state';

export const selectRoomFeature = createFeatureSelector<RoomFeatureState>('room');

export const selectLoading = createSelector(
  selectRoomFeature,
  (state) => state.loading
);

export const selectError = createSelector(
  selectRoomFeature,
  (state) => state.error
);
