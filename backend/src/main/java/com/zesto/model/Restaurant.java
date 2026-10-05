package com.zesto.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * OOP CONCEPTS:
 *   - Class, Encapsulation (all fields private, getters only)
 *   - Interface implementation (Identifiable, Searchable)
 *   - Constructor Overloading (short 7-arg vs full 10-arg)
 *   - Collections (ArrayList<FoodItem>)
 *   - Streams + Lambda (findItemById, isPureVeg, matches use stream().filter)
 *   - Composition (contains List of FoodItem objects)
 */
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
    private final int priceForTwo;
    private final int reviewCount;
    private final String badge;
    private String imageUrl;
    private final List<FoodItem> menu = new ArrayList<>();

    // Short constructor with defaults (constructor overloading)
    public Restaurant(String name, Cuisine cuisine, double rating, int deliveryTimeMin,
                      String address, double latitude, double longitude) {
        this(name, cuisine, rating, deliveryTimeMin, address, latitude, longitude, 400, 100, null);
    }

    public Restaurant(String name, Cuisine cuisine, double rating, int deliveryTimeMin,
                      String address, double latitude, double longitude,
                      int priceForTwo, int reviewCount, String badge) {
        this.id = ++idCounter;
        this.name = name;
        this.cuisine = cuisine;
        this.rating = rating;
        this.deliveryTimeMin = deliveryTimeMin;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.priceForTwo = priceForTwo;
        this.reviewCount = reviewCount;
        this.badge = badge;
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

    public boolean isPureVeg() {
        return !menu.isEmpty() && menu.stream().noneMatch(item -> item instanceof NonVegItem);
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
    public int getPriceForTwo() { return priceForTwo; }
    public int getReviewCount() { return reviewCount; }
    public String getBadge() { return badge; }
    public String getImageUrl() { return imageUrl; }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    @Override
    public String toString() {
        return "#" + id + " " + name + " (" + cuisine.getDisplayName() + ") "
                + rating + "* " + deliveryTimeMin + " min";
    }
}