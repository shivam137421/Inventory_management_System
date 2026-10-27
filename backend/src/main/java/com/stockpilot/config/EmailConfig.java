package com.stockpilot.config;

import com.stockpilot.service.ConsoleEmailService;
import com.stockpilot.service.EmailService;
import com.stockpilot.service.ResendEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EmailConfig {

    private static final Logger logger = LoggerFactory.getLogger(EmailConfig.class);

    @Bean
    public EmailService emailService(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${mail.from:onboarding@resend.dev}") String mailFrom,
            @Value("${app.frontend-base-url:http://localhost:4200}") String frontendBaseUrl) {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            logger.info("Configuring ResendEmailService for real email delivery (Sender: {})", mailFrom);
            return new ResendEmailService(apiKey, mailFrom, frontendBaseUrl);
        } else {
            logger.info("RESEND_API_KEY is not set; falling back to ConsoleEmailService for local testing");
            return new ConsoleEmailService(frontendBaseUrl);
        }
    }
}
