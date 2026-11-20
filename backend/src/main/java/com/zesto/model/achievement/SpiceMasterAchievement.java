package com.zesto.model.achievement;

import com.zesto.model.Customer;
import com.zesto.model.Order;

import java.util.List;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Polymorphism (implements Achievement interface)
 */
public class SpiceMasterAchievement implements Achievement {

    @Override
    public String getId() { return "SPICE_MASTER"; }

    @Override
    public String getTitle() { return "Spice Master"; }

    @Override
    public String getDescription() { return "Conquered 2 flaming hot spicy dishes"; }

    @Override
    public String getIcon() { return "\uD83C\uDF36\uFE0F"; }

    @Override
    public int getTarget() { return 2; }

    @Override
    public int getProgress(Customer customer, List<Order> orders) {
        int spicyCount = 0;
        for (Order o : orders) {
            for (Order.OrderLine line : o.getLines()) {
                String name = line.getItemName().toLowerCase();
                if (name.contains("biryani") || name.contains("arrabbiata") || name.contains("chili") || name.contains("spicy")) {
                    spicyCount++;
                }
            }
        }
        return Math.min(getTarget(), spicyCount);
    }
}
