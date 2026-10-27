package com.stockpilot.security;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

@Component
public class RateLimiter {

    private static class Window {
        long windowStart;
        AtomicInteger count;

        Window(long start) {
            this.windowStart = start;
            this.count = new AtomicInteger(1);
        }
    }

    private final Map<String, Window> requestCounts = new ConcurrentHashMap<>();

    public boolean tryAcquire(String key, int maxRequests, long windowMs) {
        long now = System.currentTimeMillis();
        Window window = requestCounts.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart > windowMs) {
                return new Window(now);
            }
            existing.count.incrementAndGet();
            return existing;
        });

        return window.count.get() <= maxRequests;
    }

    public void clear() {
        requestCounts.clear();
    }
}
