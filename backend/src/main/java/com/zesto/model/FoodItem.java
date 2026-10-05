package com.zesto.model;

import java.util.Objects;

/**
 * OOP CONCEPTS:
 *   - Abstract Class (abstract calculatePrice and getCategory force subclass to define behaviour)
 *   - Inheritance base (VegItem, NonVegItem, Beverage all extend this)
 *   - Comparable interface (compareTo by price — enables sorting)
 *   - Constructor Overloading (with/without description)
 *   - Encapsulation (private id, final setBasePrice validates input)
 *   - final method (setBasePrice — cannot be overridden)
 *   - Static counter (idCounter — auto-increments across all FoodItem instances)
 */
public abstract class FoodItem implements Comparable<FoodItem> {

    private static int idCounter = 0;

    private final int id;
    private String name;
    private double basePrice;
    private Cuisine cuisine;
    private String description;

    public FoodItem(String name, double basePrice, Cuisine cuisine) {
        this(name, basePrice, cuisine, "No description available");
    }

    public FoodItem(String name, double basePrice, Cuisine cuisine, String description) {
        this.id = ++idCounter;
        this.name = name;
        setBasePrice(basePrice);
        this.cuisine = cuisine;
        this.description = description;
    }

    public abstract double calculatePrice();

    public abstract String getCategory();

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