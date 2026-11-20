package com.zesto.model;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends FoodItem abstract base class)
 *   - Method Overriding (overrides calculatePrice() based on beverage liquid volume)
 *   - Constructor Chaining via super()
 *   - Encapsulation (sizeMl and cold beverage attributes)
 */
public class Beverage extends FoodItem {

    private int sizeMl;
    private boolean cold;

    public Beverage(String name, double basePrice, int sizeMl, boolean cold) {
        super(name, basePrice, Cuisine.BEVERAGES);
        this.sizeMl = sizeMl;
        this.cold = cold;
    }

    public Beverage(String name, double basePrice, int sizeMl, boolean cold, String description, String imageUrl) {
        super(name, basePrice, Cuisine.BEVERAGES, description, imageUrl);
        this.sizeMl = sizeMl;
        this.cold = cold;
    }

    public int getSizeMl() {
        return sizeMl;
    }

    public boolean isCold() {
        return cold;
    }

    @Override
    public double calculatePrice() {
        return sizeMl > 500 ? getBasePrice() + 20 : getBasePrice();
    }

    @Override
    public String getCategory() {
        return "BEVERAGE";
    }
}
