import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { HistoryComponent } from './admin/history/history.component';
import { ProfileComponent } from './admin/profile/profile.component';
import { MachineControlComponent } from './admin/machine-control/machine-control.component';
import { SensorsComponent } from './admin/sensors/sensors.component';
import { GestionSallesComponent } from './admin/gestion-salles/gestion-salles.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'control', pathMatch: 'full' },
      { path: 'control', component: MachineControlComponent },
      { path: 'history', component: HistoryComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'sensors', component: SensorsComponent },
      { path: 'salle', component: GestionSallesComponent },


    ]
  },
  // Add other routes as needed
];
