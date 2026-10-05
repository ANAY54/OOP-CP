package com.zesto.model;

public class NonVegItem extends FoodItem {

    private static final double HANDLING_FEE = 15.0;

    private int spiceLevel;

    public NonVegItem(String name, double basePrice, Cuisine cuisine, int spiceLevel) {
        super(name, basePrice, cuisine);
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