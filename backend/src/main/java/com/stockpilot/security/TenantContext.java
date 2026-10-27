package com.stockpilot.security;

public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT_BUSINESS_ID = new ThreadLocal<>();
    private static final ThreadLocal<Long> CURRENT_USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_USER_EMAIL = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_USER_ROLE = new ThreadLocal<>();

    private TenantContext() {
    }

    public static Long getCurrentBusinessId() {
        return CURRENT_BUSINESS_ID.get();
    }

    public static void setCurrentBusinessId(Long businessId) {
        CURRENT_BUSINESS_ID.set(businessId);
    }

    public static void setCurrentTenant(Long businessId, Long userId) {
        CURRENT_BUSINESS_ID.set(businessId);
        CURRENT_USER_ID.set(userId);
    }

    public static Long getCurrentUserId() {
        return CURRENT_USER_ID.get();
    }

    public static void setCurrentUserId(Long userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static String getCurrentUserEmail() {
        return CURRENT_USER_EMAIL.get();
    }

    public static void setCurrentUserEmail(String email) {
        CURRENT_USER_EMAIL.set(email);
    }

    public static String getCurrentUserRole() {
        return CURRENT_USER_ROLE.get();
    }

    public static void setCurrentUserRole(String role) {
        CURRENT_USER_ROLE.set(role);
    }

    public static void clear() {
        CURRENT_BUSINESS_ID.remove();
        CURRENT_USER_ID.remove();
        CURRENT_USER_EMAIL.remove();
        CURRENT_USER_ROLE.remove();
    }
}
