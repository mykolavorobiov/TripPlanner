import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Tag } from '../../models';
import { TagService } from '../../services/tag.service';

@Component({
  selector: 'app-tag-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatExpansionModule,
  ],
  templateUrl: './tag-list.html',
  styleUrl: './tag-list.scss',
})
export class TagListComponent {
  private tagsApi = inject(TagService);

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  readonly addOnBlur = true;

  tags = toSignal(this.tagsApi.list$(), { initialValue: [] });
  loading = signal(false);
  error = signal('');

  private async run<T>(fn: () => Promise<T>) {
    this.error.set('');
    this.loading.set(true);
    try {
      return await fn();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      this.error.set(err?.code
        ? $localize`:@@common.errorPrefix:Помилка: ${err.code}:errorCode:`
        : (err?.message ?? String(e)));
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  add(event: MatChipInputEvent) {
    const value = (event.value ?? '').trim();
    const input = event.chipInput?.inputElement;
    if (input) input.value = '';

    if (!value) return;

    const exists = this.tags().some((t: Tag) => t.name.trim().toLowerCase() === value.toLowerCase());
    if (exists) return;

    this.run(() => this.tagsApi.add({ name: value }));
  }

  remove(tag: Tag) {
    this.run(() => this.tagsApi.remove(tag.id));
  }

  edit(tag: Tag, event: { value: string }) {
    const value = (event.value ?? '').trim();

    if (!value) {
      this.remove(tag);
      return;
    }

    if (value === tag.name) return;

    const exists = this.tags().some(
      (t: Tag) => t.id !== tag.id && t.name.trim().toLowerCase() === value.toLowerCase()
    );
    if (exists) return;

    this.run(() => this.tagsApi.update(tag.id, { name: value }));
  }

  editDescription(tagName: string): string {
    return $localize`:@@tags.editDescription:Натисніть Enter, щоб редагувати ${tagName}:tagName:`;
  }

  editAriaLabel(tagName: string): string {
    return $localize`:@@tags.editAria:Редагувати ${tagName}:tagName:`;
  }

  removeAriaLabel(tagName: string): string {
    return $localize`:@@tags.removeAria:Видалити ${tagName}:tagName:`;
  }
}
