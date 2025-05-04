import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Sensor {
  id: string;
  sensor_id: string;
  type: string;
  value: number;
  timestamp: string;
  location: string;
  voltage?: number;
  current?: number;
  power?: number;
  energy?: number;
  frequency?: number;
  power_factor?: number;
}

interface SensorResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Sensor[];
}

@Component({
  selector: 'app-sensors',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './sensors.component.html',
  styleUrls: ['./sensors.component.scss']
})
export class SensorsComponent implements OnInit, AfterViewInit {
  @ViewChild('lightChart') lightChartRef!: ElementRef;
  @ViewChild('gasChart') gasChartRef!: ElementRef;
  
  sensors: Sensor[] = [];
  loading = true;
  error = '';
  currentPage = 1;
  totalPages = 0;
  nextPageUrl: string | null = null;
  previousPageUrl: string | null = null;
  selectedPzem: Sensor | null = null;
  
  lightChart: Chart | null = null;
  gasChart: Chart | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchSensors();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  fetchSensors(url: string = 'http://127.0.0.1:8000/api/sensors/'): void {
    this.loading = true;
    this.http.get<SensorResponse>(url).subscribe({
      next: (response) => {
        this.sensors = response.results;
        this.nextPageUrl = response.next;
        this.previousPageUrl = response.previous;
        this.totalPages = Math.ceil(response.count / response.results.length);
        this.loading = false;
        this.initCharts();
      },
      error: (err) => {
        this.error = 'Failed to load sensor data';
        this.loading = false;
        console.error('Error fetching sensors:', err);
      }
    });
  }

  loadNextPage(): void {
    if (this.nextPageUrl) {
      this.currentPage++;
      this.fetchSensors(this.nextPageUrl);
    }
  }

  loadPreviousPage(): void {
    if (this.previousPageUrl) {
      this.currentPage--;
      this.fetchSensors(this.previousPageUrl);
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  formatChartDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getAverageValueByType(type: string): number {
    const sensorsOfType = this.sensors.filter(sensor => sensor.type.toLowerCase() === type.toLowerCase());
    if (sensorsOfType.length === 0) return 0;
    
    const sum = sensorsOfType.reduce((acc, sensor) => acc + sensor.value, 0);
    return sum / sensorsOfType.length;
  }

  getAveragePzemValue(property: string): number {
    const pzemSensors = this.sensors.filter(sensor => 
      sensor.type === 'PZEM' && sensor[property as keyof Sensor] !== null
    );
    if (pzemSensors.length === 0) return 0;
    
    const sum = pzemSensors.reduce((acc, sensor) => acc + (sensor[property as keyof Sensor] as number), 0);
    return sum / pzemSensors.length;
  }

  getLatestPzemValue(property: string): number {
    const pzemSensors = this.sensors.filter(sensor => 
      sensor.type === 'PZEM' && sensor[property as keyof Sensor] !== null
    );
    if (pzemSensors.length === 0) return 0;
    
    pzemSensors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return pzemSensors[0][property as keyof Sensor] as number;
  }

  getSensorUnit(type: string): string {
    type = type.toLowerCase();
    switch (type) {
      case 'temperature':
      case 'dht22':
        return '°C';
      case 'humidity':
        return '%';
      case 'pzem':
        return 'V';
      case 'mq2':
        return 'ppm';
      case 'ldr':
        return 'lux';
      default:
        return '';
    }
  }

  hasPzemSensors(): boolean {
    return this.sensors.some(sensor => sensor.type === 'PZEM');
  }

  showPzemDetails(sensor: Sensor): void {
    this.selectedPzem = sensor;
  }

  closePzemDetails(): void {
    this.selectedPzem = null;
  }

  initCharts(): void {
    if (this.lightChartRef) {
      this.createLightChart();
    }
    if (this.gasChartRef) {
      this.createGasChart();
    }
  }

  createLightChart(): void {
    if (this.lightChart) {
      this.lightChart.destroy();
    }

    const lightSensors = this.sensors.filter(
      sensor => sensor.type === 'LDR'
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (lightSensors.length === 0) return;

    const labels = lightSensors.map(sensor => this.formatChartDate(sensor.timestamp));
    const data = lightSensors.map(sensor => sensor.value);

    const ctx = this.lightChartRef.nativeElement.getContext('2d');
    this.lightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Luminosité (lux)',
          data: data,
          borderColor: '#faad14',
          backgroundColor: 'rgba(250, 173, 20, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Luminosité (lux)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Heure'
            }
          }
        }
      }
    });
  }

  createGasChart(): void {
    if (this.gasChart) {
      this.gasChart.destroy();
    }

    const gasSensors = this.sensors.filter(
      sensor => sensor.type === 'MQ2'
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (gasSensors.length === 0) return;

    const labels = gasSensors.map(sensor => this.formatChartDate(sensor.timestamp));
    const data = gasSensors.map(sensor => sensor.value);

    const ctx = this.gasChartRef.nativeElement.getContext('2d');
    this.gasChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Niveau de gaz (ppm)',
          data: data,
          borderColor: '#1890ff',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Niveau de gaz (ppm)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Heure'
            }
          }
        }
      }
    });
  }

  getPzemSensors(): Sensor[] {
    return this.sensors.filter(sensor => sensor.type === 'PZEM')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
