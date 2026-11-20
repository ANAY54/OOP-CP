package com.zesto.service.planner;

import com.zesto.model.Beverage;
import com.zesto.model.FoodItem;
import com.zesto.model.NonVegItem;
import com.zesto.model.Restaurant;
import com.zesto.model.VegItem;
import com.zesto.service.RestaurantService;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Strategy Pattern Context (holds a reference to MealPlanStrategy and executes it dynamically)
 *   - Composition (depends on RestaurantService)
 *   - Encapsulation & Separation of Concerns (meal planning logic isolated from HTTP layer)
 *   - Polymorphism (supports interchangeable strategies via MealPlanStrategy interface)
 */
public class MealPlanner {

    private final RestaurantService restaurantService;
    private MealPlanStrategy strategy;

    public MealPlanner(RestaurantService restaurantService) {
        this(restaurantService, new KnapsackStrategy());
    }

    public MealPlanner(RestaurantService restaurantService, MealPlanStrategy strategy) {
        this.restaurantService = restaurantService;
        this.strategy = strategy;
    }

    public void setStrategy(MealPlanStrategy strategy) {
        this.strategy = strategy;
    }

    public MealPlanStrategy getStrategy() {
        return strategy;
    }

    /**
     * Finds the best single-restaurant meal combination for the requested budget and preferences.
     */
    public Map<String, Object> planMeal(double budget, int people, String diet, int maxSpice) {
        List<Restaurant> restaurants = restaurantService.getAll();
        Map<String, Object> bestPlan = null;
        double bestSpend = 0.0;

        for (Restaurant r : restaurants) {
            List<FoodItem> compliantItems = filterMenu(r.getMenu(), diet, maxSpice);
            if (compliantItems.isEmpty()) continue;

            List<FoodItem> chosen = strategy.selectItems(compliantItems, budget, people, diet, maxSpice);
            if (chosen.isEmpty()) continue;

            double total = chosen.stream().mapToDouble(FoodItem::getPrice).sum();
            if (total <= budget && (bestPlan == null || total > bestSpend)) {
                bestSpend = total;
                bestPlan = new LinkedHashMap<>();
                bestPlan.put("restaurantId", r.getId());
                bestPlan.put("restaurantName", r.getName());
                bestPlan.put("restaurantImage", r.getImageUrl());
                bestPlan.put("restaurantRating", r.getRating());
                bestPlan.put("budget", budget);
                bestPlan.put("totalSpend", Math.round(total * 100.0) / 100.0);
                bestPlan.put("savings", Math.round(Math.max(0, budget - total) * 100.0) / 100.0);
                bestPlan.put("people", people);
                bestPlan.put("strategyUsed", strategy.getStrategyName());
                bestPlan.put("strategyDescription", strategy.getStrategyDescription());

                List<Map<String, Object>> itemSummaries = new ArrayList<>();
                for (FoodItem item : chosen) {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", item.getId());
                    m.put("name", item.getName());
                    m.put("price", item.getPrice());
                    m.put("type", item.getType());
                    m.put("imageUrl", item.getImageUrl());
                    itemSummaries.add(m);
                }
                bestPlan.put("items", itemSummaries);
            }
        }

        if (bestPlan == null) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("error", "No restaurant could fulfill this budget with the selected diet filter. Try increasing the budget.");
            empty.put("items", Collections.emptyList());
            return empty;
        }

        return bestPlan;
    }

    private List<FoodItem> filterMenu(List<FoodItem> menu, String diet, int maxSpice) {
        List<FoodItem> filtered = new ArrayList<>();
        String normalizedDiet = (diet == null ? "any" : diet).trim().toLowerCase();

        for (FoodItem item : menu) {
            // Dietary check
            if ("veg".equals(normalizedDiet)) {
                if (item instanceof NonVegItem) continue;
            } else if ("jain".equals(normalizedDiet)) {
                if (!(item instanceof VegItem veg && veg.isJain())) continue;
            } else if ("non-veg".equals(normalizedDiet)) {
                // Allows all items or prioritizes non-veg
            }

            // Spice check
            if (item instanceof NonVegItem nonVeg && nonVeg.getSpiceLevel() > maxSpice) {
                continue;
            }

            filtered.add(item);
        }
        return filtered;
    }
}
