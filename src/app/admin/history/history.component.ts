import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Chart from 'chart.js/auto';

interface SensorData {
  id: string;
  topic: string;
  location: string;
  voltage: number | null;
  current: number | null;
  power: number | null;
  light_level: number | null;
  gas_level: number | null;
  temperature: number | null;
  humidity: number | null;
  timestamp: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, AfterViewInit {
  // Données des capteurs
  sensorData: SensorData[] = [];
  
  // Options de filtrage
  filterOptions = {
    topics: ['Tous', 'capteurs/pzem', 'capteurs/ldr', 'capteurs/mq2', 'capteurs/dht'],
    locations: ['Tous', 'Salle 1'],
    dateRanges: ['Tous', 'Aujourd\'hui', 'Hier', 'Derniers 7 jours', 'Derniers 30 jours', 'Ce mois', 'Mois dernier', 'Personnalisé']
  };

  selectedTopic = 'Tous';
  selectedLocation = 'Tous';
  selectedDateRange = 'Tous';
  startDate: string = '';
  endDate: string = '';
  selectedChartView = 'daily';

  // Données filtrées
  filteredData: SensorData[] = [];

  // Méthodes pour les slides
  currentSlide = 0;

  @ViewChild('powerChart') powerChartRef!: ElementRef;
  @ViewChild('lightChart') lightChartRef!: ElementRef;
  @ViewChild('gasChart') gasChartRef!: ElementRef;
  @ViewChild('tempHumidityChart') tempHumidityChartRef!: ElementRef;
  
  // Objets pour stocker les instances de graphiques
  powerChart: any;
  lightChart: any;
  gasChart: any;
  tempHumidityChart: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchSensorData();
  }
  ngAfterViewInit(): void {
    console.log('Vue initialisée, références canvas:', {
      powerChart: this.powerChartRef,
      lightChart: this.lightChartRef,
      gasChart: this.gasChartRef,
      tempHumidityChart: this.tempHumidityChartRef
    });
    
    // Attendre que les données soient chargées avant d'initialiser les graphiques
    if (this.filteredData.length > 0) {
      this.initCharts();
    } else {
      // Si les données ne sont pas encore chargées, attendre qu'elles le soient
      setTimeout(() => {
        this.checkDataAndInitCharts();
      }, 1000);
    }
  }

  // Nouvelle méthode pour vérifier les données et initialiser les graphiques
  checkDataAndInitCharts(attempts: number = 0): void {
    if (this.filteredData.length > 0) {
      this.initCharts();
    } else if (attempts < 5) {
      // Réessayer jusqu'à 5 fois avec un délai de 1 seconde
      setTimeout(() => {
        this.checkDataAndInitCharts(attempts + 1);
      }, 1000);
    } else {
      console.error('Impossible de charger les données pour les graphiques après plusieurs tentatives');
    }
  }

  fetchSensorData(): void {
    const apiUrl = 'http://127.0.0.1:8000/sensor-data/';
    
    console.log('Chargement des données des capteurs...');
    
    this.http.get<SensorData[]>(apiUrl).subscribe({
      next: (data) => {
        console.log('Données reçues:', data);
        this.sensorData = data;
        this.filteredData = [...this.sensorData];
        this.updateFilterOptions();
        
        // Initialiser les graphiques après avoir chargé les données
        if (this.powerChartRef) {
          this.initCharts();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des données des capteurs:', error);
      }
    });
  }

  updateFilterOptions(): void {
    // Mettre à jour les options de filtrage en fonction des données disponibles
    const topics = new Set<string>();
    const locations = new Set<string>();
    
    this.sensorData.forEach(item => {
      if (item.topic) topics.add(item.topic);
      if (item.location) locations.add(item.location);
    });
    
    this.filterOptions.topics = ['Tous', ...Array.from(topics)];
    this.filterOptions.locations = ['Tous', ...Array.from(locations)];
  }

  // Méthodes de filtrage
  filterByTopic(topic: string) {
    this.selectedTopic = topic;
    this.applyFilters();
  }

  filterByLocation(location: string) {
    this.selectedLocation = location;
    this.applyFilters();
  }

  filterByDateRange(range: string) {
    this.selectedDateRange = range;

    // Si ce n'est pas une plage personnalisée, effacer les entrées de date
    if (range !== 'Personnalisé') {
      this.startDate = '';
      this.endDate = '';
    }

    this.applyFilters();
  }

  setChartView(view: string) {
    this.selectedChartView = view;
  }

  resetFilters() {
    this.selectedTopic = 'Tous';
    this.selectedLocation = 'Tous';
    this.selectedDateRange = 'Tous';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  applyFilters() {
    this.filteredData = this.sensorData.filter(item => {
      // Filtrer par topic (type de capteur)
      if (this.selectedTopic !== 'Tous' && item.topic !== this.selectedTopic) {
        return false;
      }

      // Filtrer par emplacement
      if (this.selectedLocation !== 'Tous' && item.location !== this.selectedLocation) {
        return false;
      }

      // Filtrer par plage de dates personnalisée
      if (this.startDate && this.endDate) {
        const itemDate = new Date(item.timestamp);
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        end.setHours(23, 59, 59); // Inclure toute la journée de fin

        if (itemDate < start || itemDate > end) {
          return false;
        }
      }
      // Filtrer par plage de dates prédéfinie
      else if (this.selectedDateRange !== 'Tous') {
        const itemDate = new Date(item.timestamp);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Début de la journée

        if (this.selectedDateRange === 'Aujourd\'hui') {
          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59);
          return itemDate >= today && itemDate <= todayEnd;
        } else if (this.selectedDateRange === 'Hier') {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayEnd = new Date(yesterday);
          yesterdayEnd.setHours(23, 59, 59);
          return itemDate >= yesterday && itemDate <= yesterdayEnd;
        } else if (this.selectedDateRange === 'Derniers 7 jours') {
          const last7Days = new Date(today);
          last7Days.setDate(last7Days.getDate() - 7);
          return itemDate >= last7Days;
        } else if (this.selectedDateRange === 'Derniers 30 jours') {
          const last30Days = new Date(today);
          last30Days.setDate(last30Days.getDate() - 30);
          return itemDate >= last30Days;
        } else if (this.selectedDateRange === 'Ce mois') {
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          return itemDate >= firstDayOfMonth;
        } else if (this.selectedDateRange === 'Mois dernier') {
          const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          return itemDate >= firstDayOfLastMonth && itemDate < firstDayOfThisMonth;
        }
      }

      return true;
    });

    // Mettre à jour les graphiques avec les nouvelles données filtrées
    if (this.powerChart || this.lightChart || this.gasChart || this.tempHumidityChart) {
      // Détruire les graphiques existants
      this.destroyCharts();
      // Réinitialiser les graphiques avec les nouvelles données
      this.initCharts();
    }
  }

  // Méthodes utilitaires
  getSensorType(topic: string): string {
    if (!topic) return '';
    const parts = topic.split('/');
    return parts.length > 1 ? parts[1].toUpperCase() : topic;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatChartDate(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Méthodes pour obtenir les valeurs moyennes par type de capteur
  getAverageValue(property: string): number {
    const relevantData = this.filteredData.filter(item => item[property as keyof SensorData] !== null);
    if (relevantData.length === 0) return 0;
    
    const sum = relevantData.reduce((acc, item) => {
      const value = item[property as keyof SensorData] as number;
      return acc + (value || 0);
    }, 0);
    
    return sum / relevantData.length;
  }

  setSlide(index: number): void {
    this.currentSlide = index;
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % 4;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + 4) % 4;
  }

  initCharts(): void {
    console.log('Initialisation des graphiques...');
    console.log('Données filtrées:', this.filteredData);
    
    // Vérifier si les données sont disponibles
    if (this.filteredData.length === 0) {
      console.log('Aucune donnée disponible pour les graphiques');
      return;
    }
    
    // Vérifier si les références aux canvas existent
    console.log('Références canvas:', {
      powerChart: this.powerChartRef,
      lightChart: this.lightChartRef,
      gasChart: this.gasChartRef,
      tempHumidityChart: this.tempHumidityChartRef
    });
    
    // Préparer les données pour les graphiques
    const chartData = this.prepareChartData();
    console.log('Données préparées pour les graphiques:', chartData);
    
    // Initialiser les graphiques
    this.createPowerChart(chartData);
    this.createLightChart(chartData);
    this.createGasChart(chartData);
    this.createTempHumidityChart(chartData);
  }
  
  prepareChartData(): any {
    // Trier les données par horodatage
    const sortedData = [...this.filteredData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Extraire les labels (horodatages)
    const labels = sortedData.map(item => this.formatChartDate(item.timestamp));
    
    // Regrouper les données par type de capteur
    const pzemData = sortedData.filter(item => item.topic === 'capteurs/pzem');
    const ldrData = sortedData.filter(item => item.topic === 'capteurs/ldr');
    const mq2Data = sortedData.filter(item => item.topic === 'capteurs/mq2');
    const dhtData = sortedData.filter(item => item.topic === 'capteurs/dht');
    
    return {
      labels,
      pzemData,
      ldrData,
      mq2Data,
      dhtData
    };
  }
  
  createPowerChart(chartData: any): void {
    if (!this.powerChartRef) return;
    
    const ctx = this.powerChartRef.nativeElement.getContext('2d');
    
    // Extraire les données de tension, courant et puissance
    const voltageData = chartData.pzemData.map((item: SensorData) => item.voltage);
    const currentData = chartData.pzemData.map((item: SensorData) => item.current);
    const powerData = chartData.pzemData.map((item: SensorData) => item.power);
    
    // Créer le graphique
    this.powerChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Tension (V)',
            data: voltageData,
            borderColor: '#4a6cf7',
            backgroundColor: 'rgba(74, 108, 247, 0.1)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3
          },
          {
            label: 'Courant (A)',
            data: currentData,
            borderColor: '#6610f2',
            backgroundColor: 'rgba(102, 16, 242, 0.1)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3
          },
          {
            label: 'Puissance (W)',
            data: powerData,
            borderColor: '#fd7e14',
            backgroundColor: 'rgba(253, 126, 20, 0.1)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  createLightChart(chartData: any): void {
    if (!this.lightChartRef) return;
    
    const ctx = this.lightChartRef.nativeElement.getContext('2d');
    
    // Extraire les données de luminosité
    const lightData = chartData.ldrData.map((item: SensorData) => item.light_level);
    
    // Créer le graphique
    this.lightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Luminosité (lux)',
            data: lightData,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  createGasChart(chartData: any): void {
    if (!this.gasChartRef) return;
    
    const ctx = this.gasChartRef.nativeElement.getContext('2d');
    
    // Extraire les données de gaz
    const gasData = chartData.mq2Data.map((item: SensorData) => item.gas_level);
    
    // Créer le graphique
    this.gasChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Niveau de gaz (ppm)',
            data: gasData,
            backgroundColor: 'rgba(220, 53, 69, 0.7)',
            borderColor: '#dc3545',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  createTempHumidityChart(chartData: any): void {
    if (!this.tempHumidityChartRef) return;
    
    const ctx = this.tempHumidityChartRef.nativeElement.getContext('2d');
    
    // Extraire les données de température et d'humidité
    const tempData = chartData.dhtData.map((item: SensorData) => item.temperature);
    const humidityData = chartData.dhtData.map((item: SensorData) => item.humidity);
    
    // Créer le graphique
    this.tempHumidityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Température (°C)',
            data: tempData,
            borderColor: '#e83e8c',
            backgroundColor: 'rgba(232, 62, 140, 0.1)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            yAxisID: 'y'
          },
          {
            label: 'Humidité (%)',
            data: humidityData,
            borderColor: '#17a2b8',
            backgroundColor: 'rgba(23, 162, 184, 0.1)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }
  
  destroyCharts(): void {
    if (this.powerChart) {
      this.powerChart.destroy();
      this.powerChart = null;
    }
    if (this.lightChart) {
      this.lightChart.destroy();
      this.lightChart = null;
    }
    if (this.gasChart) {
      this.gasChart.destroy();
      this.gasChart = null;
    }
    if (this.tempHumidityChart) {
      this.tempHumidityChart.destroy();
      this.tempHumidityChart = null;
    }
  }
}
