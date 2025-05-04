import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  apiError: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.apiError = '';

      // Get CSRF token from cookie if it exists
      const csrfToken = this.getCookie('csrftoken');
      
      // Formatage des données exactement comme Django l'attend
      const formData = {
        username: this.loginForm.get('username')?.value,
        password: this.loginForm.get('password')?.value
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || ''
      });

      // Afficher les données envoyées pour le débogage
      console.log('Données envoyées:', formData);

      this.http.post('http://127.0.0.1:8000/accounts/login/', formData, { 
        headers,
        withCredentials: true
      })
      .subscribe({
        next: (response: any) => {
          console.log('Réponse:', response);
          if (response.status === 'success') {
            // Stocker les informations de l'utilisateur dans le localStorage
            localStorage.setItem('user', JSON.stringify(response.user));
            // Rediriger vers le tableau de bord
            this.router.navigate(['/admin']);
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Erreur complète:', error);
          if (error.error && error.error.message) {
            this.apiError = error.error.message;
          } else {
            this.apiError = 'Une erreur est survenue lors de la connexion';
          }
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }

  // Helper method to get cookies
  getCookie(name: string): string {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  }
}
