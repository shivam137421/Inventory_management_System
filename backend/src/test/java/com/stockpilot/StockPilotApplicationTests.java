package com.stockpilot;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class StockPilotApplicationTests {

    @Test
    void contextLoads() {
        // Verifies Spring context bootstrap, Flyway migration execution, and Hibernate schema validation
    }
}
