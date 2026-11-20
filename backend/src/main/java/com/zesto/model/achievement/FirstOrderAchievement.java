package com.zesto.model.achievement;

import com.zesto.model.Customer;
import com.zesto.model.Order;

import java.util.List;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Polymorphism (implements Achievement interface)
 *   - Encapsulation
 */
public class FirstOrderAchievement implements Achievement {

    @Override
    public String getId() { return "FIRST_ORDER"; }

    @Override
    public String getTitle() { return "First Feast"; }

    @Override
    public String getDescription() { return "Placed your very first order on Zesto"; }

    @Override
    public String getIcon() { return "\uD83C\uDF89"; }

    @Override
    public int getTarget() { return 1; }

    @Override
    public int getProgress(Customer customer, List<Order> orders) {
        return Math.min(1, orders.size());
    }
}
