import { Directive, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from './confirmation-dialog/confirmation-dialog';

@Directive({
  selector: '[appConfirmation]',
  exportAs: 'confirmation',
})
export class Confirmation {
  private readonly dialog = inject(MatDialog);

  confirm$ = () => {
    const dialog = this.dialog.open(ConfirmationDialog, {
      width: 'auto',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
    });
    return dialog.afterClosed();
  }
}
