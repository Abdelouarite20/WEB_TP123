import { provideHttpClient, HttpEventType } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TrackService } from './track.service';
import { Track } from '../models/track.model';

describe('TrackService', () => {
  let service: TrackService;
  let http: HttpTestingController;
  const track: Track = {
    id: 'track-1', title: 'Blues', originalName: 'blues.mp3',
    mimeType: 'audio/mpeg', size: 1024, createdAt: '2026-11-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TrackService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('transmet page et limit au serveur et renvoie la page reçue', () => {
    const response = { items: [track], page: 3, limit: 5, total: 11, pages: 3 };
    let result: unknown;
    service.list(3, 5).subscribe((value) => result = value);
    const request = http.expectOne('/api/tracks?page=3&limit=5');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('3');
    expect(request.request.params.get('limit')).toBe('5');
    request.flush(response);
    expect(result).toEqual(response);
  });

  it('envoie uniquement audio et title dans le multipart et observe la progression', () => {
    const file = new File(['audio'], 'blues.mp3', { type: 'audio/mpeg' });
    const events: number[] = [];
    service.upload(file, 'Blues').subscribe((event) => events.push(event.type));
    const request = http.expectOne('/api/tracks');
    expect(request.request.method).toBe('POST');
    expect(request.request.reportUploadProgress).toBe(true);
    const body = request.request.body as FormData;
    expect(Array.from(body.keys())).toEqual(['audio', 'title']);
    expect(body.get('audio')).toBe(file);
    expect(body.get('title')).toBe('Blues');
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
    request.flush(track, { status: 201, statusText: 'Created' });
    expect(events).toContain(HttpEventType.UploadProgress);
    expect(events.at(-1)).toBe(HttpEventType.Response);
  });

  it('récupère un Blob uniquement pour la piste demandée', () => {
    const blob = new Blob(['audio'], { type: 'audio/mpeg' });
    let result: Blob | undefined;
    service.audio(track.id).subscribe((value) => result = value);
    const request = http.expectOne('/api/tracks/track-1/audio');
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(blob);
    expect(result).toBe(blob);
  });

  it('supprime la piste avec DELETE et accepte la réponse 204', () => {
    let completed = false;
    service.delete(track.id).subscribe(() => completed = true);
    const request = http.expectOne('/api/tracks/track-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });
});
