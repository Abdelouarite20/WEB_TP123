import { provideHttpClient, HttpEventType } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TracksPageComponent } from './tracks-page';
import { Track } from '../../shared/models/track.model';

describe('TracksPageComponent', () => {
  let fixture: ComponentFixture<TracksPageComponent>;
  let component: TracksPageComponent;
  let http: HttpTestingController;
  const snackBar = { open: vi.fn() };
  const track: Track = {
    id: 'track-1', title: 'Blues', originalName: 'blues.mp3',
    mimeType: 'audio/mpeg', size: 1024, createdAt: '2026-11-01T10:00:00.000Z',
  };
  const page = { items: [track], page: 1, limit: 5, total: 1, pages: 1 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TracksPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.overrideProvider(MatSnackBar, { useValue: snackBar });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TracksPageComponent);
    component = fixture.componentInstance;
    http.expectOne('/api/tracks?page=1&limit=5').flush(page);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    http.verify({ ignoreCancelled: true });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    snackBar.open.mockClear();
  });

  it('affiche une erreur compréhensible après un échec de chargement', () => {
    component.load();
    http.expectOne('/api/tracks?page=1&limit=5').flush(
      { message: 'Lecture impossible' }, { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Lecture impossible');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Aucune piste. Importez');
  });

  it('demande une nouvelle page au serveur et refuse de dépasser les bornes', () => {
    component.pages.set(2);
    component.go(2);
    const request = http.expectOne('/api/tracks?page=2&limit=5');
    request.flush({ ...page, page: 2, total: 6, pages: 2 });
    expect(component.page()).toBe(2);
    component.go(3);
    http.expectNone('/api/tracks?page=3&limit=5');
  });

  it('refuse un type MIME invalide, un fichier vide et un fichier trop gros avant tout appel HTTP', () => {
    component.file = new File(['text'], 'notes.txt', { type: 'text/plain' });
    component.upload();
    expect(component.uploadState()).toBe('error');
    expect(component.uploadError()).toContain('Format refusé');
    component.file = new File([], 'empty.mp3', { type: 'audio/mpeg' });
    component.upload();
    expect(component.uploadError()).toContain('vide');
    component.file = new File(['audio'], 'big.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(component.file, 'size', { value: 25 * 1024 * 1024 + 1 });
    component.upload();
    expect(component.uploadError()).toContain('25 Mo');
    http.expectNone('/api/tracks');
  });

  it('affiche la progression, bloque un second envoi et remet le formulaire à zéro', () => {
    component.file = new File(['audio'], 'blues.mp3', { type: 'audio/mpeg' });
    component.title.setValue('Blues');
    component.page.set(2);
    component.upload();
    const request = http.expectOne('/api/tracks');
    expect(component.uploading()).toBe(true);
    expect(component.title.disabled).toBe(true);
    component.upload();
    http.expectNone('/api/tracks');
    request.event({ type: HttpEventType.UploadProgress, loaded: 30, total: 100 });
    expect(component.uploadProgress()).toBe(30);
    request.event({ type: HttpEventType.UploadProgress, loaded: 50 });
    expect(component.uploadProgress()).toBeNull();
    request.flush(track, { status: 201, statusText: 'Created' });
    expect(component.uploadState()).toBe('success');
    expect(component.uploadProgress()).toBe(100);
    expect(component.title.value).toBe('');
    expect(component.title.enabled).toBe(true);
    expect(component.file).toBeUndefined();
    expect(component.page()).toBe(1);
    http.expectOne('/api/tracks?page=1&limit=5').flush(page);
  });

  it('affiche une erreur serveur d’upload et autorise un nouvel essai', () => {
    component.file = new File(['audio'], 'blues.mp3', { type: 'audio/mpeg' });
    component.upload();
    http.expectOne('/api/tracks').flush({ message: 'Format audio non accepté' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(component.uploadState()).toBe('error');
    expect(component.uploading()).toBe(false);
    expect(component.title.enabled).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Format audio non accepté');
    component.upload();
    http.expectOne('/api/tracks').flush(track, { status: 201, statusText: 'Created' });
    http.expectOne('/api/tracks?page=1&limit=5').flush(page);
  });

  it('ne supprime rien lorsque la confirmation est annulée', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.delete(track);
    http.expectNone('/api/tracks/track-1');
    expect(component.deleting()).toEqual([]);
  });

  it('supprime après confirmation, bloque les doubles clics et recharge la liste', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.delete(track);
    const request = http.expectOne('/api/tracks/track-1');
    expect(request.request.method).toBe('DELETE');
    expect(component.deleting()).toContain(track.id);
    component.delete(track);
    http.expectNone('/api/tracks/track-1');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(component.deleting()).toEqual([]);
    expect(snackBar.open).toHaveBeenCalledWith('Piste supprimée.', 'Fermer', { duration: 5000 });
    http.expectOne('/api/tracks?page=1&limit=5').flush({ ...page, items: [], total: 0 });
  });

  it('explique un 404 de suppression et revient à la dernière page existante', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.page.set(2);
    component.delete(track);
    http.expectOne('/api/tracks/track-1').flush({ message: 'Piste inconnue' }, { status: 404, statusText: 'Not Found' });
    expect(snackBar.open).toHaveBeenCalledWith(
      'Cette piste n’existe plus ou ne vous appartient pas.', 'Fermer', { duration: 7000 },
    );
    http.expectOne('/api/tracks?page=2&limit=5').flush({ ...page, page: 2, items: [], pages: 1 });
    expect(component.page()).toBe(1);
    http.expectOne('/api/tracks?page=1&limit=5').flush(page);
  });

  it('affiche une erreur de lecture et termine le chargement si la piste est indisponible', () => {
    component.play(track);
    const request = http.expectOne('/api/tracks/track-1/audio');
    request.flush(new Blob(['Piste inconnue'], { type: 'text/plain' }), { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(component.audioLoading()).toBeNull();
    expect(component.audioUrl()).toBe('');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Impossible de charger cet audio');
  });

  it('révoque l’ancienne ObjectURL, puis la dernière à la destruction', () => {
    const create = vi.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
    const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
    const blob = new Blob(['audio'], { type: 'audio/mpeg' });
    component.play(track);
    http.expectOne('/api/tracks/track-1/audio').flush(blob);
    expect(component.currentTrack()?.title).toBe('Blues');
    component.play(track);
    http.expectOne('/api/tracks/track-1/audio').flush(blob);
    expect(create).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledWith('blob:first');
    fixture.destroy();
    expect(revoke).toHaveBeenCalledWith('blob:second');
  });
});
