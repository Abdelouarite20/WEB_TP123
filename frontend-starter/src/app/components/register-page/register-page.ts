import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly error = signal('');
  readonly loading = signal(false);
  
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  submit(): void {
    if (this.loading()) return;
    this.error.set('');
    this.form.patchValue({ name: this.form.controls.name.value.trim(), email: this.form.controls.email.value.trim() });
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const values = this.form.getRawValue();
    this.loading.set(true);
    this.auth.register(values.name, values.email, values.password).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => {
        console.debug('[RegisterPage] Inscription réussie');
        void this.router.navigateByUrl('/profile');
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.status === 0
          ? 'Le serveur est injoignable. Vérifiez que le backend est démarré.'
          : error.status === 409
            ? 'Cette adresse email est déjà utilisée.'
            : error.status === 400
              ? 'Vérifiez le nom, l’email et le mot de passe (8 caractères minimum).'
              : 'L’inscription a échoué. Réessayez dans un instant.');
      },
    });
  }
}
