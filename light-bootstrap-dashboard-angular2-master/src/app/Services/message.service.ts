import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MessageDTO {
    id?: number;
    content: string;
    senderId: number;
    senderName?: string;
    senderEmail?: string;
    receiverId: number;
    receiverName?: string;
    receiverEmail?: string;
    timestamp?: Date;
    isRead?: boolean;
    // File attachment fields
    fileName?: string;
    filePath?: string;
    fileType?: string;
    originalFileName?: string;
    // Delete flags
    deletedForEveryone?: boolean;
}

export interface ConversationDTO {
    id: number;
    otherUserId: number;
    otherUserName: string;
    otherUserEmail: string;
    otherUserProfilePicture?: string;
    lastMessageTime: Date;
    lastMessage: string;
    unreadCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    private apiUrl = `${environment.apiUrl}/api/messages`;

    constructor(private http: HttpClient) { }

    /**
     * Récupère toutes les conversations d'un utilisateur
     */
    getUserConversations(userId: number): Observable<ConversationDTO[]> {
        return this.http.get<ConversationDTO[]>(`${this.apiUrl}/conversations/${userId}`);
    }

    /**
     * Récupère tous les messages d'une conversation
     */
    getConversationMessages(user1Id: number, user2Id: number): Observable<MessageDTO[]> {
        return this.http.get<MessageDTO[]>(`${this.apiUrl}/conversation/${user1Id}/${user2Id}`);
    }

    /**
     * Marque les messages comme lus
     */
    markMessagesAsRead(senderId: number, receiverId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/mark-read`, { senderId, receiverId });
    }

    /**
     * Compte les messages non lus
     */
    getUnreadCount(userId: number): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/unread-count/${userId}`);
    }

    /**
     * Envoie un message via HTTP
     */
    sendMessage(message: MessageDTO): Observable<MessageDTO> {
        return this.http.post<MessageDTO>(`${this.apiUrl}/send`, message);
    }

    /**
     * Envoie un message avec fichier joint
     */
    sendMessageWithFile(senderId: number, receiverId: number, content: string, file: File): Observable<MessageDTO> {
        const formData = new FormData();
        formData.append('senderId', senderId.toString());
        formData.append('receiverId', receiverId.toString());
        formData.append('content', content || '');
        formData.append('file', file);
        return this.http.post<MessageDTO>(`${this.apiUrl}/send-with-file`, formData);
    }

    /**
     * Supprime un message pour moi seulement
     */
    deleteMessageForMe(messageId: number, userId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete-for-me/${messageId}/${userId}`);
    }

    /**
     * Supprime un message pour tout le monde
     */
    deleteMessageForEveryone(messageId: number, userId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete-for-everyone/${messageId}/${userId}`);
    }

    /**
     * Supprime une conversation pour un utilisateur (soft delete)
     */
    deleteConversation(conversationId: number, userId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/conversation/${conversationId}/user/${userId}`);
    }

    /**
     * Construit l'URL de téléchargement d'un fichier
     */
    getFileDownloadUrl(filePath: string): string {
        return `${environment.apiUrl}/${filePath}`;
    }
}

