import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { combineLatest, startWith } from 'rxjs';
import { Stop } from '../../models/stop';
import { TagService } from '../../services/tag.service';
import { getCurrentPosition, googleMapsSearchUrl, toLocalDateTimeString } from '../../utils';






@Component({
  selector: 'app-stop-form',
  imports: [
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    MatRadioModule,
    MatDatepickerModule,
    MatDialogModule
  ],
  templateUrl: './stop-form.html',
  styleUrl: './stop-form.scss',
})
export class StopForm {
  private readonly tagsApi = inject(TagService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<StopForm>);
  private readonly data = inject(MAT_DIALOG_DATA);

  eventGroup = new FormGroup({
    where: new FormControl('', [Validators.required]),
    datetime: new FormControl('', [Validators.required]),
    time: new FormControl(''),
    goal: new FormControl('', [Validators.required]),
    mapLink: new FormControl(''),
    comment: new FormControl(''),
    tagId: new FormControl('')
  });
  datetime = new FormControl();
  time = new FormControl();

  addStop = output<Stop>();
  stop = input<Stop | null>(this.data?.stop ?? null);
  tags = toSignal(this.tagsApi.list$(), { initialValue: [] });

  private readonly _currentYear = new Date().getFullYear();
  private readonly _currentDate = new Date().getDate();
  private readonly _currentMonth = new Date().getMonth();
  readonly minDate = new Date(this._currentYear, this._currentMonth - 1, this._currentDate);
  readonly maxDate = new Date(this._currentYear + 1, 1, 1);


  constructor() {
    effect(() => {
      const s = this.stop();
      if (!s) {
        this.eventGroup.reset({
          where: '',
          datetime: '',
          goal: '',
          mapLink: '',
          comment: '',
          tagId: '',
          time: '15:00'
        }, { emitEvent: false });
        return;
      }


      this.eventGroup.patchValue({
        where: s.where ?? '',
        datetime: s.datetime ?? '',
        goal: s.goal ?? '',
        mapLink: s.mapLink ?? '',
        comment: s.comment ?? '',
        tagId: s.tagIds?.[0] ?? ''
      }, { emitEvent: false });

      if (s.datetime) {
        const currentDate = new Date(s.datetime);
        const time = currentDate.toTimeString().slice(0, 5);
        this.datetime.setValue(currentDate, { emitEvent: true });
        this.time.setValue(time, { emitEvent: true });
      }
    })
  }

  async tryToGetGoogleLink(): Promise<void> {
    try {
      const coords = await getCurrentPosition();
      const url = googleMapsSearchUrl({ lat: coords.lat, lng: coords.lng });
      this.eventGroup.controls.mapLink.setValue(url, { emitEvent: true })
    } catch (e) { }
  }

  ngOnInit() {
    combineLatest({
      time: this.time.valueChanges.pipe(startWith(null)),
      date: this.datetime.valueChanges.pipe(startWith(null)),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ time, date }) => {
      if (time && date) {
        const [hours, minutes] = time.split(':').map(Number);
        const result = new Date(date);
        result.setHours(hours);
        result.setMinutes(minutes);
        result.setSeconds(0);
        result.setMilliseconds(0);
        this.eventGroup.controls.datetime.setValue(toLocalDateTimeString(new Date(result)), { emitEvent: true });
        this.eventGroup.markAsDirty();
        this.eventGroup.markAsPristine();
        this.eventGroup.markAsTouched();
      }
    });
  }

  onSubmit(): void {
    const _stop = {
      ...(this.stop() ?? {}),
      where: this.eventGroup.controls.where.getRawValue(),
      datetime: this.eventGroup.controls.datetime.getRawValue(),
      goal: this.eventGroup.controls.goal.getRawValue(),
      mapLink: this.eventGroup.controls.mapLink.getRawValue(),
      comment: this.eventGroup.controls.comment.getRawValue(),
      tagIds: [this.eventGroup.controls.tagId.getRawValue()].filter(Boolean)
    } as Stop;
    this.addStop.emit(_stop);
    this.save(_stop);
  }

  save(stop: Stop) {
    this.dialogRef.close(stop);
  }

  cancel() {
    this.dialogRef.close();
  }
}
