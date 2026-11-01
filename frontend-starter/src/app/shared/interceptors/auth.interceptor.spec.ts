import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let auth: AuthService;
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

  beforeEach(() => {
    localStorage.clear();
    router.navigateByUrl.mockClear();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: Router, useValue: router },
    ] });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('ajoute Authorization aux requêtes protégées lorsqu’un token existe', () => {
    auth.token.set('token-fictif');
    client.get('/api/tracks?page=2&limit=5').subscribe();
    const request = http.expectOne('/api/tracks?page=2&limit=5');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-fictif');
    request.flush({ items: [] });
  });

  it('n’ajoute pas de header sans token', () => {
    client.get('/api/users/me').subscribe();
    const request = http.expectOne('/api/users/me');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('ne transmet pas le token aux routes publiques ni aux URL externes', () => {
    auth.token.set('token-fictif');
    for (const url of ['/api/auth/login', '/api/health', 'https://example.test/api/tracks']) {
      client.get(url).subscribe();
      const request = http.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({});
    }
  });

  it('nettoie la session et revient sur /login après un 401 protégé', () => {
    auth.token.set('token-fictif');
    localStorage.setItem('gpc_token', 'token-fictif');
    const failure = vi.fn();
    client.get('/api/users/me').subscribe({ error: failure });
    http.expectOne('/api/users/me').flush({ message: 'Token invalide' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBeNull();
    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('gpc_token')).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(failure).toHaveBeenCalledOnce();
  });

  it('laisse un refus de connexion être traité par le formulaire', () => {
    auth.token.set('token-fictif');
    client.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    http.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBe('token-fictif');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('préserve une nouvelle session si une ancienne requête reçoit un 401', () => {
    auth.token.set('ancien-token-fictif');
    client.get('/api/users/me').subscribe({ error: () => undefined });
    const request = http.expectOne('/api/users/me');
    auth.token.set('nouveau-token-fictif');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBe('nouveau-token-fictif');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
