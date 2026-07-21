import {
  patchState,
  signalStore,
  withMethods,
  withState
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { ApiClient } from '../../services/api-client.service';
import type { Trip } from './trip.model';

type TripState = { trips: Trip[]; isLoading: boolean; error: string | null };
const initialState: TripState = {
  trips: [],
  isLoading: false,
  error: null,
};

export const TripStore = signalStore(
  // Adds state slices as signals automatically (e.g., store.count())
  withState(initialState),
  // Adds methods to update or interact with the state
  withMethods((store, api = inject(ApiClient)) => ({
    async loadTrips(): Promise<void> {
      // 1. Set loading state to true and clear previous errors
      patchState(store, { isLoading: true, error: null });

      try {
        // 2. Fetch data from your API
        const data = await api.get<Trip[]>('data/trips');

        // 3. Update the store with the incoming data
        patchState(store, { trips: data, isLoading: false });
      } catch (err: any) {
        // 4. Handle any network or parsing errors
        patchState(store, {
          error: err.message || 'Something went wrong',
          isLoading: false,
        });
      }
    },
    async addTrip(payload: Pick<Trip, 'name' | 'description'>): Promise<void> {
      try {
        await api.create('trips', {
          name: payload.name,
          description: payload.description ?? '',
        });
        await this.loadTrips();
      } catch (err: any) {
        // 4. Handle any network or parsing errors
        patchState(store, {
          error: err.message || 'Something went wrong',
          isLoading: false,
        });
      }
    },
    async deleteTrip(trip: Trip): Promise<void> {
      try {
        await api.remove('trips', trip.id);
        await this.loadTrips();
      } catch (err: any) {
        // 4. Handle any network or parsing errors
        patchState(store, {
          error: err.message || 'Something went wrong',
          isLoading: false,
        });
      }
    }
  }))
);
