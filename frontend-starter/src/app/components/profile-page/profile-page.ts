import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.loading() || this.saving()) return;
    this.error.set('');
    this.success.set('');
    this.loading.set(true);
    this.auth.profile().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (user) => {
        console.debug('[ProfilePage] Profil chargé', user.id);
        this.form.reset({ name: user.name });
      },
      error: () => this.error.set('Impossible de charger le profil. Réessayez dans un instant.'),
    });
  }

  save(): void {
    if (this.loading() || this.saving()) return;
    this.error.set('');
    this.success.set('');
    this.form.controls.name.setValue(this.form.controls.name.value.trim());
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.auth.update(this.form.getRawValue().name).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: (user) => {
        this.form.reset({ name: user.name });
        this.success.set('Votre nom a été mis à jour.');
      },
      error: (error: HttpErrorResponse) => this.error.set(error.status === 400
        ? 'Le nom doit contenir au moins 2 caractères.'
        : 'Impossible d’enregistrer le profil. Réessayez dans un instant.'),
    });
  }
}
