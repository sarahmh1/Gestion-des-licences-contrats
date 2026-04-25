import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { ROUTES } from '../../sidebar/sidebar.component';
import { Location } from '@angular/common';
import { AuthService } from '../../auth/AuthService';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MessageService, ConversationDTO, MessageDTO } from '../../Services/message.service';
import { UserService } from '../../Services/user.service';
import { PermissionService } from '../../Services/permission.service';
import { WebsocketService } from '../../Services/websocket.service';
import { environment } from 'environments/environment';
import { NotificationAppService } from '../../Services/notification.service';
import { AppNotification } from '../../Model/Notification';
import { Subscription } from 'rxjs';

interface UserDTO {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    profilePicture?: string;
}

@Component({
    selector: 'navbar-cmp',
    templateUrl: 'navbar.component.html',
    styleUrls: ['navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
    private listTitles: any[];
    location: Location;
    private toggleButton: any;
    private sidebarVisible: boolean;
    userName: string = '';
    userProfilePic: string = '';
    showDropdown: boolean = false;

    // Messaging
    showMessagingPanel: boolean = false;
    messagingView: 'conversations' | 'users' | 'chat' = 'conversations';
    allUsers: UserDTO[] = [];
    filteredUsers: UserDTO[] = [];
    userSearchQuery: string = '';
    conversations: ConversationDTO[] = [];
    selectedChatUser: UserDTO | null = null;
    selectedConversation: ConversationDTO | null = null;
    messages: MessageDTO[] = [];
    newMessage: string = '';
    currentUserId: number = 0;
    unreadTotal: number = 0;
    isTyping: boolean = false;
    typingTimeout: any;
    selectedFile: File | null = null;
    deleteMenuMsg: MessageDTO | null = null;

    // Voice recording
    isRecording: boolean = false;
    mediaRecorder: MediaRecorder | null = null;
    audioChunks: Blob[] = [];
    recordingTime: number = 0;
    recordingInterval: any = null;

    // Notifications
    notifications: AppNotification[] = [];
    unreadNotifCount: number = 0;
    showNotifPanel: boolean = false;
    private notifInterval: any;
    private notifSubscription?: Subscription;

    // Calendar
    showCalendarModal: boolean = false;
    calendarEvents: any[] = [];
    calMonth: number = new Date().getMonth();
    calYear: number = new Date().getFullYear();
    calMonthNames: string[] = [
        'Janvier', 'F\u00e9vrier', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Ao\u00fbt', 'Septembre', 'Octobre', 'Novembre', 'D\u00e9cembre'
    ];
    calWeekDays: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    calWeeks: any[][] = [];
    selectedCalDay: any = null;
    selectedDayEvents: any[] = [];

    private messageSubscription?: Subscription;
    private typingSubscription?: Subscription;

    constructor(
        location: Location,
        private element: ElementRef,
        private authService: AuthService,
        private router: Router,
        private http: HttpClient,
        private messageService: MessageService,
        private userService: UserService,
        public permissionService: PermissionService,
        private websocketService: WebsocketService,
        private notificationAppService: NotificationAppService
    ) {
        this.location = location;
        this.sidebarVisible = false;
    }

    ngOnInit() {
        this.listTitles = ROUTES.filter(listTitle => listTitle);
        const navbar: HTMLElement = this.element.nativeElement;
        this.toggleButton = navbar.getElementsByClassName('navbar-toggle')[0];

        this.loadUserProfile();
        this.initMessaging();
        this.loadNotifUnreadCount();
        this.notifInterval = setInterval(() => this.loadNotifUnreadCount(), 30000);
    }

    ngOnDestroy(): void {
        this.messageSubscription?.unsubscribe();
        this.typingSubscription?.unsubscribe();
        this.notifSubscription?.unsubscribe();
        if (this.notifInterval) clearInterval(this.notifInterval);
    }

    loadUserProfile() {
        const token = this.authService.getToken();
        if (!token) return;

        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.get<any>(`${environment.apiUrl}/Users/me`, { headers }).subscribe(
            (user) => {
                const first = user.firstname || '';
                const last = user.lastname || '';
                this.userName = (first + ' ' + last).trim() || user.email || 'Utilisateur';
                this.currentUserId = user.id;
                this.loadNotifUnreadCount();

                if (user.profilePicture) {
                    this.userProfilePic = environment.apiUrl + user.profilePicture;
                }
            },
            (err) => {
                const user = this.authService.getUser();
                if (user) {
                    this.userName = user.email || 'Utilisateur';
                    this.currentUserId = user.userId || user.id || 0;
                }
            }
        );
    }

    // ========== Messaging ==========

    initMessaging() {
        const currentUser = this.authService.getUser();
        if (currentUser) {
            this.currentUserId = currentUser.id || currentUser.userId || 0;
        }

        if (this.currentUserId > 0) {
            this.websocketService.connect(this.currentUserId.toString());
            this.loadConversations();
            this.loadUnreadCount();

            this.messageSubscription = this.websocketService.getMessages().subscribe(message => {
                if (message) {
                    this.handleNewMessage(message);
                }
            });

            this.typingSubscription = this.websocketService.getTypingIndicators().subscribe(userId => {
                if (userId && this.selectedChatUser && userId === this.selectedChatUser.id) {
                    this.isTyping = true;
                    clearTimeout(this.typingTimeout);
                    this.typingTimeout = setTimeout(() => {
                        this.isTyping = false;
                    }, 3000);
                }
            });

            // S'abonner aux notifications en temps réel
            this.notifSubscription = this.websocketService.getNotifications().subscribe(notif => {
                if (notif) {
                    console.log('📨 WebSocket notification received:', notif.id, notif.message);
                    // Vérifier que la notif n'existe pas déjà (déduplication)
                    const notifExists = this.notifications.some(n => n.id === notif.id);
                    console.log('   Already exists?', notifExists);
                    if (!notifExists) {
                        this.notifications.unshift(notif);
                        console.log('   ✅ Added to notifications array. New length:', this.notifications.length);
                    } else {
                        console.log('   ⚠️ Skipped (duplicate)');
                    }
                    this.unreadNotifCount++;
                    console.log('   unreadNotifCount incremented to:', this.unreadNotifCount);
                }
            });
        }
    }

    loadConversations() {
        if (this.currentUserId <= 0) return;
        this.messageService.getUserConversations(this.currentUserId).subscribe(
            conversations => {
                this.conversations = conversations.sort((a, b) => {
                    const tA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                    const tB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                    return tB - tA;
                });
            },
            error => { console.error('Error loading conversations:', error); }
        );
    }

    loadUnreadCount() {
        if (this.currentUserId <= 0) return;
        this.messageService.getUnreadCount(this.currentUserId).subscribe(
            (res: any) => { this.unreadTotal = (typeof res === 'object' && res.count !== undefined) ? res.count : res; },
            error => { console.error('Error loading unread count:', error); }
        );
    }

    toggleMessagingPanel() {
        this.showMessagingPanel = !this.showMessagingPanel;
        this.showDropdown = false;
        this.showNotifPanel = false;
        this.showCalendarModal = false;
        if (this.showMessagingPanel) {
            this.messagingView = 'conversations';
            this.loadConversations();
            this.loadUnreadCount();
        }
    }

    closeMessagingPanel() {
        this.showMessagingPanel = false;
        this.messagingView = 'conversations';
        this.selectedChatUser = null;
        this.messages = [];
    }

    showNewMessage() {
        this.messagingView = 'users';
        this.loadAllUsers();
    }

    selectConversation(conv: any) {
        conv.unreadCount = 0;
        const user: any = {
            id: conv.otherUserId,
            firstname: conv.otherUserName?.split(' ')[0] || '',
            lastname: conv.otherUserName?.split(' ').slice(1).join(' ') || '',
            email: conv.otherUserEmail,
            profilePicture: conv.otherUserProfilePicture
        };
        this.selectUser(user);
    }

    loadAllUsers() {
        // ✅ Use available-for-messaging endpoint instead of getAllUsers (which requires ADMIN)
        this.userService.getAvailableUsersForMessaging().subscribe(
            (users: any[]) => {
                console.log('✅ Users loaded from /available-for-messaging:', users.length);
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
                console.log('✅ Filtered users count:', this.filteredUsers.length);
            },
            error => { 
                console.error('❌ Error loading users:', error);
                // Fallback: try getAllUsers for backward compatibility
                if (error.status === 403 || error.status === 401) {
                    console.log('   Fallback failed - user does not have access to user list');
                    this.allUsers = [];
                    this.filteredUsers = [];
                }
            }
        );
    }

    searchUsers() {
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

    getUserFullName(user: UserDTO): string {
        return `${user.firstname} ${user.lastname}`.trim() || user.email;
    }

    getProfilePictureUrl(profilePicture: string | undefined | null, name: string): string {
        if (!profilePicture) {
            return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'U') + '&background=667eea&color=fff&size=128';
        }
        if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
            return profilePicture;
        }
        return environment.apiUrl + (profilePicture.startsWith('/') ? '' : '/') + profilePicture;
    }

    selectUser(user: UserDTO) {
        this.selectedChatUser = user;
        this.messagingView = 'chat';
        this.messages = [];
        this.newMessage = '';

        // Load messages
        this.messageService.getConversationMessages(this.currentUserId, user.id).subscribe(
            messages => {
                this.messages = messages;
                setTimeout(() => this.scrollToBottom(), 100);
            },
            error => { console.error('Error loading messages:', error); }
        );

        // Mark as read
        this.messageService.markMessagesAsRead(user.id, this.currentUserId).subscribe(() => {
            this.loadUnreadCount();
        });
    }

    backToConversations() {
        this.messagingView = 'conversations';
        this.selectedChatUser = null;
        this.messages = [];
    }

    deleteConversation(conv: any) {
        if (!confirm('Supprimer cette conversation ?')) return;
        this.messageService.deleteConversation(conv.id, this.currentUserId).subscribe(
            () => {
                this.conversations = this.conversations.filter(c => c.id !== conv.id);
            },
            error => { console.error('Error deleting conversation:', error); }
        );
    }

    deleteMessage(msg: any) {
        if (!msg.id) return;
        this.deleteMenuMsg = msg;
    }

    deleteForMe() {
        if (!this.deleteMenuMsg || !this.deleteMenuMsg.id) return;
        this.messageService.deleteMessageForMe(this.deleteMenuMsg.id, this.currentUserId).subscribe(
            () => {
                this.messages = this.messages.filter(m => m.id !== this.deleteMenuMsg!.id);
                this.deleteMenuMsg = null;
                this.loadConversations();
            },
            error => { console.error('Error deleting message:', error); this.deleteMenuMsg = null; }
        );
    }

    deleteForEveryone() {
        if (!this.deleteMenuMsg || !this.deleteMenuMsg.id) return;
        this.messageService.deleteMessageForEveryone(this.deleteMenuMsg.id, this.currentUserId).subscribe(
            () => {
                const msg = this.messages.find(m => m.id === this.deleteMenuMsg!.id);
                if (msg) {
                    msg.deletedForEveryone = true;
                    msg.content = '';
                    msg.fileName = undefined;
                    msg.filePath = undefined;
                }
                this.deleteMenuMsg = null;
                this.loadConversations();
            },
            error => { console.error('Error deleting message:', error); this.deleteMenuMsg = null; }
        );
    }

    cancelDelete() {
        this.deleteMenuMsg = null;
    }

    sendMessage() {
        if (!this.newMessage.trim() || !this.selectedChatUser) return;

        const message: MessageDTO = {
            content: this.newMessage,
            senderId: this.currentUserId,
            receiverId: this.selectedChatUser.id
        };

        this.newMessage = '';

        this.messageService.sendMessage(message).subscribe(
            savedMessage => {
                // Le message arrivera via WebSocket, pas besoin de l'ajouter ici
            },
            error => {
                console.error('Error sending message:', error);
            }
        );
    }

    onTyping() {
        if (this.selectedChatUser) {
            this.websocketService.sendTypingIndicator(this.currentUserId, this.selectedChatUser.id);
        }
    }

    handleNewMessage(message: MessageDTO) {
        const isCurrentChat = this.selectedChatUser &&
            (message.senderId === this.selectedChatUser.id || message.receiverId === this.selectedChatUser.id);

        if (isCurrentChat) {
            // Avoid duplicates
            if (!this.messages.find(m => m.id === message.id)) {
                this.messages.push(message);
                setTimeout(() => this.scrollToBottom(), 100);
            }
            // Mark as read on server if received from the other user
            if (message.senderId !== this.currentUserId) {
                this.messageService.markMessagesAsRead(message.senderId, this.currentUserId).subscribe();
            }
        } else {
            // Message from someone else — update the unread badge
            if (message.senderId !== this.currentUserId) {
                this.loadUnreadCount();
            }
        }
        // Always reload conversations so latest message appears at top
        this.loadConversations();
    }

    scrollToBottom() {
        const chatContainer = document.querySelector('.msg-chat-messages');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    formatTime(timestamp: Date): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    isImage(fileType: string | undefined): boolean {
        return fileType?.startsWith('image/') || false;
    }

    getFileDownloadUrl(filePath: string | undefined): string {
        if (!filePath) return '';
        return this.messageService.getFileDownloadUrl(filePath);
    }

    isAudio(fileType: string | undefined): boolean {
        return fileType?.startsWith('audio/') || false;
    }

    triggerFileInput() {
        const fileInput = document.getElementById('msgFileInput') as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
        }
    }

    removeSelectedFile() {
        this.selectedFile = null;
        const fileInput = document.getElementById('msgFileInput') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }

    sendFile() {
        if (!this.selectedFile || !this.selectedChatUser) return;

        this.messageService.sendMessageWithFile(
            this.currentUserId,
            this.selectedChatUser.id,
            this.newMessage,
            this.selectedFile
        ).subscribe(
            message => {
                // Le message arrivera via WebSocket
                this.newMessage = '';
                this.selectedFile = null;
                const fileInput = document.getElementById('msgFileInput') as HTMLInputElement;
                if (fileInput) { fileInput.value = ''; }
            },
            error => {
                console.error('Error sending file:', error);
            }
        );
    }

    // ========== Voice Recording ==========

    async startRecording(): Promise<void> {
        if (!this.selectedChatUser) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.recordingTime = 0;

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) { this.audioChunks.push(event.data); }
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.sendVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingInterval = setInterval(() => { this.recordingTime++; }, 1000);
        } catch (error) {
            console.error('Erreur accès microphone:', error);
            alert('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès.');
        }
    }

    stopRecording(): void {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }
    }

    cancelRecording(): void {
        if (this.mediaRecorder && this.isRecording) {
            this.audioChunks = [];
            this.mediaRecorder.onstop = () => { }; // prevent sendVoiceMessage
            this.mediaRecorder.stop();
            this.isRecording = false;
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
            if ((this.mediaRecorder as any).stream) {
                (this.mediaRecorder as any).stream.getTracks().forEach((t: any) => t.stop());
            }
        }
    }

    sendVoiceMessage(audioBlob: Blob): void {
        if (!this.selectedChatUser) return;
        const fileName = `voice_${Date.now()}.webm`;
        const audioFile = new File([audioBlob], fileName, { type: 'audio/webm' });
        this.messageService.sendMessageWithFile(
            this.currentUserId,
            this.selectedChatUser.id,
            '',
            audioFile
        ).subscribe(
            () => { this.recordingTime = 0; },
            error => { console.error('Erreur envoi message vocal:', error); }
        );
    }

    formatRecordingTime(): string {
        const minutes = Math.floor(this.recordingTime / 60);
        const seconds = this.recordingTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // ========== User Dropdown ==========

    toggleDropdown() {
        this.showDropdown = !this.showDropdown;
        this.showMessagingPanel = false;
    }

    closeDropdown() {
        this.showDropdown = false;
    }

    goToProfile() {
        this.showDropdown = false;
        this.router.navigate(['/profile']);
    }

    logout() {
        this.showDropdown = false;
        this.authService.logout();
    }

    // ========== Sidebar ==========

    sidebarOpen() {
        const toggleButton = this.toggleButton;
        const body = document.getElementsByTagName('body')[0];
        setTimeout(function () {
            toggleButton.classList.add('toggled');
        }, 500);
        body.classList.add('nav-open');
        this.sidebarVisible = true;
    }

    sidebarClose() {
        const body = document.getElementsByTagName('body')[0];
        this.toggleButton.classList.remove('toggled');
        this.sidebarVisible = false;
        body.classList.remove('nav-open');
    }

    sidebarToggle() {
        if (this.sidebarVisible === false) {
            this.sidebarOpen();
        } else {
            this.sidebarClose();
        }
    }

    getTitle() {
        var titlee = this.location.prepareExternalUrl(this.location.path());
        if (titlee.charAt(0) === '#') {
            titlee = titlee.slice(1);
        }
        for (var item = 0; item < this.listTitles.length; item++) {
            if (this.listTitles[item].path === titlee) {
                return this.listTitles[item].title;
            }
        }
        return 'Dashboard';
    }

    // ========== Notifications ==========

    loadNotifUnreadCount(): void {
        if (!this.currentUserId) return;
        this.notificationAppService.getUnreadCount(this.currentUserId).subscribe(
            (res) => {
                console.log('📢 Unread count from API:', res.count);
                this.unreadNotifCount = res.count;
            },
            (err) => { console.error('Error loading unread count:', err); }
        );
    }

    loadNotifications(): void {
        if (!this.currentUserId) return;
        this.notificationAppService.getNotificationsForUser(this.currentUserId).subscribe(
            (notifs) => {
                console.log('📊 API returned', notifs.length, 'notifications:', notifs);
                notifs.forEach((n, i) => {
                    console.log(`   [${i}] ID: ${n.id}, Message: "${n.message.substring(0, 30)}...", isRead: ${n.isRead}`);
                });
                // Déduplicater les notifications par ID pour éviter les doublons
                // quand les notifs arrivent à la fois via WebSocket et API
                const idsInNotifs = new Set(notifs.map(n => n.id));
                const wsOnlyNotifs = this.notifications.filter(n => !idsInNotifs.has(n.id));
                
                console.log('🔄 WS-only notifications:', wsOnlyNotifs.length);
                console.log('📦 Final notifications array length:', notifs.length + wsOnlyNotifs.length);
                
                // Merger: API notifs + WebSocket notifs non présentes dans l'API
                this.notifications = [...notifs, ...wsOnlyNotifs];
                console.log('✅ notifications set to:', this.notifications.length, this.notifications);
            },
            (err) => { console.error('Error loading notifications:', err); }
        );
    }

    toggleNotifPanel(): void {
        console.log('🔔 toggleNotifPanel called, current showNotifPanel:', this.showNotifPanel);
        this.showNotifPanel = !this.showNotifPanel;
        if (this.showNotifPanel) {
            console.log('📂 Panel opening, calling loadNotifications()');
            this.loadNotifications();
        }
    }

    markNotifRead(notif: AppNotification): void {
        if (!notif.isRead) {
            // Marquer localement immédiatement pour l'expérience utilisateur
            notif.isRead = true;
            console.log('🟢 Notification', notif.id, 'marked as read locally');
            
            // Envoyer au backend en arrière-plan (sans recharger)
            this.notificationAppService.markAsRead(notif.id).subscribe(
                () => {
                    console.log('✅ Notification', notif.id, 'confirmed read on server');
                    this.loadNotifUnreadCount();
                },
                (err) => {
                    console.error('❌ Error marking notification as read:', err);
                    // En cas d'erreur, revenir à non-lu
                    notif.isRead = false;
                }
            );
        }
    }

    markAllNotifsRead(): void {
        if (!this.currentUserId) return;
        // Marquer tous localement immédiatement
        this.notifications.forEach(n => n.isRead = true);
        console.log('🟢 All notifications marked as read locally');
        
        // Envoyer au backend en arrière-plan
        this.notificationAppService.markAllAsRead(this.currentUserId).subscribe(
            () => {
                console.log('✅ All notifications confirmed read on server');
                this.unreadNotifCount = 0;
            },
            (err) => {
                console.error('❌ Error marking all notifications as read:', err);
                // En cas d'erreur, les notifications seront resynchronisées au prochain intervalle
            }
        );
    }

    deleteNotification(notif: AppNotification, event: Event): void {
        event.stopPropagation();
        this.notificationAppService.deleteNotification(notif.id).subscribe(() => {
            this.notifications = this.notifications.filter(n => n.id !== notif.id);
            this.loadNotifUnreadCount();
        });
    }

    getTimeAgo(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return diffMins + ' min';
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return diffHours + 'h';
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return diffDays + 'j';
        return date.toLocaleDateString('fr-FR');
    }

    // ========== Calendar ==========

    toggleCalendarModal(): void {
        this.showCalendarModal = !this.showCalendarModal;
        if (this.showCalendarModal) {
            this.loadCalendarEvents();
        }
    }

    loadCalendarEvents(): void {
        if (!this.currentUserId) return;
        const token = this.authService.getToken();
        if (!token) return;
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.get<any[]>(
            `${environment.apiUrl}/InterventionPreventive/calendar/${this.currentUserId}`,
            { headers }
        ).subscribe(
            (events) => { this.calendarEvents = events; this.buildCalGrid(); },
            () => { this.buildCalGrid(); }
        );
    }

    buildCalGrid(): void {
        this.calWeeks = [];
        this.selectedCalDay = null;
        this.selectedDayEvents = [];
        const totalDays = new Date(this.calYear, this.calMonth + 1, 0).getDate();
        const firstDow = new Date(this.calYear, this.calMonth, 1).getDay();
        // Convert Sunday=0 to Monday-based: Mon=0..Sun=6
        const offset = firstDow === 0 ? 6 : firstDow - 1;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const cells: any[] = [];
        // Empty cells for offset
        for (let i = 0; i < offset; i++) { cells.push(null); }
        for (let d = 1; d <= totalDays; d++) {
            const date = new Date(this.calYear, this.calMonth, d);
            const dateStr = this.calToDateStr(date);
            cells.push({
                dayNum: d,
                dateStr: dateStr,
                isToday: date.getTime() === today.getTime(),
                dots: this.getDayDots(dateStr)
            });
        }
        // Fill remaining cells to complete the last week
        while (cells.length % 7 !== 0) { cells.push(null); }
        // Split into weeks
        for (let i = 0; i < cells.length; i += 7) {
            this.calWeeks.push(cells.slice(i, i + 7));
        }
    }

    calToDateStr(d: Date): string {
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    getDayDots(dateStr: string): string[] {
        const colors: string[] = [];
        for (const ev of this.calendarEvents) {
            const start = ev.start || ev.end;
            const end = ev.end || ev.start;
            if (!start) continue;
            if (dateStr >= start && dateStr <= end) {
                if (!colors.includes(ev.color)) {
                    colors.push(ev.color);
                }
            }
        }
        return colors;
    }

    selectCalDay(day: any): void {
        if (!day) return;
        if (this.selectedCalDay?.dateStr === day.dateStr) {
            this.selectedCalDay = null;
            this.selectedDayEvents = [];
            return;
        }
        this.selectedCalDay = day;
        this.selectedDayEvents = this.calendarEvents.filter((ev: any) => {
            const start = ev.start || ev.end;
            const end = ev.end || ev.start;
            if (!start) return false;
            return day.dateStr >= start && day.dateStr <= end;
        });
    }

    prevCalMonth(): void {
        this.calMonth--;
        if (this.calMonth < 0) { this.calMonth = 11; this.calYear--; }
        this.loadCalendarEvents();
    }

    nextCalMonth(): void {
        this.calMonth++;
        if (this.calMonth > 11) { this.calMonth = 0; this.calYear++; }
        this.loadCalendarEvents();
    }

    getCalMonthLabel(): string {
        return this.calMonthNames[this.calMonth] + ' ' + this.calYear;
    }

    getCalTypeLabel(type: string): string {
        return type === 'recommandee' ? 'P\u00e9riode Recommand\u00e9e' : "P\u00e9riode d'Intervention";
    }

    goToIntervention(ev: any): void {
        this.showCalendarModal = false;
        this.router.navigate(['/interventions-preventives']);
    }

    trackByNotificationId(index: number, notif: AppNotification): any {
        return notif.id;
    }
}
