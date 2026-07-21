import { CommonModule } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { Stop, TravelEvent, TravelEventCreation } from '../../models';
import { StopService } from '../../services/stop.service';
import { TagService } from '../../services/tag.service';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';
import { StopForm } from '../stop-form/stop-form';

@Component({
  selector: 'app-stop-list',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatTabsModule,
    MatChipsModule,
    CommonModule,
    MatDialogModule,
    MatBadgeModule,
    MatListModule,
    MatIconModule,
    MatAccordion,
    MatExpansionModule,
  ],
  templateUrl: './stop-list.html',
  styleUrl: './stop-list.scss',
})
export class StopList {
  private stopService = inject(StopService);
  private tagsApi = inject(TagService);
  private readonly dialog = inject(MatDialog);
  readonly accordion = viewChild.required(MatAccordion);

  stops = toSignal(this.stopService.list$(), { initialValue: [] });
  tags = toSignal(this.tagsApi.list$(), { initialValue: [] });
  noCommentLabel = $localize`:@@common.noComment:Без коментаря`;
  selectedStop = signal<Stop | null>(null);
  currentEvent = signal<TravelEvent | null>(null);
  eventCreation = signal<TravelEventCreation | null>(null);

  getTagName(stop: Stop): string | undefined {
    const tags = this.tags() ?? [];
    return tags.find(t => t.id === stop.tagIds?.at(0))?.name;
  }

  createStop(): void {
    const ref = this.dialog.open(StopForm);
    ref.afterClosed().subscribe(stop => {
      if (!stop) return;
      this.addStop(stop);
    });
  }
  startEditStop(stop: Stop): void {
    const ref = this.dialog.open(StopForm, {
      data: {
        stop,
      },
    });
    ref.afterClosed().subscribe(stop => {
      if (!stop) return;
      this.addStop(stop);
    });
  }

  cancelStop(): void {
    this.eventCreation.set(null);
    this.selectedStop.set(null);
  }

  addStop(stop: Stop): void {
    if (stop.id) {
      this.stopService.update(stop.id, stop);
    } else {
      this.stopService.add(stop);
    }

    this.selectedStop.set(null);
  }

  deleteStop(stop: Stop): void {
    const dialog = this.dialog.open(ConfirmationDialog, {
      width: 'auto',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
    });
    dialog.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.stopService.remove(stop.id);
      }
    });
  }
}
