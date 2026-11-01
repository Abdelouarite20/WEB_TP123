import { DatePipe } from '@angular/common';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

function frenchPaginator(): MatPaginatorIntl {
  const labels = new MatPaginatorIntl();
  labels.itemsPerPageLabel = 'Pistes par page';
  labels.nextPageLabel = 'Suivant';
  labels.previousPageLabel = 'Précédent';
  labels.firstPageLabel = 'Première page';
  labels.lastPageLabel = 'Dernière page';
  labels.getRangeLabel = (page, size, total) =>
    total === 0 ? 'Aucune piste' : (page * size + 1) + '–' + Math.min((page + 1) * size, total) + ' sur ' + total;
  return labels;
}

@Component({
  imports: [DatePipe, ReactiveFormsModule, MatPaginatorModule, MatSnackBarModule],
  providers: [{ provide: MatPaginatorIntl, useFactory: frenchPaginator }],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent {
  private readonly service = inject(TrackService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly audioInput = viewChild<ElementRef<HTMLInputElement>>('audioInput');
  private listRequest?: Subscription;
  private audioRequest?: Subscription;

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly total = signal(0);
  readonly limit = signal(5);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly audioUrl = signal('');
  readonly currentTrack = signal<Track | null>(null);
  readonly audioLoading = signal<string | null>(null);
  readonly audioError = signal('');
  readonly uploadState = signal<'idle' | 'uploading' | 'success' | 'error'>('idle');
  readonly uploading = computed(() => this.uploadState() === 'uploading');
  readonly uploadProgress = signal<number | null>(0);
  readonly uploadError = signal('');
  readonly uploadSuccess = signal('');
  readonly deleting = signal<string[]>([]);
  readonly title = new FormControl('', { nonNullable: true });
  file?: File;

  constructor() {
    this.destroyRef.onDestroy(() => this.stopPlayback());
    this.load();
  }

  choose(event: Event): void {
    if (this.uploading()) return;
    this.file = (event.target as HTMLInputElement).files?.[0];
    this.uploadSuccess.set('');
    this.uploadError.set(this.file ? this.validateFile(this.file) : '');
    this.uploadState.set(this.uploadError() ? 'error' : 'idle');
    this.uploadProgress.set(0);
  }

  load(): void {
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.listRequest = this.service.list(this.page(), this.limit())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.pages.set(Math.max(1, response.pages));
          this.total.set(response.total);
          // La dernière piste d'une page peut avoir été supprimée dans un autre onglet.
          if (this.page() > this.pages()) {
            this.page.set(this.pages());
            this.load();
            return;
          }
          this.tracks.set(response.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.tracks.set([]);
          this.error.set(this.errorMessage(error, 'Impossible de charger les pistes. Réessayez.'));
          this.loading.set(false);
        },
      });
  }

  go(page: number): void {
    if (page < 1 || page > this.pages() || this.loading()) return;
    this.page.set(page);
    this.load();
  }

  changePage(event: PageEvent): void {
    this.limit.set(event.pageSize);
    this.go(event.pageIndex + 1);
  }

  upload(): void {
    if (this.uploading()) return;
    const validation = this.file ? this.validateFile(this.file) : 'Choisissez un fichier audio.';
    this.uploadSuccess.set('');
    this.uploadError.set(validation);
    if (!this.file || validation) {
      this.uploadState.set('error');
      return;
    }

    this.uploadState.set('uploading');
    this.uploadProgress.set(0);
    this.title.disable();
    this.service.upload(this.file, this.title.value.trim() || this.file.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress.set(event.total ? Math.min(100, Math.round(100 * event.loaded / event.total)) : null);
          } else if (event.type === HttpEventType.Response) {
            this.uploadProgress.set(100);
            this.uploadState.set('success');
            this.uploadSuccess.set('Piste importée avec succès.');
            this.title.enable();
            this.title.reset();
            this.file = undefined;
            const input = this.audioInput()?.nativeElement;
            if (input) input.value = '';
            this.page.set(1);
            this.load();
          }
        },
        error: (error: unknown) => {
          this.uploadState.set('error');
          this.uploadError.set(this.errorMessage(error, 'Impossible d’importer ce fichier. Réessayez.'));
          this.title.enable();
        },
      });
  }

  play(track: Track): void {
    this.audioRequest?.unsubscribe();
    this.audioLoading.set(track.id);
    this.audioError.set('');
    this.audioRequest = this.service.audio(track.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.stopPlayback();
          this.audioUrl.set(URL.createObjectURL(blob));
          this.currentTrack.set(track);
          this.audioLoading.set(null);
        },
        error: (error: unknown) => {
          this.audioLoading.set(null);
          this.audioError.set(this.errorMessage(error, 'Impossible de charger cet audio. La piste est peut-être indisponible.'));
        },
      });
  }

  onAudioError(): void {
    this.audioError.set('Le navigateur ne peut pas lire ce fichier audio. Essayez un autre fichier ou format.');
    this.stopPlayback();
  }

  delete(track: Track): void {
    if (this.deleting().includes(track.id) || !window.confirm('Supprimer « ' + track.title + ' » ?')) return;
    this.deleting.update((ids) => [...ids, track.id]);
    this.service.delete(track.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.finishDeletion(track.id);
          this.snackBar.open('Piste supprimée.', 'Fermer', { duration: 5000 });
          this.load();
        },
        error: (error: unknown) => {
          this.deleting.update((ids) => ids.filter((id) => id !== track.id));
          const unavailable = error instanceof HttpErrorResponse && (error.status === 404 || error.status === 403);
          this.snackBar.open(unavailable
            ? 'Cette piste n’existe plus ou ne vous appartient pas.'
            : this.errorMessage(error, 'Impossible de supprimer cette piste.'), 'Fermer', { duration: 7000 });
          // Même un échec disque peut suivre la suppression de la métadonnée côté API.
          if (unavailable) this.finishDeletion(track.id);
          this.load();
        },
      });
  }

  formatSize(bytes: number): string {
    return bytes < 1024 * 1024
      ? (bytes / 1024).toFixed(1) + ' Ko'
      : (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  private validateFile(file: File): string {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
    if (!allowed.includes(file.type)) return 'Format refusé. Choisissez un fichier MP3, WAV, OGG ou M4A.';
    if (file.size === 0) return 'Le fichier audio est vide.';
    if (file.size > 25 * 1024 * 1024) return 'Le fichier dépasse la limite de 25 Mo.';
    return '';
  }

  private finishDeletion(id: string): void {
    this.deleting.update((ids) => ids.filter((current) => current !== id));
    if (this.currentTrack()?.id === id) this.stopPlayback();
    if (this.audioLoading() === id) {
      this.audioRequest?.unsubscribe();
      this.audioLoading.set(null);
    }
  }

  private stopPlayback(): void {
    const previousUrl = this.audioUrl();
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    this.audioUrl.set('');
    this.currentTrack.set(null);
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (error.status === 0) return 'Le serveur est injoignable. Vérifiez votre connexion et réessayez.';
    if (error.status === 401) return 'Votre session a expiré. Reconnectez-vous.';
    const body: unknown = error.error;
    return body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
      ? body.message : fallback;
  }
}
