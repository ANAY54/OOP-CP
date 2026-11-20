package com.zesto.model;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Enum (type-safe set of domain categories, replacing error-prone magic strings)
 *   - Enum Constructor & Encapsulation (private field displayName accessed via getter)
 *   - Domain Modeling (maps real-world OpenStreetMap and MealDB culinary classifications)
 */
public enum Cuisine {
    NORTH_INDIAN("North Indian"),
    SOUTH_INDIAN("South Indian"),
    CHINESE("Chinese"),
    ITALIAN("Italian"),
    FAST_FOOD("Fast Food"),
    DESSERTS("Desserts"),
    BEVERAGES("Beverages"),
    MULTI_CUISINE("Multi-Cuisine");

    private final String displayName;

    Cuisine(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
