import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

interface Device {
  device: string;
  status: string;
  reason: string;
  timestamp: Date;
}

interface Room {
  location: string;
  mode: number;
  devices_on: Device[];
}

interface Machine {
  id: number;
  name: string;
  status: 'active' | 'idle' | 'offline' | 'maintenance';
  sector: string;
  type: string;
  lastMaintenance: Date;
  lastUpdate: Date;
  currentPower: number;
  powerPercentage: number;
  maxPower: number;
  efficiency: number;
  temperature: number;
}

interface Alert {
  id: number;
  alert_type: string;
  
  message: string;
  severity: 'critical' | 'warning' | 'info';
  time: Date;
  machineName: string;
}

@Component({
  selector: 'app-machine-control',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  templateUrl: './machine-control.component.html',
  styleUrls: ['./machine-control.component.scss']
})
export class MachineControlComponent implements OnInit {
  // Constants for modes
  readonly MODE_MANUAL = 0;
  readonly MODE_AUTOMATIC = 1;
  
  // User data and mode
  userData: any = null;
  userLocation: any = null;
  userRole: any = null;

  currentMode: number = this.MODE_MANUAL;
  
  // Machines data
  machines: Machine[] = [];
  filteredMachines: Machine[] = [];
  selectedSector: string = 'all';
  activeMachines: number = 0;
  totalMachines: number = 0;
  currentPowerUsage: number = 0;
  averageEfficiency: number = 0;
  
  // Alerts
  alerts: Alert[] = [];
  
  // Rooms and devices data
  rooms: Room[] = [];
  uniqueRooms: Room[] = [];
  
  // Search and filter properties
  searchQuery: string = '';
  selectedStatus: string = 'all';
  selectedMode: string = 'all';
  filteredRooms: Room[] = [];
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userDataStr = localStorage.getItem('user');

      if (userDataStr) {
        this.userData = JSON.parse(userDataStr);
        this.currentMode = this.userData.mode || this.MODE_MANUAL;
          // Ajoute ici le filtrage dans loadDevices en fonction du rôle
      this.userLocation = this.userData.location;
      this.userRole = this.userData.role || 'user'; // par défaut 'user'
      console.log(  this.userLocation, this.userRole)

      }
    }

    this.loadMachines();
    this.updateStatistics();
    this.loadDevices();
      // Appels répétés toutes les 5 secondes
  setInterval(() => {
    this.loadMachines();
    this.updateStatistics();
    this.loadDevices();
  }, 5000); // 5000 ms = 5 sec

  }

// Méthode pour charger les appareils depuis l'API et filtrer les salles inconnues
loadDevices(): void {
  this.http.get<any>('http://127.0.0.1:8000/accounts/get-all-devices-on/', { withCredentials: true })
    .subscribe({
      next: (response) => {
        if (response && response.data) {
          this.rooms = response.data;

          this.http.get<any>('http://127.0.0.1:8000/accounts/get-all-salles/', { withCredentials: true })
            .subscribe({
              next: (sallesResponse) => {
                if (sallesResponse && sallesResponse.salles) {
                  const validRoomNames = new Set(sallesResponse.salles.map((s: any) => s.name.toLowerCase()));

                  let filteredRooms = this.rooms.filter((room: Room) =>
                    validRoomNames.has(room.location.toLowerCase())
                  );

                  // 👇 Filtrer par location si non-admin
                  if (this.userRole !== 'admin') {
                    console.log(filteredRooms)
                    filteredRooms = filteredRooms.filter((room: Room) =>
                      room.location === this.userLocation
                    );
                  }

                  const uniqueRoomsMap = new Map<string, Room>();
                  filteredRooms.forEach((room: Room) => {
                    const locationKey = room.location.toLowerCase();
                    if (!uniqueRoomsMap.has(locationKey)) {
                      uniqueRoomsMap.set(locationKey, room);
                    }
                  });

                  this.uniqueRooms = Array.from(uniqueRoomsMap.values());
                  this.filteredRooms = [...this.uniqueRooms];
                  this.calculateTotalPages();

                  console.log('Appareils chargés (filtrés):', this.uniqueRooms);

                  this.http.get<any>('http://127.0.0.1:8000/get-alerts/', { withCredentials: true })
                    .subscribe({
                      next: (alertResponse) => {
                        if (alertResponse && alertResponse.data) {
                          this.alerts = alertResponse.data;
                          console.log('Alertes chargées avec succès:', this.alerts);
                        }
                      },
                      error: (errorAlert) => {
                        console.error('Erreur lors du chargement des alertes:', errorAlert);
                        this.alerts.unshift({
                          id: this.alerts.length + 1,
                          alert_type: 'Erreur',
                          message: `Échec du chargement des alertes: ${errorAlert.status} ${errorAlert.statusText}`,
                          severity: 'critical',
                          time: new Date(),
                          machineName: ''
                        });
                      }
                    });
                }
              },
              error: (errorSalles) => {
                console.error('Erreur lors du chargement des salles:', errorSalles);
                this.alerts.unshift({
                  id: this.alerts.length + 1,
                  alert_type: 'Erreur',
                  message: `Échec du chargement des salles: ${errorSalles.status} ${errorSalles.statusText}`,
                  severity: 'critical',
                  time: new Date(),
                  machineName: ''
                });
              }
            });
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des appareils:', error);
        this.alerts.unshift({
          id: this.alerts.length + 1,
          alert_type: 'Erreur',
          message: `Échec du chargement des appareils: ${error.status} ${error.statusText}`,
          severity: 'critical',
          time: new Date(),
          machineName: ''
        });
      }
    });
}


  // Méthode pour appliquer les filtres
  applyFilters() {
    this.filteredRooms = this.uniqueRooms.filter(room => {
      // Filtre de recherche
      const matchesSearch = this.searchQuery ? 
        room.location.toLowerCase().includes(this.searchQuery.toLowerCase()) : 
        true;
      
      // Filtre de statut
      let matchesStatus = true;
      if (this.selectedStatus !== 'all') {
        const hasActiveDevice = ['clim', 'chauf', 'lamp'].some(device => 
          this.isDeviceOn(room, device)
        );
        matchesStatus = (this.selectedStatus === 'on' && hasActiveDevice) || 
                        (this.selectedStatus === 'off' && !hasActiveDevice);
      }
      
      // Filtre de mode
      let matchesMode = true;
      if (this.selectedMode !== 'all') {
        matchesMode = (this.selectedMode === 'auto' && room.mode === 1) || 
                      (this.selectedMode === 'manual' && room.mode === 0);
      }
      
      return matchesSearch && matchesStatus && matchesMode;
    });
    
    this.currentPage = 1;
    this.calculateTotalPages();
  }
  
  // Méthodes de filtrage
  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.applyFilters();
  }
  
  filterByMode(mode: string) {
    this.selectedMode = mode;
    this.applyFilters();
  }
  
  resetFilters() {
    this.searchQuery = '';
    this.selectedStatus = 'all';
    this.selectedMode = 'all';
    this.applyFilters();
  }
  
  // Méthodes de pagination
  calculateTotalPages() {
    this.totalPages = Math.ceil(this.filteredRooms.length / this.itemsPerPage);
  }
  
  goToPage(page: number) {
    this.currentPage = page;
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  getPaginatedRooms(): Room[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredRooms.slice(startIndex, endIndex);
  }

  // Méthode pour contrôler un appareil
// machine-control.component.ts

controlDevice(location: string, device: string, action: string): void {
  if (this.isControlDisabled()) return;

  const payload = {
    location: location,        // 👈 Toujours envoyé (utile pour MQTT)
    name: location,            // 👈 Ajout du nom de la salle
    device: device,
    action: action
  };

  this.http.post('http://127.0.0.1:8000/accounts/control-all-devices/', payload, { 
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'X-CSRFToken': this.getCookie('csrftoken') || ''
    }),
    withCredentials: true 
  }).subscribe({
    next: (response: any) => {
      console.log(`Appareil ${device} ${action}`, response);
      this.loadDevices(); // Rafraîchir l'interface
    },
    error: (error) => {
      console.error(`Erreur lors du contrôle de l'appareil ${device}`, error);
    
    }
  });
}

// Mettre à jour le mode d'une salle
updateRoomMode(location: string, newMode: number): void {
  const payload = {
    name: location,   // 👈 Changement ici : "name" au lieu de "location"
    mode: newMode     // Valeur 0 (manuel) ou 1 (automatique)
  };
console.log(payload)
  const csrfToken = this.getCookie('csrftoken');

  this.http.post('http://127.0.0.1:8000/accounts/update-salle-mode/', payload, {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  }).subscribe({
    next: (response: any) => {
      console.log('Mode de la salle mis à jour', response);
      this.loadDevices(); // Recharger les appareils pour mettre à jour l'UI

      // Ajouter une alerte de succès
    
    },
    error: (error) => {
      console.error('Erreur lors de la mise à jour du mode de la salle', error);
 
    }
  });
}

  // Méthodes auxiliaires pour les appareils
  isDeviceOn(room: Room, deviceType: string): boolean {
    if (!room || !room.devices_on) return false;
    return room.devices_on.some(d => d.device === deviceType);
  }

  getToggleAction(room: Room, deviceType: string): string {
    return this.isDeviceOn(room, deviceType) ? 'OFF' : 'ON';
  }

  getButtonText(room: Room, deviceType: string): string {
    return this.isDeviceOn(room, deviceType) ? 'Éteindre' : 'Allumer';
  }

  getModeText(mode: number): string {
    return mode === 0 ? 'Automatique' : 'Manuel';
  }

  // Check if controls are disabled (in automatic mode)
  isControlDisabled(): boolean {
    return this.currentMode === this.MODE_AUTOMATIC;
  }

  // Helper function to fetch CSRF token from cookies
  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  // Method to toggle mode
  toggleMode(): void {
    // Switch between manual and automatic modes
    const newMode = this.currentMode === this.MODE_MANUAL ? this.MODE_AUTOMATIC : this.MODE_MANUAL;
    if (this.userData && this.userData.email) {
      const formData = {
        email: this.userData.email,
        mode: newMode
      };

      // Include CSRF token in headers if available
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-CSRFToken': this.getCookie('csrftoken') || '' // Fetch CSRF token from cookies
      });

      this.http.put('http://127.0.0.1:8000/accounts/change-mode-by-email/', formData, { headers, withCredentials: true })
        .subscribe({
          next: (response: any) => {
            console.log('Server response:', response);
            if (response.status === 'success') {
              this.currentMode = newMode;
              // Update user data in localStorage
              if (isPlatformBrowser(this.platformId)) {
                this.userData.mode = newMode;
                localStorage.setItem('currentUser', JSON.stringify(this.userData));
              }
              // Add a success alert
            
            }
          },
          error: (error) => {
            console.error('Error changing mode:', error);
            console.error('Error details:', error.error);
            // Add an error alert with detailed feedback
       
          }
        });
    }
  }

  // Méthodes pour les machines et statistiques
  loadMachines(): void {
    // In a real app, this would come from a service
    this.machines = [
      {
        id: 1,
        name: 'CNC Machine A1',
        status: 'active',
        sector: 'production',
        type: 'CNC',
        lastMaintenance: new Date('2023-09-15'),
        lastUpdate: new Date(Date.now() - 3600000 * 2), // 2 heures avant
        currentPower: 12.5,
        powerPercentage: 75,
        maxPower: 16.7,
        efficiency: 85,
        temperature: 42
      },
      {
        id: 2,
        name: 'Assembly Line B3',
        status: 'active',
        sector: 'production',
        type: 'Assembly',
        lastMaintenance: new Date('2023-10-05'),
        lastUpdate: new Date(Date.now() - 3600000), // 1 heure avant
        currentPower: 18.2,
        powerPercentage: 90,
        maxPower: 20.2,
        efficiency: 78,
        temperature: 38
      },
      {
        id: 3,
        name: 'Packaging Unit C2',
        status: 'idle',
        sector: 'packaging',
        type: 'Packaging',
        lastMaintenance: new Date('2023-08-22'),
        lastUpdate: new Date(Date.now() - 3600000 * 3), // 3 heures avant
        currentPower: 3.1,
        powerPercentage: 30,
        maxPower: 10.3,
        efficiency: 92,
        temperature: 28
      },
      {
        id: 4,
        name: 'Warehouse Lift D1',
        status: 'offline',
        sector: 'warehouse',
        type: 'Lift',
        lastMaintenance: new Date('2023-07-18'),
        lastUpdate: new Date(Date.now() - 3600000 * 4), // 4 heures avant
        currentPower: 0,
        powerPercentage: 0,
        maxPower: 8.5,
        efficiency: 65,
        temperature: 22
      },
      {
        id: 5,
        name: 'Injection Molder A4',
        status: 'active',
        sector: 'production',
        type: 'Injection',
        lastMaintenance: new Date('2023-09-28'),
        lastUpdate: new Date(Date.now() - 3600000 * 5), // 5 heures avant
        currentPower: 15.8,
        powerPercentage: 85,
        maxPower: 18.6,
        efficiency: 72,
        temperature: 48
      },
      {
        id: 6,
        name: 'HVAC System',
        status: 'maintenance',
        sector: 'facility',
        type: 'HVAC',
        lastMaintenance: new Date('2023-10-12'),
        lastUpdate: new Date(Date.now() - 3600000 * 6), // 6 heures avant
        currentPower: 2.4,
        powerPercentage: 20,
        maxPower: 12.0,
        efficiency: 60,
        temperature: 32
      }
    ];
    this.filteredMachines = [...this.machines];
  }


  updateStatistics(): void {
    this.totalMachines = this.machines.length;
    this.activeMachines = this.machines.filter(m => m.status === 'active').length;
    this.currentPowerUsage = this.machines.reduce((sum, machine) => sum + machine.currentPower, 0);
    const efficiencySum = this.machines.reduce((sum, machine) => sum + machine.efficiency, 0);
    this.averageEfficiency = efficiencySum / this.totalMachines;
  }

  filterBySector(sector: string): void {
    this.selectedSector = sector;
    this.applyFilters();
  }




  toggleMachine(machine: Machine): void {
    if (this.isControlDisabled()) return;
    if (machine.status === 'active') {
      machine.status = 'idle';
      machine.currentPower = machine.maxPower * 0.1;
      machine.powerPercentage = 10;
    } else if (machine.status === 'idle' || machine.status === 'offline') {
      machine.status = 'active';
      machine.currentPower = machine.maxPower * (machine.powerPercentage / 100);
    }
    this.updateStatistics();
  }

  adjustPower(machine: Machine, event: Event): void {
    if (this.isControlDisabled()) return;
    const percentage = parseInt((event.target as HTMLInputElement).value);
    machine.powerPercentage = percentage;
    if (machine.status === 'active') {
      machine.currentPower = machine.maxPower * (percentage / 100);
    }
    this.updateStatistics();
  }

  scheduleMaintenance(machine: Machine): void {
    if (this.isControlDisabled()) return;
    if (machine.status !== 'maintenance') {
      machine.status = 'maintenance';
      machine.currentPower = machine.maxPower * 0.2;
      machine.powerPercentage = 20;
      // Add a maintenance alert
 
    } else {
      machine.status = 'idle';
      machine.currentPower = machine.maxPower * 0.1;
      machine.powerPercentage = 10;
    }
    this.updateStatistics();
  }

  viewMachineDetails(machine: Machine): void {
    console.log('View details for machine:', machine);
  }

  dismissAlert(alert: Alert): void {
    this.alerts = this.alerts.filter(a => a.id !== alert.id);
  }

  clearAllAlerts(): void {
    this.alerts = [];
  }

  getEfficiencyClass(efficiency: number): string {
    if (efficiency >= 80) return 'high';
    if (efficiency >= 60) return 'medium';
    if (efficiency >= 40) return 'low';
    return 'critical';
  }

  getTemperatureClass(temperature: number): string {
    if (temperature < 30) return 'high';
    if (temperature < 40) return 'medium';
    if (temperature < 50) return 'low';
    return 'critical';
  }

  getTemperaturePercentage(temperature: number): number {
    return Math.min(Math.max(temperature, 0), 100);
  }
}