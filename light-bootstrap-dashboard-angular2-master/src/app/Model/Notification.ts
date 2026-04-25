export interface AppNotification {
    id: number;
    message: string;
    isRead: boolean;
    createdAt: string;
    interventionPreventiveId?: number;
}
