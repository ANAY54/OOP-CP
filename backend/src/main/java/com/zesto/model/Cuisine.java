package com.zesto.model;

public enum Cuisine {
    NORTH_INDIAN("North Indian"),
    SOUTH_INDIAN("South Indian"),
    CHINESE("Chinese"),
    ITALIAN("Italian"),
    FAST_FOOD("Fast Food"),
    DESSERTS("Desserts"),
    BEVERAGES("Beverages");

    private final String displayName;

    Cuisine(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}