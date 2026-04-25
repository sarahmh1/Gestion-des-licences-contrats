package com.example.projet2024.service;

import com.example.projet2024.entite.Notification;
import com.example.projet2024.entite.User;
import com.example.projet2024.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public Notification createNotification(User user, String message, Long interventionPreventiveId) {
        return createNotificationGeneric(user, message, interventionPreventiveId, null);
    }

    public Notification createCurativeNotification(User user, String message, Long interventionCurativeId) {
        return createNotificationGeneric(user, message, null, interventionCurativeId);
    }

    private Notification createNotificationGeneric(User user, String message, Long interventionPreventiveId, Long interventionCurativeId) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setInterventionPreventiveId(interventionPreventiveId);
        notification.setInterventionCurativeId(interventionCurativeId);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        Notification saved = notificationRepository.save(notification);

        // Envoyer la notification en temps réel via WebSocket
        Map<String, Object> wsPayload = new HashMap<>();
        wsPayload.put("id", saved.getId());
        wsPayload.put("message", saved.getMessage());
        wsPayload.put("isRead", false);
        wsPayload.put("createdAt", saved.getCreatedAt().toString());
        wsPayload.put("interventionPreventiveId", saved.getInterventionPreventiveId());
        wsPayload.put("interventionCurativeId", saved.getInterventionCurativeId());
        messagingTemplate.convertAndSend("/topic/notifications/" + user.getId(), wsPayload);

        return saved;
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        System.out.println("🔔 [NotificationService] getNotificationsForUser(" + userId + ") returned " + notifs.size() + " notifications");
        for (Notification n : notifs) {
            System.out.println("   - ID: " + n.getId() + ", isRead: " + n.isRead() + ", Message: " + n.getMessage().substring(0, Math.min(50, n.getMessage().length())));
        }
        return notifs;
    }

    public long getUnreadCount(Long userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        System.out.println("📢 [NotificationService] getUnreadCount(" + userId + ") = " + count);
        return count;
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null) {
            System.out.println("✅ [NotificationService] Marking notification " + notificationId + " as read. Current state: " + notification.isRead());
            notification.setRead(true);
            notificationRepository.save(notification);
            System.out.println("✅ [NotificationService] Notification " + notificationId + " saved with isRead = " + notification.isRead());
        } else {
            System.out.println("❌ [NotificationService] Notification " + notificationId + " not found");
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}
