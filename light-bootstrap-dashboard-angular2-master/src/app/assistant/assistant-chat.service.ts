import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface AssistantChatResponseDto {
  answer: string;
  intent?: string;
  llmUsed?: boolean;
  warning?: string;
}

@Injectable({ providedIn: 'root' })
export class AssistantChatService {

  private readonly url = `${environment.apiUrl}/api/assistant/chat`;

  constructor(private http: HttpClient) { }

  chat(message: string, rephraseWithLlm: boolean = false): Observable<AssistantChatResponseDto> {
    return this.http.post<AssistantChatResponseDto>(this.url, { message, rephraseWithLlm });
  }
}
