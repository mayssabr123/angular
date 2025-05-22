import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

interface Salle {
  name: string;
  mode: number; // 0 = Manuel, 1 = Automatique
}

// Modifiez l'interface User pour correspondre à la structure réelle des données
interface User {
  user_id: string;  // Changez 'id' en 'user_id'
  username?: string;
  email: string;
  location: string;
  tempLocation: string;
  mode: number;
  role: string;
  date_joined: string;
  is_active: boolean;
  last_login: string | null;
}

@Component({
  selector: 'app-gestion-salles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  templateUrl: './gestion-salles.component.html',
  styleUrl: './gestion-salles.component.scss'
})
export class GestionSallesComponent implements OnInit {

  // Onglets
  activeTab: string = 'salles';

  // Gestion des salles
  salles: Salle[] = [];
  filteredSalles: Salle[] = [];
  newSalleName: string = '';
  newSalleMode: number = 0;
  searchQuery: string = '';

  // Gestion des utilisateurs
  users: User[] = [];
  filteredUsers: User[] = [];
  userSearchQuery: string = '';

  readonly MODE_MANUEL = 0;
  readonly MODE_AUTO = 1;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadAllSalles();
    this.loadAllUsers();
  }

  // Méthodes pour la gestion des salles
  loadAllSalles(): void {
    this.http.get<{ salles: Salle[] }>('http://127.0.0.1:8000/accounts/get-all-salles/', {
      withCredentials: true
    }).subscribe({
      next: (response:any) => {
        if (response && response.salles) {
          this.salles = response.salles;
          this.filteredSalles = [...this.salles];
          console.log('Salles chargées', this.salles);
        }
      },
      error: (error:any) => {
        console.error("Erreur lors du chargement des salles", error);
      }
    });
  }

  createSalle(): void {
    if (!this.newSalleName.trim()) return;

    const payload = {
      name: this.newSalleName,
      mode: this.newSalleMode
    };


    this.http.post('http://127.0.0.1:8000/accounts/create-salle/', payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      
      }),
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        console.log('Salle créée avec succès', response.salle);
        this.loadAllSalles(); // Recharger la liste mise à jour
        this.newSalleName = '';
        this.newSalleMode = this.MODE_MANUEL;
      },
      error: (error:any) => {
        console.error("Erreur lors de la création", error.status, error.statusText);
      }
    });
  }

  updateSalleMode(name: string, newMode: number): void {
    const payload = {
      name: name,
      mode: newMode
    };


    this.http.post('http://127.0.0.1:8000/accounts/update-salle-mode/', payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      withCredentials: true
    }).subscribe({
      next: () => {
        this.loadAllSalles(); // Rafraîchir l'affichage
      },
      error: (error:any) => {
        console.error(`Erreur lors de la mise à jour du mode de ${name}`, error);
      }
    });
  }

  deleteSalle(name: string): void {
    // Si tu n'as pas de vue DELETE sur Django, tu peux l'ajouter si besoin
    // Pour l'instant, affiche un message ou implémente une suppression côté serveur
    this.http.delete(`http://127.0.0.1:8000/accounts/delete-salle/${name}/`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
     
      }),
      withCredentials: true
    }).subscribe(() => {
      this.loadAllSalles(); // Rafraîchir après suppression
    }, (error:any) => {
      console.error(`Impossible de supprimer la salle ${name}`, error);
    });
  }

  applySearch(): void {
    if (!this.searchQuery) {
      this.filteredSalles = [...this.salles];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredSalles = this.salles.filter(salle =>
      salle.name.toLowerCase().includes(query)
    );
  }

  getModeText(mode: number): string {
    return mode === this.MODE_MANUEL ? 'Manuel' : 'Automatique';
  }

  toggleMode(mode: number): number {
    return mode === this.MODE_MANUEL ? this.MODE_AUTO : this.MODE_MANUEL;
  }

  getIconForDevice(device: string): string {
    // Retourne un icône FontAwesome selon le type d'appareil
    return {
      clim: 'fa-snowflake',
      chauf: 'fa-fire',
      lamp: 'fa-lightbulb'
    }[device] || 'fa-question-circle';
  }

  // Nouvelles méthodes pour la gestion des utilisateurs
  loadAllUsers(): void {
    this.http.get<{ users: User[] }>('http://127.0.0.1:8000/accounts/get-all-users/', {
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        if (response && response.users) {
     
          this.users = response.users.map((user: User) => ({
            ...user,
            tempLocation: user.location // Initialiser tempLocation avec la valeur actuelle
          }));
          this.filteredUsers = [...this.users];
          console.log('Utilisateurs chargés', this.users);
        }
      },
      error: (error: any) => {
        console.error("Erreur lors du chargement des utilisateurs", error);
      }
    });
  }

  updateUserSalle(userId: string, newLocation: string): void {
    // Vérifier que l'ID utilisateur n'est pas undefined
    if (!userId) {
      console.error("Erreur: ID utilisateur non défini");
      return;
    }

    const payload = {
      user_id: userId,
      location: newLocation || "" // S'assurer que newLocation n'est jamais undefined
    };

    console.log("Envoi de la requête avec les données:", payload);

    this.http.post('http://127.0.0.1:8000/accounts/update-user-salle/', payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        console.log('Salle de l\'utilisateur mise à jour', response);
        // Mettre à jour l'utilisateur dans la liste locale
        const updatedUser = this.users.find(u => u.user_id === userId);
        if (updatedUser) {
          updatedUser.location = newLocation;
          updatedUser.tempLocation = newLocation;
        }
      },
      error: (error: any) => {
        console.error(`Erreur lors de la mise à jour de la salle pour l'utilisateur ${userId}`, error);
        // Afficher plus de détails sur l'erreur
        if (error.error && error.error.error) {
          console.error("Détail de l'erreur:", error.error.error);
        }
      }
    });
  }

  applyUserSearch(): void {
    if (!this.userSearchQuery) {
      this.filteredUsers = [...this.users];
      return;
    }

    const query = this.userSearchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      (user.username?.toLowerCase() || '').includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.location && user.location.toLowerCase().includes(query))
    );
  }

  // Variables pour la modal de confirmation
  showDeleteModal = false;
  userToDelete: string | null = null;
  deleteInProgress = false;
  deleteError: string | null = null;

  confirmDeleteUser(email: string): void {
    this.userToDelete = email;
    this.showDeleteModal = true;
    this.deleteError = null;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
    this.deleteInProgress = false;
    this.deleteError = null;
  }

  proceedWithDelete(): void {
    if (!this.userToDelete) {
      return;
    }

    this.deleteInProgress = true;
    this.deleteError = null;

    const payload = {
      email: this.userToDelete
    };

    this.http.delete('http://127.0.0.1:8000/accounts/delete_user_by_email/', {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: payload,
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        console.log('Utilisateur supprimé avec succès', response);
        this.loadAllUsers();
        this.showDeleteModal = false;
        this.userToDelete = null;
        this.deleteInProgress = false;
      },
      error: (error: any) => {
        console.error(`Erreur lors de la suppression de l'utilisateur ${this.userToDelete}`, error);
        this.deleteInProgress = false;
        this.deleteError = error.error && error.error.error 
          ? error.error.error 
          : "Une erreur s'est produite lors de la suppression de l'utilisateur.";
      }
    });
  }

  // Méthode existante à remplacer
  deleteUser(email: string): void {
    // Cette méthode est remplacée par confirmDeleteUser, proceedWithDelete et cancelDelete
    // Vous pouvez la supprimer si elle n'est pas utilisée ailleurs
  }
}