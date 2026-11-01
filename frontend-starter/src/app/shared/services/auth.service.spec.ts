import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const user: User = { id: 'user-test', name: 'Alice', email: 'alice@example.test', createdAt: '2026-01-01T00:00:00.000Z' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('envoie POST /api/auth/login et conserve la session reçue', () => {
    service.login(user.email, 'mot-de-passe-fictif').subscribe();
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: user.email, password: 'mot-de-passe-fictif' });
    request.flush({ token: 'token-fictif', user });
    expect(service.currentUser()).toEqual(user);
    expect(service.token()).toBe('token-fictif');
    expect(localStorage.getItem('gpc_token')).toBe('token-fictif');
  });

  it('envoie les champs attendus pour l’inscription', () => {
    service.register(user.name, user.email, 'mot-de-passe-fictif').subscribe();
    const request = http.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: user.name, email: user.email, password: 'mot-de-passe-fictif' });
    request.flush({ token: 'token-fictif', user });
    expect(service.currentUser()).toEqual(user);
  });

  it('lit puis modifie le profil avec GET et PUT /api/users/me', () => {
    service.profile().subscribe();
    const read = http.expectOne('/api/users/me');
    expect(read.request.method).toBe('GET');
    read.flush(user);
    expect(service.currentUser()).toEqual(user);

    service.update('Alicia').subscribe();
    const update = http.expectOne('/api/users/me');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({ name: 'Alicia' });
    update.flush({ ...user, name: 'Alicia' });
    expect(service.currentUser()?.name).toBe('Alicia');
  });

  it('efface le token et l’utilisateur à la déconnexion', () => {
    service.token.set('token-fictif');
    service.currentUser.set(user);
    localStorage.setItem('gpc_token', 'token-fictif');
    service.logout();
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('gpc_token')).toBeNull();
  });
});
