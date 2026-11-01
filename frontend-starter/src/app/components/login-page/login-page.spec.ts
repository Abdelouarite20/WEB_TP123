import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LoginPageComponent } from './login-page';

describe('LoginPageComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('bloque un formulaire invalide et affiche les erreurs des champs', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.componentInstance.form.setValue({ email: 'adresse-invalide', password: '' });
    fixture.componentInstance.submit();
    fixture.detectChanges();
    http.expectNone('/api/auth/login');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Saisissez une adresse email valide.');
    expect(element.textContent).toContain('Le mot de passe est requis.');
  });

  it('affiche une erreur après un refus HTTP et débloque le formulaire', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'alice@example.test', password: 'valeur-fictive' });
    component.submit();
    expect(component.loading()).toBe(true);
    component.submit();
    const request = http.expectOne('/api/auth/login');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Email ou mot de passe incorrect.');
  });
});
