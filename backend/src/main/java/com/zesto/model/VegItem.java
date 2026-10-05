package com.zesto.model;

public class VegItem extends FoodItem {

    private boolean jain;

    public VegItem(String name, double basePrice, Cuisine cuisine, boolean jain) {
        super(name, basePrice, cuisine);
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