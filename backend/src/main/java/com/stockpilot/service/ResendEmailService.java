package com.stockpilot.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

public class ResendEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(ResendEmailService.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    private final String apiKey;
    private final String mailFrom;
    private final String frontendBaseUrl;
    private final HttpClient httpClient;

    public ResendEmailService(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${mail.from:onboarding@resend.dev}") String mailFrom,
            @Value("${app.frontend-base-url:http://localhost:4200}") String frontendBaseUrl) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.mailFrom = mailFrom != null ? mailFrom.trim() : "onboarding@resend.dev";
        this.frontendBaseUrl = frontendBaseUrl != null ? frontendBaseUrl.replaceAll("/+$", "") : "http://localhost:4200";
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public boolean sendVerificationEmail(String recipientEmail, String recipientName, String rawToken) {
        String verificationUrl = frontendBaseUrl + "/verify-email?token=" + rawToken;
        String subject = "Verify your StockPilot account";

        String textContent = String.format(
                "Hello %s,\n\n" +
                "Thank you for registering your business with StockPilot.\n\n" +
                "Please verify your email address by opening the following link in your browser:\n" +
                "%s\n\n" +
                "This link will expire in 24 hours. If you did not create a StockPilot account, please safely ignore this email.\n\n" +
                "— StockPilot Team",
                recipientName, verificationUrl
        );

        String htmlContent = String.format(
                "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #222222; line-height: 1.6;\">" +
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>Thank you for registering your business with StockPilot.</p>" +
                "<p>Please verify your email address by clicking the link below:</p>" +
                "<p style=\"margin: 20px 0;\">" +
                "<a href=\"%s\" style=\"background-color: #3f6b3a; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: 500; display: inline-block;\">Verify Email Address</a>" +
                "</p>" +
                "<p>Or copy and paste this URL into your browser:</p>" +
                "<p style=\"word-break: break-all; color: #666666;\">%s</p>" +
                "<p style=\"font-size: 12px; color: #888888; margin-top: 24px;\">This link will expire in 24 hours. If you did not create a StockPilot account, please safely ignore this email.</p>" +
                "</div>",
                escapeHtml(recipientName), verificationUrl, verificationUrl
        );

        return sendResendRequest(recipientEmail, subject, textContent, htmlContent);
    }

    @Override
    public boolean sendPasswordResetEmail(String recipientEmail, String recipientName, String rawToken) {
        String resetUrl = frontendBaseUrl + "/reset-password?token=" + rawToken;
        String subject = "Reset your StockPilot password";

        String textContent = String.format(
                "Hello %s,\n\n" +
                "A password reset request was received for your StockPilot account.\n\n" +
                "Please reset your password by opening the following link in your browser:\n" +
                "%s\n\n" +
                "This link will expire in 30 minutes. If you did not request a password reset, please safely ignore this email.\n\n" +
                "— StockPilot Team",
                recipientName, resetUrl
        );

        String htmlContent = String.format(
                "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #222222; line-height: 1.6;\">" +
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>A password reset request was received for your StockPilot account.</p>" +
                "<p>Please reset your password by clicking the link below:</p>" +
                "<p style=\"margin: 20px 0;\">" +
                "<a href=\"%s\" style=\"background-color: #3f6b3a; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: 500; display: inline-block;\">Reset Password</a>" +
                "</p>" +
                "<p>Or copy and paste this URL into your browser:</p>" +
                "<p style=\"word-break: break-all; color: #666666;\">%s</p>" +
                "<p style=\"font-size: 12px; color: #888888; margin-top: 24px;\">This link will expire in 30 minutes. If you did not request a password reset, please safely ignore this email.</p>" +
                "</div>",
                escapeHtml(recipientName), resetUrl, resetUrl
        );

        return sendResendRequest(recipientEmail, subject, textContent, htmlContent);
    }

    private boolean sendResendRequest(String recipientEmail, String subject, String textContent, String htmlContent) {
        if (apiKey.isEmpty()) {
            logger.warn("RESEND_API_KEY is not configured; email to {} could not be dispatched", recipientEmail);
            return false;
        }

        try {
            String jsonPayload = buildJsonPayload(recipientEmail, subject, textContent, htmlContent);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RESEND_API_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Email successfully sent via Resend to recipient: {}", recipientEmail);
                return true;
            } else {
                logger.warn("Resend API rejected email dispatch. HTTP Status: {}. Response: {}",
                        response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            logger.error("Failed to dispatch email via Resend to {}: {}", recipientEmail, e.getMessage());
            return false;
        }
    }

    private String buildJsonPayload(String to, String subject, String text, String html) {
        return "{" +
                "\"from\":\"" + escapeJson(mailFrom) + "\"," +
                "\"to\":[\"" + escapeJson(to) + "\"]," +
                "\"subject\":\"" + escapeJson(subject) + "\"," +
                "\"text\":\"" + escapeJson(text) + "\"," +
                "\"html\":\"" + escapeJson(html) + "\"" +
                "}";
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }
}
