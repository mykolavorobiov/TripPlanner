import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { StopForm } from '../stop-form/stop-form';

import { toSignal } from '@angular/core/rxjs-interop';
import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Stop, TravelEvent, TravelEventCreation } from '../../models';
import { StopService } from '../../services/stop.service';
import { TagService } from '../../services/tag.service';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';
import { HotelList } from "../hotel-list/hotel-list";
import { StopList } from "../stop-list/stop-list";
import { TagListComponent } from '../tag-list/tag-list';
import { TripForm } from '../trip-form/trip-form';
import { Trips } from '../trips/trips';

@Component({
  selector: 'app-main-list',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatTabsModule,
    MatChipsModule,
    CommonModule,
    MatDialogModule,
    TagListComponent,
    MatBadgeModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    StopList,
    HotelList,
    TripForm,
    Trips,
],
  templateUrl: './main-list.html',
  styleUrl: './main-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainList {
  private stopService = inject(StopService);
  private tagsApi = inject(TagService);
  private readonly dialog = inject(MatDialog);
  readonly panelOpenState = signal(false);

  stops = toSignal(this.stopService.list$(), { initialValue: [] });
  tags = toSignal(this.tagsApi.list$(), { initialValue: [] });
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
      this.addStop(stop)
    })
  }
  startEditStop(stop: Stop): void {
    const ref = this.dialog.open(StopForm, {
      data: {
        stop
      }
    });
    ref.afterClosed().subscribe(stop => {
      if (!stop) return;
      this.addStop(stop)
    })
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
    })
  }
}
