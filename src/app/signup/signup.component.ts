import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  signupForm: FormGroup;
  isSubmitting = false;
  apiError: string = '';
  
  // Options de localisation
  locationOptions = [
    { value: 'Salle 1', label: 'Salle 1' },
    { value: 'Salle 2', label: 'Salle 2' },
    { value: 'Salle 3', label: 'Salle 3' },
    { value: 'Bureau 1', label: 'Bureau 1' },
    { value: 'Bureau 2', label: 'Bureau 2' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      location: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.isSubmitting = true;
      this.apiError = '';
  
      // Get CSRF token from cookie if it exists
      const csrfToken = this.getCookie('csrftoken');
      
      // Formatage des données exactement comme Django l'attend
      const formData = {
        username: this.signupForm.get('username')?.value,
        email: this.signupForm.get('email')?.value,
        password: this.signupForm.get('password')?.value,
        location: this.signupForm.get('location')?.value
      };
  
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || ''
      });

      // Afficher les données envoyées pour le débogage
      console.log('Données envoyées:', formData);

      this.http.post('http://127.0.0.1:8000/accounts/register/', formData, { 
        headers,
        withCredentials: true
      })
      .subscribe({
        next: (response: any) => {
          console.log('Réponse:', response);
          if (response.message) {
            this.navigateToLogin();
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Erreur complète:', error);
          if (error.error && error.error.error) {
            this.apiError = error.error.error;
          } else {
            this.apiError = 'Une erreur est survenue lors de l\'inscription';
          }
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.signupForm.markAllAsTouched();
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  // Helper method to get cookies
  getCookie(name: string): string {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  }
}
