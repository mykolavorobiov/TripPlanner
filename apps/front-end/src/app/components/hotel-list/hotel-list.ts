import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChip } from "@angular/material/chips";
import { MatDialog } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { HotelService } from '../../services/hotel.service';
import { HotelForm } from '../hotel-form/hotel-form';
import type { Hotel } from '../../models/hotel';

@Component({
  selector: 'app-hotel-list',
  imports: [MatIconModule, MatCardModule, MatGridListModule, MatButtonModule, DatePipe, MatChip],
  templateUrl: './hotel-list.html',
  styleUrl: './hotel-list.scss',
})
export class HotelList {
  private readonly dialog = inject(MatDialog);
  private hotelService = inject(HotelService);

  readonly hotels = toSignal(this.hotelService.list$(), { initialValue: [] });

  create() {
    this.openForm();
  }
  edit(hotel: Hotel) {
    this.openForm(hotel);
  }
  remove(hotel: Hotel) {
    this.hotelService.remove(hotel.id);
  }
  private openForm(hotel: Hotel | null = null): void {
    const ref = this.dialog.open(HotelForm, {
      maxWidth: 'auto',
      width: '95%',
      data: { hotel },
    });
    ref.afterClosed().subscribe((hotel: Hotel | undefined) => {
      if (!hotel) return;
      if (hotel.id) {
        this.hotelService.update(hotel.id, hotel);
      } else {
        this.hotelService.add(hotel);
      }
    });
  }
}
