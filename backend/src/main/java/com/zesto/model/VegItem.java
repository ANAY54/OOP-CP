package com.zesto.model;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends FoodItem abstract base class)
 *   - Method Overriding (overrides calculatePrice() and getCategory())
 *   - Polymorphism (dispatched dynamically when referenced as FoodItem)
 *   - Constructor Chaining via super()
 */
public class VegItem extends FoodItem {

    private boolean jain;

    public VegItem(String name, double basePrice, Cuisine cuisine, boolean jain) {
        super(name, basePrice, cuisine);
        this.jain = jain;
    }

    public VegItem(String name, double basePrice, Cuisine cuisine, boolean jain, String description, String imageUrl) {
        super(name, basePrice, cuisine, description, imageUrl);
        this.jain = jain;
    }

    public boolean isJain() {
        return jain;
    }

    @Override
    public double calculatePrice() {
        return getBasePrice();
    }

    @Override
    public String getCategory() {
        return jain ? "VEG (Jain)" : "VEG";
    }
}
