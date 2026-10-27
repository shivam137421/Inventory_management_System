package com.stockpilot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

public class ConsoleEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(ConsoleEmailService.class);

    private final String frontendBaseUrl;

    public ConsoleEmailService(@Value("${app.frontend-base-url:http://localhost:4200}") String frontendBaseUrl) {
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
    }

    @Override
    public boolean sendVerificationEmail(String recipientEmail, String recipientName, String rawToken) {
        String verificationUrl = frontendBaseUrl + "/verify-email?token=" + rawToken;
        logger.info("================== [DEV/CONSOLE EMAIL - VERIFICATION] ==================");
        logger.info("To: {} <{}>", recipientName, recipientEmail);
        logger.info("Subject: Verify your StockPilot account");
        logger.info("Verification URL: {}", verificationUrl);
        logger.info("Expires in: 24 hours");
        logger.info("========================================================================");
        return true;
    }

    @Override
    public boolean sendPasswordResetEmail(String recipientEmail, String recipientName, String rawToken) {
        String resetUrl = frontendBaseUrl + "/reset-password?token=" + rawToken;
        logger.info("================== [DEV/CONSOLE EMAIL - PASSWORD RESET] ================");
        logger.info("To: {} <{}>", recipientName, recipientEmail);
        logger.info("Subject: Reset your StockPilot password");
        logger.info("Reset URL: {}", resetUrl);
        logger.info("Expires in: 30 minutes");
        logger.info("========================================================================");
        return true;
    }
}
