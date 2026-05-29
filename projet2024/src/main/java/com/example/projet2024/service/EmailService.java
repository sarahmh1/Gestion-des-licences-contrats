package com.example.projet2024.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.frontend.base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    @Value("${app.mail.log-verification-link:false}")
    private boolean logVerificationLink;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public String buildVerificationLink(String token) {
        String base = frontendBaseUrl == null ? "http://localhost:4200" : frontendBaseUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/#/verify-email?token=" + token;
    }

    public void sendVerificationEmail(String email, String token) throws MailException {
        String verificationLink = buildVerificationLink(token);
        if (logVerificationLink) {
            logger.info("=== Lien de vérification pour {} : {} ===", email, verificationLink);
        }

        if (mailUsername == null || mailUsername.isBlank()) {
            throw new MailSendException("spring.mail.username non configuré");
        }
        if (mailPassword == null || mailPassword.isBlank()) {
            throw new MailSendException(
                    "spring.mail.password non configuré. Créez application-mail.local.properties "
                            + "ou définissez SPRING_MAIL_PASSWORD (mot de passe d'application Gmail, 16 caractères sans espaces).");
        }

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(mailUsername);
            helper.setTo(email);
            helper.setSubject("Vérification de votre compte — Licences & Contrats");
            helper.setText(buildVerificationPlainText(verificationLink), buildVerificationHtml(verificationLink));
            javaMailSender.send(mimeMessage);
            logger.info("E-mail de vérification envoyé à : {}", email);
        } catch (MessagingException e) {
            logger.error("Erreur MIME lors de l'envoi à {} : {}", email, e.getMessage());
            throw new MailSendException("Échec de préparation de l'e-mail", e);
        } catch (MailException e) {
            logger.error("Échec d'envoi de l'e-mail à {} : {}", email, e.getMessage(), e);
            throw e;
        }
    }

    private static String buildVerificationPlainText(String verificationLink) {
        return "Bonjour,\n\n"
                + "Pour activer votre compte et vous connecter, ouvrez ce lien dans votre navigateur :\n"
                + verificationLink + "\n\n"
                + "Ce lien est valable une seule fois. Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.\n\n"
                + "Cordialement,\n"
                + "L'équipe Licences & Contrats";
    }

    private static String buildVerificationHtml(String verificationLink) {
        return "<!DOCTYPE html><html><body style=\"font-family:Arial,sans-serif;line-height:1.5;color:#1a204c;\">"
                + "<p>Bonjour,</p>"
                + "<p>Pour activer votre compte et vous connecter, cliquez sur le bouton ci-dessous :</p>"
                + "<p><a href=\"" + verificationLink + "\" "
                + "style=\"display:inline-block;padding:12px 24px;background:#f36e24;color:#fff;"
                + "text-decoration:none;border-radius:8px;font-weight:bold;\">Vérifier mon compte</a></p>"
                + "<p style=\"font-size:12px;color:#666;\">Ou copiez ce lien :<br><a href=\"" + verificationLink + "\">"
                + verificationLink + "</a></p>"
                + "<p style=\"font-size:12px;color:#666;\">Ce lien est valable une seule fois.</p>"
                + "<p>Cordialement,<br>L'équipe Licences & Contrats</p>"
                + "</body></html>";
    }

    public void sendPasswordResetCodeEmail(String email, String code) throws MailException {
        if (mailUsername == null || mailUsername.isBlank()) {
            throw new MailSendException("spring.mail.username non configuré");
        }
        if (mailPassword == null || mailPassword.isBlank()) {
            throw new MailSendException("spring.mail.password non configuré");
        }
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setFrom(mailUsername);
            helper.setTo(email);
            helper.setSubject("Réinitialisation de votre mot de passe");
            helper.setText(
                    "Bonjour,\n\n"
                            + "Vous avez demandé la réinitialisation de votre mot de passe.\n"
                            + "Votre code de vérification est : " + code + "\n\n"
                            + "Ce code est valable 15 minutes.\n"
                            + "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.\n\n"
                            + "Cordialement,\n"
                            + "L'équipe Licences & Contrats",
                    false);
            javaMailSender.send(mimeMessage);
            logger.info("Code de réinitialisation envoyé à : {}", email);
        } catch (MessagingException e) {
            throw new MailSendException("Échec de préparation de l'e-mail", e);
        } catch (MailException e) {
            logger.error("Échec d'envoi du code de réinitialisation à {} : {}", email, e.getMessage(), e);
            throw e;
        }
    }

    public void sendEsetNotification(String adminEmail, List<String> ccEmails, String sujet, String contenu) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String from = (mailUsername != null && !mailUsername.isBlank())
                    ? mailUsername
                    : "gerinfo2025@gmail.com";
            helper.setFrom(from);
            helper.setTo(adminEmail);

            if (ccEmails != null && !ccEmails.isEmpty()) {
                helper.setCc(ccEmails.toArray(new String[0]));
            }

            helper.setSubject(sujet);
            helper.setText(contenu, true);

            javaMailSender.send(message);

            logger.info("Notification ESET envoyée à admin: {} avec CC: {}", adminEmail, ccEmails);
        } catch (MailException | MessagingException e) {
            logger.error("Erreur lors de l'envoi de l'e-mail ESET : {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }
}
