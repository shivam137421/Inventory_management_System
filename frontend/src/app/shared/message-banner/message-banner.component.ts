import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" [ngClass]="type === 'success' ? 'banner banner-success' : 'banner banner-error'">
      <span>{{ message }}</span>
    </div>
  `
})
export class MessageBannerComponent {
  @Input() type: 'success' | 'error' | null = null;
  @Input() message: string | null = null;
}
