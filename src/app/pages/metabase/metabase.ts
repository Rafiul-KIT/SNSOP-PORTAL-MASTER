import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MetabaseSsoService } from '../../../services/metabase-sso.service';

@Component({
  selector: 'app-metabase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metabase.html',
  styleUrl: './metabase.scss'
})
export class Metabase implements OnInit {
  error = signal<string>('');
  isLoading = signal<boolean>(true);

  constructor(
    private metabaseSsoService: MetabaseSsoService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.connectToMetabase();
  }

  async connectToMetabase(): Promise<void> {
    this.error.set('');
    this.isLoading.set(true);
    try {
      await this.metabaseSsoService.startLogin();
      await this.router.navigateByUrl('/home/portals');
    } catch (err: any) {
      this.error.set(err?.message || 'Unable to start Metabase SSO.');
      this.isLoading.set(false);
    }
  }
}
