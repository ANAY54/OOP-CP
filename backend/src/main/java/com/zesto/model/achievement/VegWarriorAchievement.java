package com.zesto.model.achievement;

import com.zesto.model.Customer;
import com.zesto.model.Order;

import java.util.List;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Polymorphism (implements Achievement interface)
 *   - Streams & Filter logic
 */
public class VegWarriorAchievement implements Achievement {

    @Override
    public String getId() { return "VEG_WARRIOR"; }

    @Override
    public String getTitle() { return "Veg Warrior"; }

    @Override
    public String getDescription() { return "Completed 3 pure vegetarian feasts"; }

    @Override
    public String getIcon() { return "\uD83E\uDD57"; }

    @Override
    public int getTarget() { return 3; }

    @Override
    public int getProgress(Customer customer, List<Order> orders) {
        int count = 0;
        for (Order o : orders) {
            boolean allVeg = true;
            for (Order.OrderLine line : o.getLines()) {
                String name = line.getItemName().toLowerCase();
                if (name.contains("chicken") || name.contains("mutton") || name.contains("lamb") || name.contains("meat")) {
                    allVeg = false;
                    break;
                }
            }
            if (allVeg) count++;
        }
        return Math.min(getTarget(), count);
    }
}
