import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AssistantChatLine {
  role: 'user' | 'bot';
  text: string;
  meta?: string;
}

@Injectable({ providedIn: 'root' })
export class AssistantChatSessionService {
  static readonly defaultWelcome: AssistantChatLine = {
    role: 'bot',
    text: 'Bonjour, comment puis-je vous aider ?'
  };

  private linesSource = new BehaviorSubject<AssistantChatLine[]>([
    { ...AssistantChatSessionService.defaultWelcome }
  ]);
  readonly lines$ = this.linesSource.asObservable();

  rephraseWithOllama = true;

  get lines(): AssistantChatLine[] {
    return this.linesSource.value;
  }

  appendLine(line: AssistantChatLine): void {
    this.linesSource.next([...this.linesSource.value, line]);
  }

  resetConversation(): void {
    this.linesSource.next([{ ...AssistantChatSessionService.defaultWelcome }]);
  }
}
