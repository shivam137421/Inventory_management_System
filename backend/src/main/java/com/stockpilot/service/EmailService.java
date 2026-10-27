package com.stockpilot.service;

public interface EmailService {

    boolean sendVerificationEmail(String recipientEmail, String recipientName, String rawToken);

    boolean sendPasswordResetEmail(String recipientEmail, String recipientName, String rawToken);
}
