package com.zesto.model;

import java.util.Objects;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Abstract Class (abstract calculatePrice and getCategory enforce runtime polymorphic behavior)
 *   - Inheritance Base (VegItem, NonVegItem, Beverage all extend this common abstraction)
 *   - Comparable Interface (compareTo by price enables natural ordering & Java Stream sorting)
 *   - Constructor Overloading (3 constructors with different argument profiles)
 *   - Encapsulation & Data Validation (private fields, final setBasePrice prevents invalid negative pricing)
 *   - final method (setBasePrice — prevents malicious override)
 *   - Static field (idCounter — auto-incrementing ID generation across instances)
 */
public abstract class FoodItem implements Comparable<FoodItem> {

    private static int idCounter = 0;

    private final int id;
    private String name;
    private double basePrice;
    private Cuisine cuisine;
    private String description;
    private String imageUrl;

    public FoodItem(String name, double basePrice, Cuisine cuisine) {
        this(name, basePrice, cuisine, "Freshly prepared by culinary experts", null);
    }

    public FoodItem(String name, double basePrice, Cuisine cuisine, String description) {
        this(name, basePrice, cuisine, description, null);
    }

    public FoodItem(String name, double basePrice, Cuisine cuisine, String description, String imageUrl) {
        this.id = ++idCounter;
        this.name = name;
        setBasePrice(basePrice);
        this.cuisine = cuisine;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    public abstract double calculatePrice();

    public abstract String getCategory();

    public double getPrice() {
        return calculatePrice();
    }

    public String getType() {
        return getCategory();
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public double getBasePrice() {
        return basePrice;
    }

    public final void setBasePrice(double basePrice) {
        if (basePrice <= 0) {
            throw new IllegalArgumentException("Price must be positive");
        }
        this.basePrice = basePrice;
    }

    public Cuisine getCuisine() {
        return cuisine;
    }

    public String getDescription() {
        return description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    @Override
    public int compareTo(FoodItem other) {
        return Double.compare(this.calculatePrice(), other.calculatePrice());
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof FoodItem)) return false;
        FoodItem other = (FoodItem) obj;
        return name.equalsIgnoreCase(other.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name.toLowerCase());
    }

    @Override
    public String toString() {
        return String.format("#%d %s [%s] Rs.%.2f", id, name, getCategory(), calculatePrice());
    }
}
