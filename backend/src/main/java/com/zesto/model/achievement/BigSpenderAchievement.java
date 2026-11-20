package com.zesto.model.achievement;

import com.zesto.model.Customer;
import com.zesto.model.Order;

import java.util.List;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Polymorphism (implements Achievement interface)
 *   - Streams & Aggregations
 */
public class BigSpenderAchievement implements Achievement {

    @Override
    public String getId() { return "BIG_SPENDER"; }

    @Override
    public String getTitle() { return "Royal Feaster"; }

    @Override
    public String getDescription() { return "Treated yourself to a feast over Rs. 500"; }

    @Override
    public String getIcon() { return "\uD83D\uDC51"; }

    @Override
    public int getTarget() { return 1; }

    @Override
    public int getProgress(Customer customer, List<Order> orders) {
        boolean hasBigOrder = orders.stream().anyMatch(o -> o.getTotal() >= 500.0);
        return hasBigOrder ? 1 : 0;
    }
}
