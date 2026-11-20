package com.zesto.service;

import com.zesto.model.Customer;
import com.zesto.model.Order;
import com.zesto.model.achievement.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Composition (maintains registered Achievement implementations)
 *   - Polymorphism (iterates over List<Achievement> uniformly)
 *   - Encapsulation & Separation of Concerns
 *   - Generics & Collections
 */
public class AchievementService {

    private final List<Achievement> registeredAchievements = new ArrayList<>();

    public AchievementService() {
        registeredAchievements.add(new FirstOrderAchievement());
        registeredAchievements.add(new VegWarriorAchievement());
        registeredAchievements.add(new SpiceMasterAchievement());
        registeredAchievements.add(new NightOwlAchievement());
        registeredAchievements.add(new BigSpenderAchievement());
    }

    public List<Map<String, Object>> evaluateForCustomer(Customer customer, List<Order> orders) {
        List<Map<String, Object>> results = new ArrayList<>();

        for (Achievement ach : registeredAchievements) {
            Map<String, Object> map = new LinkedHashMap<>();
            int progress = ach.getProgress(customer, orders);
            int target = ach.getTarget();
            boolean unlocked = ach.isUnlocked(customer, orders);

            map.put("id", ach.getId());
            map.put("title", ach.getTitle());
            map.put("description", ach.getDescription());
            map.put("icon", ach.getIcon());
            map.put("progress", progress);
            map.put("target", target);
            map.put("unlocked", unlocked);
            results.add(map);
        }

        return results;
    }
}
