import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { StopService } from '../../services/stop.service';
import { TagService } from '../../services/tag.service';
import {
  getCurrentPosition,
  googleMapsSearchUrl,
  toLocalDateTimeString,
} from '../../utils';
import type { Hotel } from '../../models/hotel';

@Component({
  selector: 'app-hotel-form',
  imports: [
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    MatRadioModule,
    MatDatepickerModule,
    MatDialogModule,
  ],
  templateUrl: './hotel-form.html',
  styleUrl: './hotel-form.scss',
})
export class HotelForm implements OnInit {
  private readonly tagsApi = inject(TagService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<HotelForm>);
  private readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = new FormBuilder();
  private stopService = inject(StopService);

  stops = toSignal(this.stopService.list$(), { initialValue: [] });

  hotelGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    where: new FormControl(''),
    imageSrc: new FormControl('', []),
    link: new FormControl('', [Validators.required]),
    mapLink: new FormControl(''),
    checkIn: new FormControl('', [Validators.required]),
    checkOut: new FormControl('', [Validators.required]),
    comment: new FormControl(''),
    tagId: new FormControl(''),
    stopId: new FormControl(''),
  });

  checkInOutForm = this.fb.group({
    checkIn: this.fb.group({
      date: [new Date(), Validators.required],
      time: ['', Validators.required],
    }),
    checkOut: this.fb.group({
      date: [new Date(), Validators.required],
      time: ['', Validators.required],
    }),
  });

  datetime = new FormControl();
  time = new FormControl();

  submit = output<Hotel>();
  hotel = input<Hotel | null>(this.data?.hotel ?? null);
  tags = toSignal(this.tagsApi.list$(), { initialValue: [] });
  selectedFileName = '';
  imagePreview: string | null = null;

  private readonly _currentFullDate = new Date();
  private readonly _currentYear = this._currentFullDate.getFullYear();
  private readonly _currentDate = this._currentFullDate.getDate();
  private readonly _currentMonth = this._currentFullDate.getMonth();

  readonly minDate = new Date(
    this._currentYear,
    this._currentMonth - 1,
    this._currentDate
  );
  readonly maxDate = new Date(this._currentYear + 1, 1, 1);

  constructor() {
    effect(() => {
      const hotel = this.hotel();
      if (!hotel) {
        this.hotelGroup.reset(
          {
            name: '',
            imageSrc: '',
            link: '',
            checkIn: this._currentFullDate.toISOString().substring(0, 16),
            checkOut: this._currentFullDate.toISOString().substring(0, 16),
            comment: '',
            tagId: '',
            stopId: '',
            mapLink: '',
          },
          { emitEvent: false }
        );
        this.checkInOutForm.reset(
          {
            checkIn: {
              date: this._currentFullDate,
              time: toLocalDateTimeString(this._currentFullDate).substring(
                11,
                16
              ),
            },
            checkOut: {
              date: this._currentFullDate,
              time: toLocalDateTimeString(this._currentFullDate).substring(
                11,
                16
              ),
            },
          },
          { emitEvent: false }
        );
        return;
      }

      this.hotelGroup.patchValue(
        {
          name: hotel.name ?? '',
          where: hotel.where ?? '',
          link: hotel.link ?? '',
          checkIn: hotel.checkIn ?? '',
          checkOut: hotel.checkOut ?? '',
          comment: hotel.comment ?? '',
          imageSrc: hotel.imageSrc ?? '',
          tagId: hotel.tagId ?? '',
          stopId: hotel.stopId ?? '',
          mapLink: hotel.mapLink ?? '',
        },
        { emitEvent: false }
      );

      this.checkInOutForm.reset(
        {
          checkIn: {
            date: new Date(hotel.checkIn),
            time: toLocalDateTimeString(new Date(hotel.checkIn)).substring(
              11,
              16
            ),
          },
          checkOut: {
            date: new Date(hotel.checkOut),
            time: toLocalDateTimeString(new Date(hotel.checkOut)).substring(
              11,
              16
            ),
          },
        },
        { emitEvent: true }
      );
    });
  }

  async tryToGetGoogleLink(): Promise<void> {
    try {
      const coords = await getCurrentPosition();
      const url = googleMapsSearchUrl({ lat: coords.lat, lng: coords.lng });
      this.hotelGroup.controls.mapLink.setValue(url, { emitEvent: true });
    } catch (e) {}
  }

  ngOnInit() {
    this.checkInOutForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ checkIn, checkOut }) => {
      if (checkIn?.date && checkIn.time) {
        const [hours, minutes] = checkIn.time.split(':').map(Number);
        const result = new Date(checkIn.date);

        result.setHours(hours);
        result.setMinutes(minutes);
        result.setSeconds(0);
        result.setMilliseconds(0);
        this.hotelGroup.controls.checkIn.setValue(
          toLocalDateTimeString(new Date(result)),
          { emitEvent: true }
        );
      }
      if (checkOut?.date && checkOut.time) {
        const [hours, minutes] = checkOut.time.split(':').map(Number);
        const result = new Date(checkOut.date);

        result.setHours(hours);
        result.setMinutes(minutes);
        result.setSeconds(0);
        result.setMilliseconds(0);
        this.hotelGroup.controls.checkOut.setValue(
          toLocalDateTimeString(new Date(result)),
          { emitEvent: true }
        );
      }
    });
  }

  onSubmit(): void {
    const _hotel = {
      ...(this.hotel() ?? {}),
      name: this.hotelGroup.controls.name.getRawValue(),
      where: this.hotelGroup.controls.where.getRawValue(),
      imageSrc: this.hotelGroup.controls.imageSrc.getRawValue(),
      link: this.hotelGroup.controls.link.getRawValue(),
      checkIn: this.hotelGroup.controls.checkIn.getRawValue(),
      checkOut: this.hotelGroup.controls.checkOut.getRawValue(),
      comment: this.hotelGroup.controls.comment.getRawValue(),
      mapLink: this.hotelGroup.controls.mapLink.getRawValue(),
      tagId: this.hotelGroup.controls.tagId.getRawValue(),
      stopId: this.hotelGroup.controls.stopId.getRawValue(),
    } as Hotel;

    this.submit.emit(_hotel);
    this.save(_hotel);
  }

  save(hotel: Hotel) {
    this.dialogRef.close(hotel);
  }

  cancel() {
    this.dialogRef.close();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.selectedFileName = file.name;

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;

      this.imagePreview = result;

      this.hotelGroup.patchValue(
        {
          imageSrc: result,
        },
        { emitEvent: true }
      );

      this.hotelGroup.get('imageSrc')?.markAsDirty();
      this.hotelGroup.get('imageSrc')?.updateValueAndValidity();
    };

    reader.readAsDataURL(file);
  }
}
