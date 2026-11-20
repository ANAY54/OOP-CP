package com.zesto.model;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends FoodItem abstract base class)
 *   - Method Overriding (overrides calculatePrice() with meat handling fee, and getCategory())
 *   - Polymorphism (runtime method dispatch based on actual object type)
 *   - Encapsulation (private spiceLevel field with getter)
 */
public class NonVegItem extends FoodItem {

    private static final double HANDLING_FEE = 15.0;

    private int spiceLevel;

    public NonVegItem(String name, double basePrice, Cuisine cuisine, int spiceLevel) {
        super(name, basePrice, cuisine);
        this.spiceLevel = spiceLevel;
    }

    public NonVegItem(String name, double basePrice, Cuisine cuisine, int spiceLevel, String description, String imageUrl) {
        super(name, basePrice, cuisine, description, imageUrl);
        this.spiceLevel = spiceLevel;
    }

    public int getSpiceLevel() {
        return spiceLevel;
    }

    @Override
    public double calculatePrice() {
        return getBasePrice() + HANDLING_FEE;
    }

    @Override
    public String getCategory() {
        return "NON-VEG";
    }
}
