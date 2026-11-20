package com.zesto.service;

import com.zesto.model.Cuisine;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Encapsulation & Separation of Concerns (isolates pricing and simulation algorithms)
 *   - Deterministic Seeding (ensures reproducible, stable viva demo data without randomness)
 *   - Business Logic Centralization (single source of truth for delivery fees and ETAs)
 */
public class PricingPolicy {

    private static final double BASE_DELIVERY_FEE = 20.0;
    private static final double PER_KM_RATE = 6.0;
    private static final int BASE_PREP_TIME_MIN = 15;

    public double calculateDeliveryFee(double distanceKm) {
        double fee = BASE_DELIVERY_FEE + (distanceKm * PER_KM_RATE);
        return Math.max(25.0, Math.round(fee));
    }

    public int calculateDeliveryTime(double distanceKm) {
        int time = BASE_PREP_TIME_MIN + (int) Math.round(distanceKm * 3.5);
        return Math.max(20, Math.min(time, 65));
    }

    public double generateRating(long seed) {
        int offset = (int) (Math.abs(seed * 31L) % 10);
        return Math.round((4.0 + (offset / 10.0)) * 10.0) / 10.0;
    }

    public int generateReviewCount(long seed) {
        return 120 + (int) (Math.abs(seed * 47L) % 2800);
    }

    public int generatePriceForTwo(long seed, Cuisine cuisine) {
        int base = switch (cuisine) {
            case NORTH_INDIAN -> 550;
            case SOUTH_INDIAN -> 300;
            case CHINESE -> 480;
            case ITALIAN -> 700;
            case FAST_FOOD -> 350;
            case DESSERTS -> 320;
            case BEVERAGES -> 250;
            default -> 450;
        };
        int variance = (int) (Math.abs(seed * 13L) % 150);
        return base + variance;
    }

    public String generateBadge(long seed) {
        int mod = (int) (Math.abs(seed) % 6);
        return switch (mod) {
            case 0 -> "Bestseller";
            case 1 -> "Trending";
            case 2 -> "Top rated";
            case 3 -> "Chef's Special";
            default -> null;
        };
    }

    public double generateDishPrice(long seed, boolean isVeg) {
        double base = isVeg ? 160.0 : 240.0;
        int step = (int) (Math.abs(seed * 19L) % 8) * 20;
        return base + step;
    }
}
