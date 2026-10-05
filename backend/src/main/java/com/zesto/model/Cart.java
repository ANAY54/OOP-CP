package com.zesto.model;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class Cart {

    private final Restaurant restaurant;
    private final Map<FoodItem, Integer> items = new LinkedHashMap<>();

    public Cart(Restaurant restaurant) {
        this.restaurant = restaurant;
    }

    public void add(FoodItem item, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        items.merge(item, quantity, Integer::sum);
    }

    public void add(FoodItem item) {
        add(item, 1);
    }

    public void remove(FoodItem item) {
        items.remove(item);
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    public double getSubtotal() {
        double total = 0;
        for (Map.Entry<FoodItem, Integer> entry : items.entrySet()) {
            total += entry.getKey().calculatePrice() * entry.getValue();
        }
        return total;
    }

    public int getTotalQuantity() {
        int count = 0;
        for (int qty : items.values()) {
            count += qty;
        }
        return count;
    }

    public Map<FoodItem, Integer> getItems() {
        return Collections.unmodifiableMap(items);
    }

    public Restaurant getRestaurant() {
        return restaurant;
    }
}