package com.stockpilot.service;

import com.stockpilot.dto.AuthResponse;
import com.stockpilot.dto.ForgotPasswordRequest;
import com.stockpilot.dto.LoginRequest;
import com.stockpilot.dto.RefreshTokenRequest;
import com.stockpilot.dto.RegisterRequest;
import com.stockpilot.dto.ResendVerificationRequest;
import com.stockpilot.dto.ResetPasswordRequest;
import com.stockpilot.entity.Business;
import com.stockpilot.entity.EmailVerificationToken;
import com.stockpilot.entity.PasswordResetToken;
import com.stockpilot.entity.User;
import com.stockpilot.entity.UserRefreshToken;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.exception.ResourceNotFoundException;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.repository.EmailVerificationTokenRepository;
import com.stockpilot.repository.PasswordResetTokenRepository;
import com.stockpilot.repository.UserRefreshTokenRepository;
import com.stockpilot.repository.UserRepository;
import com.stockpilot.security.JwtUtil;
import com.stockpilot.security.RateLimiter;
import com.stockpilot.security.TenantContext;
import java.time.LocalDateTime;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRefreshTokenRepository userRefreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final RateLimiter rateLimiter;
    private final long accessTokenExpirationMs;

    public AuthService(
            UserRepository userRepository,
            BusinessRepository businessRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            UserRefreshTokenRepository userRefreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            EmailService emailService,
            RateLimiter rateLimiter,
            @Value("${jwt.access-token-expiration-ms:900000}") long accessTokenExpirationMs) {
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.userRefreshTokenRepository = userRefreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.rateLimiter = rateLimiter;
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    @Transactional
    public String register(RegisterRequest request, String clientIp) {
        checkRateLimit("reg:" + clientIp, 10, 60000, "Too many registration attempts. Please try again later.");

        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new ConflictException("An account with this email address already exists.");
        }

        String cleanPhone = normalizePhone(request.getPhone());

        // 1. Create Business
        Business business = new Business(
                request.getBusinessName().trim(),
                null,
                cleanPhone,
                cleanEmail,
                null
        );
        Business savedBusiness = businessRepository.save(business);

        // 2. Create Owner User (unverified)
        User user = new User(
                savedBusiness,
                request.getOwnerName().trim(),
                cleanEmail,
                cleanPhone,
                passwordEncoder.encode(request.getPassword()),
                "OWNER",
                false
        );
        User savedUser = userRepository.save(user);

        // 3. Issue Email Verification Token (24 hours expiry)
        String rawToken = jwtUtil.generateSecureRandomToken();
        String tokenHash = JwtUtil.hashToken(rawToken);
        LocalDateTime expiry = LocalDateTime.now().plusHours(24);

        EmailVerificationToken verificationToken = new EmailVerificationToken(savedUser, tokenHash, expiry);
        emailVerificationTokenRepository.save(verificationToken);

        // 4. Dispatch verification email
        boolean sent = emailService.sendVerificationEmail(cleanEmail, savedUser.getFullName(), rawToken);
        if (!sent) {
            logger.warn("Verification email could not be delivered for registered user: {}", cleanEmail);
        }

        return "Registration successful. Please check your email to verify your account.";
    }

    @Transactional
    public String verifyEmail(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            throw new ConflictException("Verification token is required.");
        }

        String tokenHash = JwtUtil.hashToken(rawToken.trim());
        EmailVerificationToken token = emailVerificationTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unrecognized verification link."));

        if (token.isUsed()) {
            return "This email has already been verified. You can proceed to log in.";
        }

        if (token.isExpired()) {
            throw new ConflictException("This verification link has expired. Please request a new verification email.");
        }

        token.setUsedAt(LocalDateTime.now());
        emailVerificationTokenRepository.save(token);

        User user = token.getUser();
        user.setVerified(true);
        userRepository.save(user);

        return "Email verified successfully! You can now log in to StockPilot.";
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String clientIp) {
        checkRateLimit("login:" + clientIp, 10, 60000, "Too many login attempts. Please wait a minute and try again.");

        String cleanEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new ConflictException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ConflictException("Invalid email or password.");
        }

        if (!user.isVerified()) {
            throw new ConflictException("Your email is not verified. Please check your inbox or request a new verification email.");
        }

        // Generate Access Token
        String accessToken = jwtUtil.generateAccessToken(user);

        // Generate Refresh Token (7 days)
        String rawRefreshToken = jwtUtil.generateSecureRandomToken();
        String refreshHash = JwtUtil.hashToken(rawRefreshToken);
        LocalDateTime refreshExpiry = LocalDateTime.now().plusDays(7);

        UserRefreshToken refreshToken = new UserRefreshToken(user, refreshHash, refreshExpiry);
        userRefreshTokenRepository.save(refreshToken);

        AuthResponse.UserDto userDto = new AuthResponse.UserDto(
                user.getId(),
                user.getBusiness().getId(),
                user.getBusiness().getName(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isVerified()
        );

        return new AuthResponse(accessToken, rawRefreshToken, accessTokenExpirationMs / 1000, userDto);
    }

    @Transactional
    public String resendVerification(ResendVerificationRequest request, String clientIp) {
        checkRateLimit("resend:" + clientIp, 5, 60000, "Too many resend attempts. Please wait a minute.");

        String cleanEmail = request.getEmail().trim().toLowerCase();
        Optional<User> optionalUser = userRepository.findByEmailIgnoreCase(cleanEmail);

        // Always return generic message to avoid email enumeration
        String genericResponse = "If your account exists and is unverified, a new verification link has been sent to your email.";

        if (optionalUser.isEmpty() || optionalUser.get().isVerified()) {
            return genericResponse;
        }

        User user = optionalUser.get();
        emailVerificationTokenRepository.deleteByUserId(user.getId());

        String rawToken = jwtUtil.generateSecureRandomToken();
        String tokenHash = JwtUtil.hashToken(rawToken);
        LocalDateTime expiry = LocalDateTime.now().plusHours(24);

        EmailVerificationToken verificationToken = new EmailVerificationToken(user, tokenHash, expiry);
        emailVerificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), rawToken);
        return genericResponse;
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request, String clientIp) {
        checkRateLimit("forgot:" + clientIp, 5, 60000, "Too many password reset requests. Please wait a minute.");

        String cleanEmail = request.getEmail().trim().toLowerCase();
        Optional<User> optionalUser = userRepository.findByEmailIgnoreCase(cleanEmail);

        String genericResponse = "If an account with that email exists, we have sent a password reset link to your email.";

        if (optionalUser.isEmpty() || !optionalUser.get().isVerified()) {
            return genericResponse;
        }

        User user = optionalUser.get();
        passwordResetTokenRepository.deleteByUserId(user.getId());

        String rawToken = jwtUtil.generateSecureRandomToken();
        String tokenHash = JwtUtil.hashToken(rawToken);
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(30);

        PasswordResetToken resetToken = new PasswordResetToken(user, tokenHash, expiry);
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), rawToken);
        return genericResponse;
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        if (request.getToken() == null || request.getToken().trim().isEmpty()) {
            throw new ConflictException("Reset token is required.");
        }

        String tokenHash = JwtUtil.hashToken(request.getToken().trim());
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unrecognized password reset link."));

        if (token.isUsed()) {
            throw new ConflictException("This password reset link has already been used.");
        }

        if (token.isExpired()) {
            throw new ConflictException("This password reset link has expired. Please request a new one.");
        }

        token.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(token);

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Revoke all active sessions on password change
        userRefreshTokenRepository.revokeAllByUserId(user.getId());

        return "Password successfully reset! You can now log in with your new password.";
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String tokenHash = JwtUtil.hashToken(request.getRefreshToken().trim());
        UserRefreshToken storedToken = userRefreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ConflictException("Invalid session. Please log in again."));

        if (!storedToken.isValid()) {
            throw new ConflictException("Session has expired or been revoked. Please log in again.");
        }

        User user = storedToken.getUser();
        String newAccessToken = jwtUtil.generateAccessToken(user);

        AuthResponse.UserDto userDto = new AuthResponse.UserDto(
                user.getId(),
                user.getBusiness().getId(),
                user.getBusiness().getName(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isVerified()
        );

        return new AuthResponse(newAccessToken, request.getRefreshToken(), accessTokenExpirationMs / 1000, userDto);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.trim().isEmpty()) {
            String tokenHash = JwtUtil.hashToken(rawRefreshToken.trim());
            userRefreshTokenRepository.findByTokenHash(tokenHash).ifPresent(t -> {
                t.setRevoked(true);
                userRefreshTokenRepository.save(t);
            });
        }

        Long currentUserId = TenantContext.getCurrentUserId();
        if (currentUserId != null) {
            userRefreshTokenRepository.revokeAllByUserId(currentUserId);
        }
    }

    private void checkRateLimit(String key, int maxRequests, long windowMs, String errorMessage) {
        if (!rateLimiter.tryAcquire(key, maxRequests, windowMs)) {
            throw new ConflictException(errorMessage);
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return null;
        }
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() == 12 && digits.startsWith("91")) {
            digits = digits.substring(2);
        } else if (digits.length() == 11 && digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        return digits;
    }
}
