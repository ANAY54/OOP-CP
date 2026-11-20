package com.zesto.service.planner;

import com.zesto.model.FoodItem;
import com.zesto.model.NonVegItem;
import com.zesto.model.VegItem;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Strategy Pattern Concrete Implementation (0/1 Knapsack Dynamic Programming)
 *   - Polymorphism (implements MealPlanStrategy)
 *   - Dynamic Programming Algorithm (maximizes satisfaction score within exact budget constraint)
 *   - Encapsulation
 *
 * Algorithm:
 *   Models meal selection as an integer Knapsack problem:
 *   Capacity = Budget (in rounded rupees)
 *   Item Weight = FoodItem Price
 *   Item Value = Estimated satisfaction score derived from portion density, spice affinity & base price
 *   Time Complexity: O(N * W), Space Complexity: O(N * W) with backtracking to reconstruct optimal selection.
 */
public class KnapsackStrategy implements MealPlanStrategy {

    @Override
    public List<FoodItem> selectItems(List<FoodItem> availableItems, double budget, int people, String diet, int maxSpice) {
        if (availableItems.isEmpty() || budget <= 0) {
            return Collections.emptyList();
        }

        int n = availableItems.size();
        int W = (int) Math.floor(budget);

        int[] weights = new int[n];
        int[] values = new int[n];

        for (int i = 0; i < n; i++) {
            FoodItem item = availableItems.get(i);
            weights[i] = Math.max(1, (int) Math.round(item.getPrice()));

            // Calculate satisfaction value:
            // Base satisfaction from price + bonus for balanced dietary preferences
            int satisfaction = weights[i];
            if (item instanceof VegItem veg && veg.isJain()) {
                satisfaction += 15;
            }
            if (item instanceof NonVegItem nonVeg && nonVeg.getSpiceLevel() <= maxSpice) {
                satisfaction += 20;
            }
            values[i] = satisfaction;
        }

        // DP Table
        int[][] dp = new int[n + 1][W + 1];

        for (int i = 1; i <= n; i++) {
            int wt = weights[i - 1];
            int val = values[i - 1];
            for (int w = 0; w <= W; w++) {
                if (wt <= w) {
                    dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - wt] + val);
                } else {
                    dp[i][w] = dp[i - 1][w];
                }
            }
        }

        // Backtrack to find selected items
        List<FoodItem> selected = new ArrayList<>();
        int w = W;
        for (int i = n; i > 0 && w > 0; i--) {
            if (dp[i][w] != dp[i - 1][w]) {
                FoodItem chosen = availableItems.get(i - 1);
                selected.add(chosen);
                w -= weights[i - 1];
            }
        }

        return selected;
    }

    @Override
    public String getStrategyName() {
        return "Knapsack 0/1 Dynamic Programming";
    }

    @Override
    public String getStrategyDescription() {
        return "Optimal DP algorithm maximizing meal satisfaction without exceeding the budget limit";
    }
}
