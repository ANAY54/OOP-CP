package com.zesto.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

public class Restaurant implements Identifiable, Searchable {

    private static int idCounter = 0;

    private final int id;
    private final String name;
    private final Cuisine cuisine;
    private final double rating;
    private final int deliveryTimeMin;
    private final String address;
    private final double latitude;
    private final double longitude;
    private final List<FoodItem> menu = new ArrayList<>();

    public Restaurant(String name, Cuisine cuisine, double rating, int deliveryTimeMin,
                      String address, double latitude, double longitude) {
        this.id = ++idCounter;
        this.name = name;
        this.cuisine = cuisine;
        this.rating = rating;
        this.deliveryTimeMin = deliveryTimeMin;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public void addItem(FoodItem item) {
        menu.add(item);
    }

    public List<FoodItem> getMenu() {
        return Collections.unmodifiableList(menu);
    }

    public Optional<FoodItem> findItemById(int itemId) {
        return menu.stream().filter(item -> item.getId() == itemId).findFirst();
    }

    @Override
    public boolean matches(String query) {
        String q = query.toLowerCase();
        if (name.toLowerCase().contains(q)) return true;
        if (cuisine.getDisplayName().toLowerCase().contains(q)) return true;
        for (FoodItem item : menu) {
            if (item.getName().toLowerCase().contains(q)) return true;
        }
        return false;
    }

    @Override
    public int getId() { return id; }
    public String getName() { return name; }
    public Cuisine getCuisine() { return cuisine; }
    public double getRating() { return rating; }
    public int getDeliveryTimeMin() { return deliveryTimeMin; }
    public String getAddress() { return address; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }

    @Override
    public String toString() {
        return "#" + id + " " + name + " (" + cuisine.getDisplayName() + ") "
                + rating + "* " + deliveryTimeMin + " min";
    }
}