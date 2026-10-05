package com.zesto.model;

public class Beverage extends FoodItem {

    private int sizeMl;
    private boolean cold;

    public Beverage(String name, double basePrice, int sizeMl, boolean cold) {
        super(name, basePrice, Cuisine.BEVERAGES);
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