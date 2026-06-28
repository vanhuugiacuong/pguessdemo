import { RoomState, ChatMessage } from '../../models/game.model';

export interface RoomFeatureState {
  roomState: RoomState | null;
  chatMessages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

export const initialState: RoomFeatureState = {
  roomState: null,
  chatMessages: [],
  loading: false,
  error: null,
};
