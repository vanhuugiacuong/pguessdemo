import { Routes } from '@angular/router';
import { LobbyComponent } from './components/pages/lobby/lobby.component';
import { RoomComponent } from './components/pages/room/room.component';

export const routes: Routes = [
  { path: '', component: LobbyComponent },
  { path: 'lobby/:roomId', component: RoomComponent },
  { path: '**', redirectTo: '' }
  
];
