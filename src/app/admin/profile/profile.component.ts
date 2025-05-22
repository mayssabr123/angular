import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  userData: any = null;
  isEditing = false;
  isSaving = false;
  isChangingPassword = false;
  isPasswordChanging = false;
  updateError: string = '';
  passwordError: string = '';
  passwordSuccess: string = '';
  passwordStrength: number = 0;
  passwordFeedback: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
      location: [{value: '', disabled: true}, Validators.required],
      mode: [0]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Récupération des données utilisateur depuis localStorage
    this.loadUserFromLocalStorage();
  }

  loadUserFromLocalStorage() {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      try {
        this.userData = JSON.parse(userDataStr);
        console.log('Données utilisateur chargées:', this.userData);
        
        // Mise à jour du formulaire avec les données utilisateur
        this.profileForm.patchValue({
          username: this.userData.username || '',
          email: this.userData.email || '',
          location: this.userData.location || '',
          mode: this.userData.mode || 0
        });
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
      }
    } else {
      console.warn('Aucune donnée utilisateur trouvée dans le localStorage');
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.updateError = '';

    if (!this.isEditing) {
      // Réinitialiser le formulaire avec les valeurs actuelles
      this.profileForm.patchValue({
        username: this.userData.username || '',
        email: this.userData.email || '',
        location: this.userData.location || '',
        mode: this.userData.mode || 0
      });
    }
  }

  saveProfile() {
    if (this.profileForm.valid) {
      this.isSaving = true;
      this.updateError = '';
  
      // Préparation des données pour l'API
      const updateData = {
        email: this.userData.email, // Utiliser l'email existant car le champ est désactivé
        new_username: this.profileForm.value.username,
        new_location: this.userData.location, // Utiliser la valeur existante car le champ est désactivé
        new_mode: this.profileForm.value.mode || 0
      };
  console.log('Données à envoyer à l\'API:', updateData);
      // Appel à l'API pour mettre à jour les données utilisateur
      this.http.post('http://127.0.0.1:8000/accounts/update_user_by_email/', updateData).subscribe(
        (response: any) => {
          console.log('Réponse de l\'API:', response);
          
          // Mettre à jour les données utilisateur locales
          if (response && response.user) {
            this.userData = {
              ...this.userData,
              username: response.user.username || this.userData.username,
              email: response.user.email || this.userData.email,
              location: response.user.location || this.userData.location,
              mode: response.user.mode !== undefined ? response.user.mode : this.userData.mode
            };

            // Sauvegarder dans localStorage
            localStorage.setItem('user', JSON.stringify(this.userData));
          }

          this.isEditing = false;
          this.isSaving = false;
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du profil:', error);
          this.updateError = 'Erreur lors de la mise à jour du profil. Veuillez réessayer.';
          this.isSaving = false;
        }
      );
    } else {
      this.profileForm.markAllAsTouched();
    }
  }
  
  // Méthode pour formater la date d'inscription
  formatJoinDate() {
    if (!this.userData || !this.userData.date_joined) return '';
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return new Date(this.userData.date_joined).toLocaleDateString('fr-FR');
  }
  
  // Méthode pour obtenir le texte du mode
  getModeText() {
    if (!this.userData) return 'Manuel';
    return this.userData.mode === 1 ? 'Automatique' : 'Manuel';
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(formGroup: FormGroup) {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
      return null;
    }
  }

  // Méthode pour ouvrir le formulaire de changement de mot de passe
  togglePasswordChange() {
    this.isChangingPassword = !this.isChangingPassword;
    if (this.isChangingPassword) {
      this.passwordForm.reset();
      this.passwordError = '';
      this.passwordSuccess = '';
      this.passwordStrength = 0;
      this.passwordFeedback = '';
    }
  }

  // Méthode pour évaluer la force du mot de passe
  checkPasswordStrength(event: any) {
    const password = event.target.value;
    
    // Réinitialiser
    this.passwordStrength = 0;
    this.passwordFeedback = '';
    
    if (password.length === 0) return;
    
    // Critères de force
    if (password.length >= 8) this.passwordStrength += 25;
    if (/[A-Z]/.test(password)) this.passwordStrength += 25;
    if (/[0-9]/.test(password)) this.passwordStrength += 25;
    if (/[^A-Za-z0-9]/.test(password)) this.passwordStrength += 25;
    
    // Feedback basé sur la force
    if (this.passwordStrength <= 25) {
      this.passwordFeedback = 'Très faible';
    } else if (this.passwordStrength <= 50) {
      this.passwordFeedback = 'Faible';
    } else if (this.passwordStrength <= 75) {
      this.passwordFeedback = 'Moyen';
    } else {
      this.passwordFeedback = 'Fort';
    }
  }

  // Méthode pour changer le mot de passe
  changePassword() {
    if (this.passwordForm.valid) {
      this.isPasswordChanging = true;
      this.passwordError = '';
      this.passwordSuccess = '';
      
      const updateData = {
        email: this.userData.email,
        new_password: this.passwordForm.value.newPassword
      };
      
      this.http.post('http://127.0.0.1:8000/accounts/update_password_by_email/', updateData).subscribe(
        (response: any) => {
          console.log('Réponse de l\'API:', response);
          this.passwordSuccess = 'Votre mot de passe a été mis à jour avec succès.';
          this.isPasswordChanging = false;
          
          // Fermer le formulaire après quelques secondes
          setTimeout(() => {
            this.isChangingPassword = false;
            this.passwordSuccess = '';
          }, 3000);
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du mot de passe:', error);
          this.passwordError = error.error && error.error.error 
            ? error.error.error 
            : 'Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.';
          this.isPasswordChanging = false;
        }
      );
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }

  // Méthodes pour vérifier les exigences du mot de passe
  hasMinLength(): boolean {
    const password = this.passwordForm.get('newPassword')?.value;
    return password && password.length >= 8;
  }

  hasUpperCase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value;
    return password && /[A-Z]/.test(password);
  }

  hasDigit(): boolean {
    const password = this.passwordForm.get('newPassword')?.value;
    return password && /[0-9]/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.passwordForm.get('newPassword')?.value;
    return password && /[^A-Za-z0-9]/.test(password);
  }
}
