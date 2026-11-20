package com.zesto.service.planner;

import com.zesto.model.FoodItem;
import java.util.List;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Strategy Design Pattern (behavioral pattern for interchangeable meal planning algorithms)
 *   - Interface Segregation (clean contract for meal selection algorithms)
 *   - Polymorphism (GreedyStrategy vs KnapsackStrategy implement this interface)
 */
public interface MealPlanStrategy {

    /**
     * Selects an optimal subset of food items that satisfies the budget, party size, and dietary constraints.
     *
     * @param availableItems Items available from the restaurant menu matching dietary restrictions
     * @param budget Maximum allowable total spend in Rupees
     * @param people Number of people dining
     * @param diet Dietary preference ("veg", "non-veg", "jain")
     * @param maxSpice Maximum spice level tolerance (0 to 3)
     * @return Selected items fitting the strategy
     */
    List<FoodItem> selectItems(List<FoodItem> availableItems, double budget, int people, String diet, int maxSpice);

    /**
     * Name and description of the strategy for presentation in the viva.
     */
    String getStrategyName();

    String getStrategyDescription();
}
