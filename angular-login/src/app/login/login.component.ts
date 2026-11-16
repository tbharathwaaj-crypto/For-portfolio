import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = true;
  showPassword = false;
  message = '';

  onSubmit(): void {
    this.message = `Welcome back${this.email ? `, ${this.email}` : ''}. Authentication is ready to connect.`;
  }

  continueWith(provider: string): void {
    this.message = `${provider} sign-in can be connected to your authentication provider.`;
  }
}
