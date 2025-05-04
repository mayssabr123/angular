import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent {
  // Sample data for stats
  statsCards = [
    { title: 'Total Users', value: '8,549', change: '+12.5%', icon: 'users', trend: 'up' },
    { title: 'Revenue', value: '$24,350', change: '+8.2%', icon: 'dollar-sign', trend: 'up' },
    { title: 'Active Sessions', value: '1,293', change: '-3.1%', icon: 'activity', trend: 'down' },
    { title: 'Conversion Rate', value: '5.6%', change: '+2.3%', icon: 'percent', trend: 'up' }
  ];

  // Sample data for charts
  revenueData = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [12500, 15000, 13800, 16200, 18500, 17200, 19800, 21500, 20300, 22800, 24100, 24350]
  };

  userActivityData = {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [1250, 1380, 1520, 1350, 1480, 980, 870]
  };
}
