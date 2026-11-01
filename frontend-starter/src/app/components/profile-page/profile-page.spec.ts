import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProfilePageComponent } from './profile-page';
import { User } from '../../shared/models/user.model';

describe('ProfilePageComponent', () => {
  let http: HttpTestingController;
  const user: User = { id: 'user-test', name: 'Alice', email: 'alice@example.test', createdAt: '2026-01-01T00:00:00.000Z' };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('charge le profil à l’ouverture et préremplit le nom', () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(true);
    http.expectOne('/api/users/me').flush(user);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.name.value).toBe('Alice');
    expect(fixture.componentInstance.loading()).toBe(false);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('alice@example.test');
  });

  it('refuse un nom vide ou composé d’espaces sans appeler PUT', () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();
    http.expectOne('/api/users/me').flush(user);
    fixture.componentInstance.form.controls.name.setValue('   ');
    fixture.componentInstance.save();
    http.expectNone('/api/users/me');
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('annule un chargement en cours à la destruction et préserve la déconnexion', () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const request = http.expectOne('/api/users/me');
    component.auth.currentUser.set(user);
    component.auth.logout();
    fixture.destroy();
    expect(request.cancelled).toBe(true);
    expect(() => request.flush(user)).toThrow('Cannot flush a cancelled request.');
    expect(component.auth.currentUser()).toBeNull();
    expect(component.loading()).toBe(false);
  });

  it('met à jour le profil réactif et affiche une confirmation', () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();
    http.expectOne('/api/users/me').flush(user);
    fixture.componentInstance.form.controls.name.setValue('Alicia');
    fixture.componentInstance.save();
    const request = http.expectOne('/api/users/me');
    expect(request.request.method).toBe('PUT');
    request.flush({ ...user, name: 'Alicia' });
    fixture.detectChanges();
    expect(fixture.componentInstance.auth.currentUser()?.name).toBe('Alicia');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Votre nom a été mis à jour.');
  });
});
