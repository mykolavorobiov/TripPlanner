import {
  Component,
  computed,
  inject,
  output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { exhaustMap, filter, from, map, type Observable } from 'rxjs';
import { Confirmation } from '../confirmation';
import type { Trip } from './trip.model';
import { TripStore } from './trip.state';

@Component({
  selector: 'app-trips',
  imports: [MatChipsModule, FormsModule, MatIconModule, Confirmation, MatProgressBarModule],
  templateUrl: './trips.html',
  styleUrl: './trips.scss'
})
export class Trips {
  edit = output<Trip>();
  delete = output();
  private hasRefresh = signal(Date.now());
  private readonly store = inject(TripStore);


  trips = computed<Trip[]>(() => {
    return this.store.trips();
  });
  isLoadingTrips = computed(() => this.store.isLoading());

  ngOnInit(): void {
    this.store.loadTrips();
  }

  onEdit(trip: Trip): void {
    this.edit.emit(trip);
  }
  onDelete(trip: Trip, confirmationSub: () => Observable<boolean>, event: PointerEvent): void {
    const trigger$ = event.shiftKey ? from(this.store.deleteTrip(trip)).pipe(map(() => true)) : confirmationSub().pipe(
      filter(isConfirmed => !!isConfirmed)
    );
    trigger$.pipe(
      exhaustMap(() => from(this.store.deleteTrip(trip)))
    ).subscribe();
    
  }
}
