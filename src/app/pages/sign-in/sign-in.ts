import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-sign-in',
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
  providers: [DialogService],
})
export class SignIn implements OnInit {
  showLogin: boolean = true;
  loginForm: any = {};
  forgotPasswordForm: any = {};

  constructor(
    private dialogService: DialogService,
    private ref: DynamicDialogRef
  ) {
    this.loginForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
    });

    this.forgotPasswordForm = new FormGroup({
      username: new FormControl('', Validators.required),
    });
  }

  closeDialog = () => this.ref?.close();

  // Login & Forgot Password Toggler

  viewToggle(state: boolean) {
    this.loginForm.reset();
    this.forgotPasswordForm.reset();
    this.showLogin = state;
  }

  ngOnInit() {}
}
