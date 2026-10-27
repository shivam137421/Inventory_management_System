package com.stockpilot;

import com.stockpilot.dto.AuthResponse;
import com.stockpilot.dto.ForgotPasswordRequest;
import com.stockpilot.dto.LoginRequest;
import com.stockpilot.dto.ProductRequest;
import com.stockpilot.dto.ProductResponse;
import com.stockpilot.dto.RegisterRequest;
import com.stockpilot.dto.ResetPasswordRequest;
import com.stockpilot.entity.Business;
import com.stockpilot.entity.EmailVerificationToken;
import com.stockpilot.entity.PasswordResetToken;
import com.stockpilot.entity.User;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.exception.ResourceNotFoundException;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.repository.EmailVerificationTokenRepository;
import com.stockpilot.repository.PasswordResetTokenRepository;
import com.stockpilot.repository.UserRepository;
import com.stockpilot.security.JwtUtil;
import com.stockpilot.security.RateLimiter;
import com.stockpilot.security.TenantContext;
import com.stockpilot.service.AuthService;
import com.stockpilot.service.ProductService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthAndTenantSecurityTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private ProductService productService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private RateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter.clear();
        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Owner registration creates business and unverified user with verification token")
    void testRegisterNewBusinessAndOwner() {
        RegisterRequest request = new RegisterRequest(
                "Sharma Kirana Store",
                "Ramesh Sharma",
                "ramesh@example.com",
                "9876543210",
                "SecurePassword123!"
        );

        String result = authService.register(request, "127.0.0.1");
        assertNotNull(result);

        User user = userRepository.findByEmailIgnoreCase("ramesh@example.com").orElse(null);
        assertNotNull(user);
        assertEquals("Ramesh Sharma", user.getFullName());
        assertEquals("OWNER", user.getRole());
        assertFalse(user.isVerified(), "Newly registered owner must be unverified");
        assertEquals("Sharma Kirana Store", user.getBusiness().getName());

        List<EmailVerificationToken> tokens = emailVerificationTokenRepository.findAll();
        boolean hasTokenForUser = tokens.stream().anyMatch(t -> t.getUser().getId().equals(user.getId()));
        assertTrue(hasTokenForUser, "Email verification token must be stored in database");
    }

    @Test
    @DisplayName("Duplicate email registration must be rejected with 409 Conflict")
    void testDuplicateRegistrationBlocked() {
        RegisterRequest request1 = new RegisterRequest("Store A", "User A", "duplicate@example.com", "9876543210", "Password123!");
        authService.register(request1, "127.0.0.1");

        RegisterRequest request2 = new RegisterRequest("Store B", "User B", "DUPLICATE@example.com", "9876543211", "Password456!");
        assertThrows(ConflictException.class, () -> authService.register(request2, "127.0.0.1"));
    }

    @Test
    @DisplayName("Login is strictly blocked for unverified accounts")
    void testLoginBlockedForUnverifiedUser() {
        RegisterRequest regReq = new RegisterRequest("Gupta Groceries", "Sunil Gupta", "sunil@example.com", "9123456780", "Password123!");
        authService.register(regReq, "127.0.0.1");

        LoginRequest loginReq = new LoginRequest("sunil@example.com", "Password123!");
        ConflictException ex = assertThrows(ConflictException.class, () -> authService.login(loginReq, "127.0.0.1"));
        assertTrue(ex.getMessage().contains("email is not verified"), "Must specify unverified status");
    }

    @Test
    @DisplayName("Email verification flow verifies user and marks token used")
    void testVerifyEmailFlow() {
        Business business = businessRepository.save(new Business("Verif Store", "Delhi", "9876543210", "verif@example.com", null));
        User user = userRepository.save(new User(business, "Verif Owner", "verif@example.com", "9876543210", "hash", "OWNER", false));

        String rawToken = "sample-secure-token-12345678901234";
        String tokenHash = JwtUtil.hashToken(rawToken);
        emailVerificationTokenRepository.save(new EmailVerificationToken(user, tokenHash, LocalDateTime.now().plusHours(24)));

        String verifyResult = authService.verifyEmail(rawToken);
        assertTrue(verifyResult.contains("verified successfully"));

        User verifiedUser = userRepository.findById(user.getId()).orElseThrow();
        assertTrue(verifiedUser.isVerified(), "User must be marked verified");

        EmailVerificationToken usedToken = emailVerificationTokenRepository.findByTokenHash(tokenHash).orElseThrow();
        assertTrue(usedToken.isUsed(), "Token must be recorded as used");
    }

    @Test
    @DisplayName("Verified user login returns valid JWT access and refresh token")
    void testVerifiedUserLoginSuccess() {
        RegisterRequest regReq = new RegisterRequest("Verif Login Store", "Ajay Verma", "ajay@example.com", "9988776655", "Password123!");
        authService.register(regReq, "127.0.0.1");

        User user = userRepository.findByEmailIgnoreCase("ajay@example.com").orElseThrow();
        user.setVerified(true);
        userRepository.save(user);

        LoginRequest loginReq = new LoginRequest("ajay@example.com", "Password123!");
        AuthResponse response = authService.login(loginReq, "127.0.0.1");

        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("Ajay Verma", response.getUser().getFullName());
        assertEquals(user.getBusiness().getId(), response.getUser().getBusinessId());
    }

    @Test
    @DisplayName("Forgot password returns generic message and allows password reset with session invalidation")
    void testPasswordResetFlow() {
        RegisterRequest regReq = new RegisterRequest("Reset Store", "Mohan Lal", "mohan@example.com", "9876543210", "OldPassword123!");
        authService.register(regReq, "127.0.0.1");

        User user = userRepository.findByEmailIgnoreCase("mohan@example.com").orElseThrow();
        user.setVerified(true);
        userRepository.save(user);

        // Forgot password request
        String forgotResult = authService.forgotPassword(new ForgotPasswordRequest("mohan@example.com"), "127.0.0.1");
        assertTrue(forgotResult.contains("password reset link"));

        // Get issued reset token
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findAll();
        PasswordResetToken resetToken = tokens.stream()
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .findFirst()
                .orElseThrow();

        // Perform password reset with valid raw token
        String rawResetToken = "simulated-raw-reset-token";
        resetToken.setTokenHash(JwtUtil.hashToken(rawResetToken));
        passwordResetTokenRepository.save(resetToken);

        ResetPasswordRequest resetReq = new ResetPasswordRequest(rawResetToken, "NewSecurePassword456!");
        String resetMsg = authService.resetPassword(resetReq);
        assertTrue(resetMsg.contains("successfully reset"));

        // Login with old password must fail
        assertThrows(ConflictException.class, () ->
                authService.login(new LoginRequest("mohan@example.com", "OldPassword123!"), "127.0.0.1"));

        // Login with new password must succeed
        AuthResponse loginResp = authService.login(new LoginRequest("mohan@example.com", "NewSecurePassword456!"), "127.0.0.1");
        assertNotNull(loginResp.getAccessToken());
    }

    @Test
    @DisplayName("Multi-tenant isolation: Business B cannot access or modify Business A's data (returns 404)")
    void testTenantIsolationBetweenBusinesses() {
        // 1. Setup Business A
        Business businessA = businessRepository.save(new Business("Business A Store", "Pune", "9000000001", "bizA@example.com", null));
        TenantContext.setCurrentBusinessId(businessA.getId());

        ProductRequest prodReqA = new ProductRequest("COMMON-SKU", "Basmati Rice A", "Grains", 50, 10, new BigDecimal("100.00"));
        ProductResponse prodA = productService.createProduct(prodReqA);
        assertNotNull(prodA.getId());

        // 2. Setup Business B
        Business businessB = businessRepository.save(new Business("Business B Store", "Mumbai", "9000000002", "bizB@example.com", null));
        TenantContext.setCurrentBusinessId(businessB.getId());

        // Business B creates a product with the SAME SKU "COMMON-SKU" (Allowed per business!)
        ProductRequest prodReqB = new ProductRequest("COMMON-SKU", "Basmati Rice B", "Grains", 30, 5, new BigDecimal("120.00"));
        ProductResponse prodB = productService.createProduct(prodReqB);
        assertNotNull(prodB.getId());

        // Business B lists all products -> only sees prodB, NOT prodA
        List<ProductResponse> bProducts = productService.getAllProducts();
        assertEquals(1, bProducts.size());
        assertEquals(prodB.getId(), bProducts.get(0).getId());

        // Business B attempts to fetch Product A by ID -> Must throw ResourceNotFoundException (HTTP 404)
        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(prodA.getId()));

        // Business B attempts to delete Product A -> Must throw ResourceNotFoundException (HTTP 404)
        assertThrows(ResourceNotFoundException.class, () -> productService.deleteProduct(prodA.getId()));
    }
}
