import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { StatsComponent } from './admin/stats/stats.component';
import { HistoryComponent } from './admin/history/history.component';
import { ProfileComponent } from './admin/profile/profile.component';

const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'stats', pathMatch: 'full' },
      { path: 'stats', component: StatsComponent },
      { path: 'history', component: HistoryComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  },
  { path: '', redirectTo: '/admin/stats', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }