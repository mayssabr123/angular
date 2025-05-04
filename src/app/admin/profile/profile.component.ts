import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  notificationsForm: FormGroup;

  activeTab = 'profile';
  isEditing = false;
  isSaving = false;

  // Sample user data
  user = {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'Administrator',
    phone: '+1 (555) 123-4567',
    location: 'New York, USA',
    bio: 'Experienced administrator with a passion for creating efficient systems and processes.',
    joinDate: new Date(2022, 5, 15),
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=6e8efb&color=fff'
  };

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      name: [this.user.name, Validators.required],
      email: [this.user.email, [Validators.required, Validators.email]],
      phone: [this.user.phone, Validators.required],
      location: [this.user.location, Validators.required],
      bio: [this.user.bio]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.notificationsForm = this.fb.group({
      emailNotifications: [true],
      pushNotifications: [false],
      marketingEmails: [true],
      activitySummary: [true]
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;

    if (!this.isEditing) {
      this.profileForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        phone: this.user.phone,
        location: this.user.location,
        bio: this.user.bio
      });
    }
  }

  saveProfile() {
    if (this.profileForm.valid) {
      this.isSaving = true;

      // Simulate API call
      setTimeout(() => {
        // Update user data with form values
        this.user = {
          ...this.user,
          ...this.profileForm.value
        };

        this.isEditing = false;
        this.isSaving = false;
      }, 1000);
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  savePassword() {
    if (this.passwordForm.valid) {
      this.isSaving = true;

      // Simulate API call
      setTimeout(() => {
        // Reset form after successful password change
        this.passwordForm.reset();
        this.isSaving = false;

        // In a real app, you would show a success message
      }, 1000);
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }

  saveNotifications() {
    if (this.notificationsForm.valid) {
      this.isSaving = true;

      // Simulate API call
      setTimeout(() => {
        this.isSaving = false;

        // In a real app, you would show a success message
      }, 1000);
    }
  }
}
