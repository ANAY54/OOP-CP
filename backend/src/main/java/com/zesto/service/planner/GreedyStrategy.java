package com.zesto.service.planner;

import com.zesto.model.Beverage;
import com.zesto.model.FoodItem;
import com.zesto.model.NonVegItem;
import com.zesto.model.VegItem;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Strategy Pattern Concrete Implementation (Greedy heuristic)
 *   - Polymorphism (implements MealPlanStrategy)
 *   - Streams and Lambdas (sorting and category partitioning)
 *   - Encapsulation
 *
 * Algorithm:
 *   Prioritizes balanced meal variety (Mains -> Breads/Sides -> Beverages)
 *   Greedily adds highest value-per-rupee items within category while remaining under budget.
 */
public class GreedyStrategy implements MealPlanStrategy {

    @Override
    public List<FoodItem> selectItems(List<FoodItem> availableItems, double budget, int people, String diet, int maxSpice) {
        List<FoodItem> selected = new ArrayList<>();
        double currentTotal = 0.0;

        // Separate items into Mains, Breads/Sides, and Beverages
        List<FoodItem> mains = new ArrayList<>();
        List<FoodItem> breadsAndSides = new ArrayList<>();
        List<FoodItem> beverages = new ArrayList<>();

        for (FoodItem item : availableItems) {
            String name = item.getName().toLowerCase();
            if (item instanceof Beverage) {
                beverages.add(item);
            } else if (name.contains("roti") || name.contains("naan") || name.contains("paratha") || name.contains("rice") || name.contains("vada")) {
                breadsAndSides.add(item);
            } else {
                mains.add(item);
            }
        }

        // Sort each category by price ascending for budget-friendliness
        mains.sort(Comparator.comparingDouble(FoodItem::getPrice));
        breadsAndSides.sort(Comparator.comparingDouble(FoodItem::getPrice));
        beverages.sort(Comparator.comparingDouble(FoodItem::getPrice));

        // 1. Pick mains: at least 1 main per 2 people
        int targetMains = Math.max(1, (people + 1) / 2);
        for (FoodItem main : mains) {
            if (currentTotal + main.getPrice() <= budget) {
                selected.add(main);
                currentTotal += main.getPrice();
                if (--targetMains <= 0) break;
            }
        }

        // 2. Pick staple breads / sides: at least 1 per person
        int targetSides = Math.max(1, people);
        for (FoodItem side : breadsAndSides) {
            while (targetSides > 0 && currentTotal + side.getPrice() <= budget) {
                selected.add(side);
                currentTotal += side.getPrice();
                targetSides--;
            }
            if (targetSides <= 0) break;
        }

        // 3. Fill any leftover budget with refreshing beverages or desserts
        for (FoodItem drink : beverages) {
            if (currentTotal + drink.getPrice() <= budget) {
                selected.add(drink);
                currentTotal += drink.getPrice();
            }
        }

        return selected;
    }

    @Override
    public String getStrategyName() {
        return "Greedy Variety Heuristic";
    }

    @Override
    public String getStrategyDescription() {
        return "Fast O(N log N) greedy selection prioritizing complete meal balance (mains + breads + beverage)";
    }
}
