package com.zesto.service;

import com.zesto.model.Beverage;
import com.zesto.model.FoodItem;
import com.zesto.model.NonVegItem;
import com.zesto.model.Restaurant;
import com.zesto.model.VegItem;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Encapsulation (scoring rules and keyword heuristics encapsulated)
 *   - Polymorphism (instanceof pattern matching with FoodItem subtypes)
 *   - Streams, Lambdas & Custom Comparators
 *   - Separation of Concerns
 *
 * Mood Categories:
 *   - COMFORT: Hearty, rich, warming foods (curries, dal, pizza, biryani)
 *   - SPICY: High spice levels, pungent chili gravies, bold flavors
 *   - LIGHT: Clean, low calorie, steamed items (idli, soups, salads)
 *   - SWEET: Desserts, sweet beverages, lassi, confectioneries
 *   - QUICK: Beverages, finger snacks, fast food bites
 */
public class MoodScorer {

    public enum Mood {
        COMFORT, SPICY, LIGHT, SWEET, QUICK;

        public static Mood fromString(String raw) {
            if (raw == null) return COMFORT;
            try {
                return Mood.valueOf(raw.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                return COMFORT;
            }
        }
    }

    public static class ScoredDish {
        private final FoodItem item;
        private final Restaurant restaurant;
        private final int score;
        private final String matchReason;

        public ScoredDish(FoodItem item, Restaurant restaurant, int score, String matchReason) {
            this.item = item;
            this.restaurant = restaurant;
            this.score = score;
            this.matchReason = matchReason;
        }

        public FoodItem getItem() { return item; }
        public Restaurant getRestaurant() { return restaurant; }
        public int getScore() { return score; }
        public String getMatchReason() { return matchReason; }
    }

    public List<ScoredDish> scoreDishesForMood(List<Restaurant> restaurants, Mood mood, int limit) {
        List<ScoredDish> scored = new ArrayList<>();

        for (Restaurant r : restaurants) {
            for (FoodItem item : r.getMenu()) {
                ScoredDish match = evaluateItem(item, r, mood);
                if (match.getScore() > 0) {
                    scored.add(match);
                }
            }
        }

        scored.sort(Comparator.comparingInt(ScoredDish::getScore).reversed());

        if (scored.size() > limit) {
            return scored.subList(0, limit);
        }
        return scored;
    }

    private ScoredDish evaluateItem(FoodItem item, Restaurant r, Mood mood) {
        String name = item.getName().toLowerCase();
        int score = 0;
        String reason = "Great match for your current vibe";

        switch (mood) {
            case COMFORT -> {
                if (name.contains("butter") || name.contains("dal") || name.contains("paneer") || name.contains("biryani") || name.contains("pizza")) {
                    score += 85;
                    reason = "Warm, rich and soothing soul food";
                }
                if (item.getPrice() >= 180 && item.getPrice() <= 350) {
                    score += 15;
                }
            }
            case SPICY -> {
                if (item instanceof NonVegItem nonVeg && nonVeg.getSpiceLevel() >= 2) {
                    score += 60 + (nonVeg.getSpiceLevel() * 15);
                    reason = "Hot & fiery (Spice Level " + nonVeg.getSpiceLevel() + "★)";
                } else if (name.contains("arrabbiata") || name.contains("mirchi") || name.contains("chili") || name.contains("spicy")) {
                    score += 75;
                    reason = "Zesty & bold hot chili flavor";
                }
            }
            case LIGHT -> {
                if (name.contains("idli") || name.contains("salad") || name.contains("dosa") || name.contains("soup")) {
                    score += 90;
                    reason = "Fresh, steamed and guilt-free";
                } else if (item instanceof VegItem veg && veg.isJain()) {
                    score += 60;
                    reason = "Pure, satvik and gentle on the stomach";
                }
            }
            case SWEET -> {
                if (name.contains("jamun") || name.contains("dessert") || name.contains("cake") || name.contains("lassi") || name.contains("kheer")) {
                    score += 95;
                    reason = "Sweet dessert to lift your spirits";
                } else if (r.getCuisine() == com.zesto.model.Cuisine.DESSERTS) {
                    score += 80;
                    reason = "Artisanal sweet specialty";
                }
            }
            case QUICK -> {
                if (item instanceof Beverage) {
                    score += 90;
                    reason = "Instant refresh, zero wait time";
                } else if (r.getCuisine() == com.zesto.model.Cuisine.FAST_FOOD || name.contains("vada") || name.contains("naan")) {
                    score += 75;
                    reason = "Ready in under 15 minutes";
                }
            }
        }

        return new ScoredDish(item, r, score, reason);
    }
}
