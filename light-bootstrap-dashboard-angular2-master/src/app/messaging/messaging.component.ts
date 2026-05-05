import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { MessageService, ConversationDTO, MessageDTO } from '../Services/message.service';
import { WebsocketService } from '../Services/websocket.service';
import { UserService } from '../Services/user.service';
import { AuthService } from '../auth/AuthService';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs';

interface UserDTO {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    profilePicture?: string;
}

@Component({
    selector: 'app-messaging',
    templateUrl: './messaging.component.html',
    styleUrls: ['./messaging.component.css']
})
export class MessagingComponent implements OnInit, OnDestroy {
    conversations: ConversationDTO[] = [];
    selectedConversation: ConversationDTO | null = null;
    messages: MessageDTO[] = [];
    newMessage: string = '';
    currentUserId: number = 0;
    currentUserName: string = '';
    isTyping: boolean = false;
    typingTimeout: any;
    selectedFile: File | null = null;

    // Voice recording
    isRecording: boolean = false;
    mediaRecorder: MediaRecorder | null = null;
    audioChunks: Blob[] = [];
    recordingTime: number = 0;
    recordingInterval: any = null;

    // Lightbox pour image agrandie
    lightboxImageUrl: string | null = null;
    lightboxImageName: string = '';

    // Nouvelle conversation
    showNewConversationModal: boolean = false;
    allUsers: UserDTO[] = [];
    filteredUsers: UserDTO[] = [];
    userSearchQuery: string = '';
    conversationSearchQuery: string = '';

    private messageSubscription?: Subscription;
    private typingSubscription?: Subscription;


    constructor(
        private messageService: MessageService,
        private websocketService: WebsocketService,
        private userService: UserService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        // Récupérer l'utilisateur connecté via AuthService
        const currentUser = this.authService.getUser();
        console.log('Utilisateur connecté (AuthService):', currentUser);

        if (currentUser && (currentUser.id || currentUser.userId)) {
            this.currentUserId = currentUser.id || currentUser.userId;
            this.currentUserName = `${currentUser.firstname} ${currentUser.lastname}`;
            console.log('✅ ID utilisateur récupéré:', this.currentUserId);
            console.log('✅ Nom utilisateur récupéré:', this.currentUserName);
        } else {
            // Fallback: essayer de récupérer directement depuis localStorage
            const userStr = localStorage.getItem('user');
            console.log('localStorage user string:', userStr);
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    console.log('User depuis localStorage:', user);
                    this.currentUserId = user.id || user.userId || user.ID || 0;
                    if (user.firstname && user.lastname) {
                        this.currentUserName = `${user.firstname} ${user.lastname}`;
                    }
                    console.log('✅ Récupération du fallback - ID:', this.currentUserId);
                } catch (e) {
                    console.error('Erreur parsing user:', e);
                }
            }

            if (this.currentUserId === 0) {
                console.warn('⚠️ Pas d\'ID utilisateur trouvé - veuillez vous reconnecter pour activer la messagerie');
                // Ne pas bloquer - continuer avec des fonctionnalités limitées
            }
        }

        // Connecter au WebSocket
        this.websocketService.connect(this.currentUserId.toString());

        // Charger les conversations pour cet utilisateur spécifiquement
        this.loadConversations();

        // S'abonner aux nouveaux messages
        this.messageSubscription = this.websocketService.getMessages().subscribe(message => {
            if (message) {
                this.handleNewMessage(message);
            }
        });

        // S'abonner aux indicateurs de saisie
        this.typingSubscription = this.websocketService.getTypingIndicators().subscribe(userId => {
            if (userId && this.selectedConversation && userId === this.selectedConversation.otherUserId) {
                this.isTyping = true;
                clearTimeout(this.typingTimeout);
                this.typingTimeout = setTimeout(() => {
                    this.isTyping = false;
                }, 3000);
            }
        });
    }

    ngOnDestroy(): void {
        this.websocketService.disconnect();
        this.messageSubscription?.unsubscribe();
        this.typingSubscription?.unsubscribe();
    }

    loadConversations(): void {
        this.messageService.getUserConversations(this.currentUserId).subscribe(
            conversations => {
                this.conversations = conversations;
            },
            error => {
                console.error('Erreur lors du chargement des conversations:', error);
            }
        );
    }

    filterConversations(): ConversationDTO[] {
        if (!this.conversationSearchQuery.trim()) {
            return this.conversations;
        }
        const query = this.conversationSearchQuery.toLowerCase();
        return this.conversations.filter(c =>
            c.otherUserName.toLowerCase().includes(query) ||
            c.otherUserEmail?.toLowerCase().includes(query)
        );
    }

    selectConversation(conversation: ConversationDTO): void {
        this.selectedConversation = conversation;
        this.loadMessages(conversation.otherUserId);

        // Marquer les messages comme lus
        this.messageService.markMessagesAsRead(conversation.otherUserId, this.currentUserId).subscribe();
    }

    loadMessages(otherUserId: number): void {
        this.messageService.getConversationMessages(this.currentUserId, otherUserId).subscribe(
            messages => {
                this.messages = messages;
                setTimeout(() => this.scrollToBottom(), 100);
            },
            error => {
                console.error('Erreur lors du chargement des messages:', error);
            }
        );
    }

    sendMessage(): void {
        if (!this.newMessage.trim() || !this.selectedConversation) {
            return;
        }

        const message: MessageDTO = {
            content: this.newMessage,
            senderId: this.currentUserId,
            receiverId: this.selectedConversation.otherUserId
        };

        // Ajouter le message localement immédiatement (optimistic UI)
        const tempMessage: MessageDTO = {
            ...message,
            timestamp: new Date()
        };
        this.messages.push(tempMessage);
        this.newMessage = '';
        setTimeout(() => this.scrollToBottom(), 100);

        // Envoyer via HTTP
        this.messageService.sendMessage(message).subscribe(
            savedMessage => {
                console.log('Message envoyé avec succès:', savedMessage);
                // Remplacer le message temporaire par le message sauvegardé
                const index = this.messages.indexOf(tempMessage);
                if (index > -1) {
                    this.messages[index] = savedMessage;
                }
                // Recharger les conversations pour mettre à jour les aperçus
                this.loadConversations();
            },
            error => {
                console.error('Erreur lors de l\'envoi du message:', error);
                // Retirer le message temporaire en cas d'erreur
                const index = this.messages.indexOf(tempMessage);
                if (index > -1) {
                    this.messages.splice(index, 1);
                }
                alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
            }
        );
    }

    onTyping(): void {
        if (this.selectedConversation) {
            this.websocketService.sendTypingIndicator(this.currentUserId, this.selectedConversation.otherUserId);
        }
    }

    handleNewMessage(message: MessageDTO): void {
        // Ajouter le message à la liste si c'est la conversation active (évite doublon si déjà ajouté via HTTP)
        if (this.selectedConversation &&
            (message.senderId === this.selectedConversation.otherUserId ||
                message.receiverId === this.selectedConversation.otherUserId)) {
            if (message.id != null && this.messages.some(m => m.id === message.id)) {
                return;
            }
            this.messages.push(message);
            setTimeout(() => this.scrollToBottom(), 100);
        }

        // Recharger les conversations pour mettre à jour les aperçus
        this.loadConversations();
    }

    /**
     * Sur http://IP les navigateurs bloquent le micro ; on propose l’envoi d’un fichier audio.
     */
    get liveMicAllowedForMessaging(): boolean {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
        return !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;
    }

    get voiceMessagingButtonTitle(): string {
        return this.liveMicAllowedForMessaging
            ? 'Enregistrer un message vocal'
            : 'Choisir un fichier audio (micro en direct : HTTPS ou localhost)';
    }

    onVoiceMessagingClick(): void {
        if (this.liveMicAllowedForMessaging) {
            this.startRecording();
        } else {
            const el = document.getElementById('voiceFallbackFileInput') as HTMLInputElement;
            if (el) {
                el.value = '';
                el.click();
            }
        }
    }

    onVoiceFallbackFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file || !this.selectedConversation) return;

        this.messageService.sendMessageWithFile(
            this.currentUserId,
            this.selectedConversation.otherUserId,
            '',
            file
        ).subscribe(
            message => {
                if (message.id == null || !this.messages.some(m => m.id === message.id)) {
                    this.messages.push(message);
                }
                this.scrollToBottom();
                this.loadConversations();
            },
            error => {
                console.error('Erreur envoi fichier audio:', error);
                alert('Erreur lors de l\'envoi du fichier audio.');
            }
        );
    }

    scrollToBottom(): void {
        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    formatTime(timestamp: Date): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    // ========== Nouvelle Conversation ==========

    openNewConversationModal(): void {
        this.showNewConversationModal = true;
        this.userSearchQuery = '';
        this.loadAllUsers();
    }

    closeNewConversationModal(): void {
        this.showNewConversationModal = false;
        this.userSearchQuery = '';
        this.filteredUsers = [];
    }

    loadAllUsers(): void {
        console.log('🔄 loadAllUsers() appelé - currentUserId:', this.currentUserId);
        
        // Utiliser l'endpoint pour les utilisateurs disponibles pour la messagerie
        this.userService.getAvailableUsersForMessaging().subscribe(
            (users: any[]) => {
                console.log('✅ Réponse de /available-for-messaging:', users);
                console.log('   Nombre d\'utilisateurs reçus:', users.length);
                
                // Filtrer pour exclure l'utilisateur actuel
                this.allUsers = users
                    .filter(u => {
                        const shouldInclude = u.id !== this.currentUserId;
                        console.log('   ' + (shouldInclude ? '✅' : '❌') + ' ID:' + u.id + ' vs currentUserId:' + this.currentUserId + ' | ' + u.email);
                        return shouldInclude;
                    })
                    .map(u => ({
                        id: u.id,
                        firstname: u.firstname || u.firstName || '',
                        lastname: u.lastname || u.lastName || '',
                        email: u.email || '',
                        profilePicture: u.profilePicture || u.ProfilePicture
                    }));
                
                this.filteredUsers = this.allUsers;
                console.log('✅ Utilisateurs après filtrage:', this.allUsers.length);
                this.allUsers.forEach((u, i) => {
                    console.log('   [' + i + '] ' + u.firstname + ' ' + u.lastname + ' (' + u.email + ')');
                });
            },
            error => {
                console.error('❌ Erreur lors du chargement des utilisateurs pour la messagerie:', error);
                // Fallback: essayer l'ancien endpoint si celui-ci échoue
                console.log('   Tentative du fallback avec /Users');
                this.userService.getAllUsers().subscribe(
                    (users: any[]) => {
                        console.log('✅ Réponse de /Users (fallback):', users);
                        this.allUsers = users
                            .filter(u => u.id !== this.currentUserId)
                            .map(u => ({
                                id: u.id,
                                firstname: u.firstname || u.firstName || '',
                                lastname: u.lastname || u.lastName || '',
                                email: u.email || '',
                                profilePicture: u.profilePicture || u.ProfilePicture
                            }));
                        this.filteredUsers = this.allUsers;
                        console.log('✅ Fallback - Utilisateurs chargés:', this.allUsers.length);
                    },
                    fallbackError => {
                        console.error('❌ Fallback échoué également:', fallbackError);
                        this.allUsers = [];
                        this.filteredUsers = [];
                        if (fallbackError.status === 403) {
                            console.error('⛔ Accès 403 refusé au fallback /Users - utilisateur non ADMIN');
                        } else if (fallbackError.status === 401) {
                            console.error('⛔ Non authentifié 401');
                        }
                    }
                );
            }
        );
    }

    searchUsers(): void {
        if (!this.userSearchQuery.trim()) {
            this.filteredUsers = this.allUsers;
            return;
        }
        const query = this.userSearchQuery.toLowerCase();
        this.filteredUsers = this.allUsers.filter(u =>
            u.firstname.toLowerCase().includes(query) ||
            u.lastname.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
    }

    startConversationWith(user: UserDTO): void {
        // Créer une conversation temporaire
        const tempConversation: ConversationDTO = {
            id: 0,
            otherUserId: user.id,
            otherUserName: `${user.firstname} ${user.lastname}`,
            otherUserEmail: user.email,
            otherUserProfilePicture: user.profilePicture,
            lastMessageTime: new Date(),
            lastMessage: '',
            unreadCount: 0
        };

        this.selectedConversation = tempConversation;
        this.messages = [];
        this.closeNewConversationModal();

        // Charger les messages existants s'il y en a
        this.loadMessages(user.id);
    }

    getUserFullName(user: UserDTO): string {
        return `${user.firstname} ${user.lastname}`.trim() || user.email;
    }

    /**
     * Retourne un avatar par défaut basé sur le nom
     */
    getDefaultAvatar(name: string): string {
        return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'U') + '&background=667eea&color=fff&size=128';
    }

    /**
     * Retourne l'URL complète de la photo de profil ou un avatar par défaut
     */
    getProfilePictureUrl(profilePicture: string | undefined | null, name: string): string {
        if (!profilePicture) {
            return this.getDefaultAvatar(name);
        }

        // Si c'est déjà une URL complète (http:// ou https://)
        if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
            return profilePicture;
        }

        // Sinon, c'est un chemin relatif - ajouter l'URL du backend
        return environment.apiUrl + (profilePicture.startsWith('/') ? '' : '/') + profilePicture;
    }

    /**
     * Supprime un message
     */
    deleteMessage(message: MessageDTO): void {
        if (!message.id) return;

        if (confirm('Voulez-vous vraiment supprimer ce message ?')) {
            this.messageService.deleteMessageForMe(message.id, this.currentUserId).subscribe(
                () => {
                    // Retirer le message de la liste
                    this.messages = this.messages.filter(m => m.id !== message.id);
                    console.log('Message supprimé');
                },
                error => {
                    console.error('Erreur lors de la suppression du message:', error);
                    alert('Erreur lors de la suppression du message');
                }
            );
        }
    }

    /**
     * Supprime une conversation (soft delete pour cet utilisateur uniquement)
     */
    deleteConversation(conversation: ConversationDTO, event: Event): void {
        event.stopPropagation(); // Empêcher la sélection de la conversation

        if (confirm('Voulez-vous vraiment masquer cette conversation ? L\'autre utilisateur pourra toujours la voir.')) {
            this.messageService.deleteConversation(conversation.id, this.currentUserId).subscribe(
                () => {
                    // Retirer la conversation de la liste
                    this.conversations = this.conversations.filter(c => c.id !== conversation.id);
                    // Désélectionner si c'était la conversation active
                    if (this.selectedConversation?.id === conversation.id) {
                        this.selectedConversation = null;
                        this.messages = [];
                    }
                    console.log('Conversation masquée');
                },
                error => {
                    console.error('Erreur lors de la suppression de la conversation:', error);
                    alert('Erreur lors de la suppression de la conversation');
                }
            );
        }
    }

    /**
     * Déclenche le sélecteur de fichier
     */
    triggerFileInput(): void {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * Gère la sélection d'un fichier
     */
    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
        }
    }

    /**
     * Supprime le fichier sélectionné
     */
    removeSelectedFile(): void {
        this.selectedFile = null;
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * Envoie un message avec fichier
     */
    sendFile(): void {
        if (!this.selectedFile || !this.selectedConversation) return;

        this.messageService.sendMessageWithFile(
            this.currentUserId,
            this.selectedConversation.otherUserId,
            this.newMessage,
            this.selectedFile
        ).subscribe(
            message => {
                if (message.id == null || !this.messages.some(m => m.id === message.id)) {
                    this.messages.push(message);
                }
                this.newMessage = '';
                this.selectedFile = null;
                const fileInput = document.getElementById('fileInput') as HTMLInputElement;
                if (fileInput) {
                    fileInput.value = '';
                }
                this.scrollToBottom();
            },
            error => {
                console.error('Erreur envoi fichier:', error);
                alert('Erreur lors de l\'envoi du fichier');
            }
        );
    }

    /**
     * Vérifie si le fichier est une image
     */
    isImage(fileType: string | undefined): boolean {
        return fileType?.startsWith('image/') || false;
    }

    /**
     * Vérifie si le fichier est un audio
     */
    isAudio(fileType: string | undefined): boolean {
        return fileType?.startsWith('audio/') || false;
    }

    /**
     * Retourne l'URL de téléchargement d'un fichier
     */
    getFileDownloadUrl(filePath: string | undefined): string {
        if (!filePath) return '';
        return this.messageService.getFileDownloadUrl(filePath);
    }

    openImageLightbox(filePath: string | undefined, originalName: string | undefined): void {
        if (!filePath) return;
        this.lightboxImageUrl = this.getFileDownloadUrl(filePath);
        this.lightboxImageName = originalName || 'image';
    }

    closeImageLightbox(): void {
        this.lightboxImageUrl = null;
        this.lightboxImageName = '';
    }

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        if (this.lightboxImageUrl) {
            this.closeImageLightbox();
        }
    }

    /**
     * Démarre l'enregistrement vocal
     */
    async startRecording(): Promise<void> {
        if (!this.selectedConversation) {
            alert('Veuillez sélectionner une conversation');
            return;
        }

        if (!this.liveMicAllowedForMessaging) {
            this.onVoiceMessagingClick();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.recordingTime = 0;

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.sendVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;

            // Timer pour afficher la durée
            this.recordingInterval = setInterval(() => {
                this.recordingTime++;
            }, 1000);

        } catch (error) {
            console.error('Erreur accès microphone:', error);
            const hint = MessagingComponent.microphoneDeniedHint();
            alert('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès dans le navigateur.' + hint);
        }
    }

    private static microphoneDeniedHint(): string {
        if (typeof window === 'undefined') return '';
        const h = window.location.hostname;
        if (window.isSecureContext) {
            return ' Vérifiez les permissions du site (cadenas / paramètres du site).';
        }
        if (h !== 'localhost' && h !== '127.0.0.1') {
            return '\n\nEn production, le micro nécessite souvent HTTPS (ou localhost). Utilisez https:// pour ce site.';
        }
        return '';
    }

    /**
     * Arrête l'enregistrement vocal
     */
    stopRecording(): void {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            if (this.recordingInterval) {
                clearInterval(this.recordingInterval);
                this.recordingInterval = null;
            }
        }
    }

    /**
     * Annule l'enregistrement vocal
     */
    cancelRecording(): void {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.audioChunks = [];
            if (this.recordingInterval) {
                clearInterval(this.recordingInterval);
                this.recordingInterval = null;
            }
            // Stop les tracks sans envoyer
            if (this.mediaRecorder.stream) {
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        }
    }

    /**
     * Envoie le message vocal
     */
    sendVoiceMessage(audioBlob: Blob): void {
        if (!this.selectedConversation) return;

        const fileName = `voice_${Date.now()}.webm`;
        const audioFile = new File([audioBlob], fileName, { type: 'audio/webm' });

        this.messageService.sendMessageWithFile(
            this.currentUserId,
            this.selectedConversation.otherUserId,
            '',
            audioFile
        ).subscribe(
            message => {
                if (message.id == null || !this.messages.some(m => m.id === message.id)) {
                    this.messages.push(message);
                }
                this.scrollToBottom();
                this.recordingTime = 0;
            },
            error => {
                console.error('Erreur envoi message vocal:', error);
                alert('Erreur lors de l\'envoi du message vocal');
            }
        );
    }

    /**
     * Formate le temps d'enregistrement en mm:ss
     */
    formatRecordingTime(): string {
        const minutes = Math.floor(this.recordingTime / 60);
        const seconds = this.recordingTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
