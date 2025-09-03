import { Component, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SignIn } from '../sign-in/sign-in';
import { Header } from '../../layout/header/header';

@Component({
  selector: 'app-home',
  imports: [RouterModule, ButtonModule, Header],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  providers: [DialogService],
})
export class Home implements OnDestroy {
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
