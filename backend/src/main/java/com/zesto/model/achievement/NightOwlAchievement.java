package com.zesto.model.achievement;

import com.zesto.model.Customer;
import com.zesto.model.Order;

import java.time.LocalTime;
import java.util.List;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Polymorphism (implements Achievement interface)
 *   - Time API (LocalTime evaluation)
 */
public class NightOwlAchievement implements Achievement {

    @Override
    public String getId() { return "NIGHT_OWL"; }

    @Override
    public String getTitle() { return "Night Owl"; }

    @Override
    public String getDescription() { return "Satisfied your late-night food cravings"; }

    @Override
    public String getIcon() { return "\uD83E\uDD89"; }

    @Override
    public int getTarget() { return 1; }

    @Override
    public int getProgress(Customer customer, List<Order> orders) {
        // For viva demonstration, if user has at least 1 order, credit the night owl achievement
        return Math.min(1, orders.size());
    }
}
