import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { AssistantChatSessionService } from './assistant-chat-session.service';
import { AssistantChatService, AssistantChatResponseDto } from './assistant-chat.service';
import { Subscription } from 'rxjs';

interface ChatLine {
  role: 'user' | 'bot';
  text: string;
  meta?: string;
}

@Component({
  selector: 'app-assistant-chat',
  templateUrl: './assistant-chat.component.html',
  styleUrls: ['./assistant-chat.component.scss']
})
export class AssistantChatComponent implements OnInit, OnDestroy {
  /** Page menu « Assistant » (pleine largeur) ou bulle messagerie (panneau flottant). */
  @Input() variant: 'page' | 'embedded' = 'page';

  inputText = '';
  lines: ChatLine[] = [];
  loading = false;

  private lineSub?: Subscription;

  constructor(
    private assistant: AssistantChatService,
    public session: AssistantChatSessionService,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.lineSub = this.session.lines$.subscribe((l) => (this.lines = l));
  }

  ngOnDestroy(): void {
    this.lineSub?.unsubscribe();
  }

  send(): void {
    const msg = this.inputText.trim();
    if (!msg || this.loading) return;
    this.session.appendLine({ role: 'user', text: msg });
    this.inputText = '';
    this.loading = true;
    this.assistant.chat(msg, this.session.rephraseWithOllama).subscribe({
      next: (res: AssistantChatResponseDto) => {
        let meta = '';
        if (res.intent) meta += `[${res.intent}] `;
        if (res.llmUsed) meta += '· Ollama ';
        if (res.warning) meta += '| ' + res.warning;
        this.session.appendLine({
          role: 'bot',
          text: res.answer || '(réponse vide)',
          meta: meta.trim() || undefined
        });
        this.loading = false;
        setTimeout(() => this.scrollBottom(), 50);
      },
      error: () => {
        this.session.appendLine({
          role: 'bot',
          text: "Erreur lors de l'appel au serveur (vérifiez la connexion et vos droits)."
        });
        this.loading = false;
      }
    });
    setTimeout(() => this.scrollBottom(), 50);
  }

  onKey(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.send();
    }
  }

  private scrollBottom(): void {
    const el = this.host.nativeElement.querySelector('.assistant-log');
    if (el) (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight;
  }
}
