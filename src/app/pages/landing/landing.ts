import { Component, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SignIn } from '../sign-in/sign-in';

@Component({
  selector: 'app-landing',
  imports: [RouterModule, ButtonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  providers: [DialogService],
})
export class Landing implements OnDestroy {
  ref: DynamicDialogRef | undefined;

  constructor(public dialogService: DialogService) {}

  showLogin() {
    this.ref = this.dialogService.open(SignIn, {
      width: '500px',
      styleClass: 'headless',
      modal: true,
      breakpoints: {
        '960px': '500px',
        '640px': '400px',
        '400px': '350px',
      },
    });

    this.ref.onClose.subscribe((event: any) => {
      console.log(event);
    });
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
}
