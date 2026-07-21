import { Component, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, type FormGroupDirective } from '@angular/forms';

import { form, FormField, required } from '@angular/forms/signals';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { catchError, from } from 'rxjs';
import type { TripData } from '../trips/trip.model';
import { TripStore } from '../trips/trip.state';

@Component({
  selector: 'app-trip-form',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    FormField,
  ],
  templateUrl: './trip-form.html',
  styleUrl: './trip-form.scss',
})
export class TripForm {
  private readonly store = inject(TripStore);

  formDirective = viewChild.required<FormGroupDirective>('formDirective');

  readonly tripModel = signal<TripData>({
    name: '',
    description: '',
  });
  readonly tripForm = form(this.tripModel, schemaPath => {
    required(schemaPath.name);
  });

  saveTrip(event: Event): void {
    const inputs = this.tripModel();
    from(
      this.store.addTrip(inputs)
    )
      .pipe(
        catchError(error => {
          throw new Error(error.message);
        })
      )
      .subscribe(() => {
        this.resetForm();
      });
    event.preventDefault();
  }
  resetForm(): void {
    this.tripModel.set({
      name: '',
      description: ''
    });
    this.tripForm().reset()
  }
}
