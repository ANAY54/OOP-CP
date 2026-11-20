package com.zesto.model.achievement;

import com.zesto.model.Customer;
import com.zesto.model.Order;

import java.util.List;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Interface Definition (Clean contract for polymorphic gamification badges)
 *   - Polymorphism (Evaluates distinct unlocking logic for each concrete rule)
 *   - Open/Closed Principle (New badges can be added without modifying existing badge classes)
 */
public interface Achievement {

    String getId();

    String getTitle();

    String getDescription();

    String getIcon();

    int getTarget();

    int getProgress(Customer customer, List<Order> orders);

    default boolean isUnlocked(Customer customer, List<Order> orders) {
        return getProgress(customer, orders) >= getTarget();
    }
}
