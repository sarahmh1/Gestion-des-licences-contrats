import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-assistant-fab',
  templateUrl: './assistant-fab.component.html',
  styleUrls: ['./assistant-fab.component.scss']
})
export class AssistantFabComponent implements OnInit, OnDestroy {
  panelOpen = false;
  /** Masque le FAB sur la page plein écran Assistant pour éviter le doublon. */
  hideFab = false;
  private routeSub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.hideFab = this.isAssistantRoute(this.router.url);
    this.routeSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.hideFab = this.isAssistantRoute(this.router.url);
        if (this.hideFab) {
          this.panelOpen = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private isAssistantRoute(url: string): boolean {
    return /\/assistant(\?|$|\/)/.test(url) || url.endsWith('/assistant');
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.panelOpen) {
      this.closePanel();
    }
  }
}
