package com.zesto.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Class & Encapsulation (private fields with controlled getters & validated mutators)
 *   - Interface Implementation (Identifiable, Searchable)
 *   - Constructor Overloading (short 7-arg vs full 10-arg)
 *   - Collections & Defensive Copying (Collections.unmodifiableList on menu)
 *   - Streams + Lambdas (findItemById, isPureVeg, matches, removeItemById)
 *   - Composition (holds polymorphic List<FoodItem> and BusinessType metadata)
 *   - Thread Safety (synchronized menu CRUD for concurrent customer reads & merchant edits)
 */
public class Restaurant implements Identifiable, Searchable {

    private static int idCounter = 0;

    private final int id;
    private String name;
    private Cuisine cuisine;
    private final double rating;
    private int deliveryTimeMin;
    private String address;
    private double latitude;
    private double longitude;
    private int priceForTwo;
    private final int reviewCount;
    private String badge;
    private String imageUrl;
    private Boolean pureVegOverride = null;

    // Local Small Business / Merchant Owner metadata
    private boolean localBusiness = false;
    private String ownerEmail = null;
    private BusinessType businessType = BusinessType.FAMILY_RESTAURANT;
    private boolean verified = true;
    private boolean openForOrders = true;
    private String fssaiLicense = "";
    private String areaKey = "FC_ROAD";

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

    public synchronized void addItem(FoodItem item) {
        menu.add(item);
    }

    public synchronized boolean removeItemById(int itemId) {
        return menu.removeIf(item -> item.getId() == itemId);
    }

    public synchronized List<FoodItem> getMenu() {
        return Collections.unmodifiableList(new ArrayList<>(menu));
    }

    public synchronized Optional<FoodItem> findItemById(int itemId) {
        return menu.stream().filter(item -> item.getId() == itemId).findFirst();
    }

    public synchronized boolean isPureVeg() {
        if (pureVegOverride != null) return pureVegOverride;
        return !menu.isEmpty() && menu.stream().noneMatch(item -> item instanceof NonVegItem);
    }

    public synchronized void setPureVeg(boolean pureVeg) {
        this.pureVegOverride = pureVeg;
    }

    public synchronized void configureAsLocalBusiness(
            String ownerEmail,
            BusinessType businessType,
            String areaKey,
            String fssaiLicense,
            boolean verified) {
        this.localBusiness = true;
        this.ownerEmail = ownerEmail != null ? ownerEmail.trim().toLowerCase() : null;
        this.businessType = businessType != null ? businessType : BusinessType.HOME_CHEF;
        this.areaKey = areaKey != null ? areaKey : "FC_ROAD";
        this.fssaiLicense = fssaiLicense != null ? fssaiLicense : "";
        this.verified = verified;
        if (this.badge == null || this.badge.trim().isEmpty()) {
            this.badge = this.businessType.getDefaultBadge();
        }
    }

    public synchronized void updateBusinessDetails(
            String name,
            Cuisine cuisine,
            BusinessType businessType,
            String areaKey,
            String address,
            double latitude,
            double longitude,
            int priceForTwo,
            int deliveryTimeMin,
            String badge,
            String imageUrl,
            boolean openForOrders) {
        if (name != null && !name.trim().isEmpty()) this.name = name.trim();
        if (cuisine != null) this.cuisine = cuisine;
        if (businessType != null) this.businessType = businessType;
        if (areaKey != null && !areaKey.trim().isEmpty()) this.areaKey = areaKey.trim();
        if (address != null && !address.trim().isEmpty()) this.address = address.trim();
        this.latitude = latitude;
        this.longitude = longitude;
        if (priceForTwo > 0) this.priceForTwo = priceForTwo;
        if (deliveryTimeMin > 0) this.deliveryTimeMin = deliveryTimeMin;
        if (badge != null && !badge.trim().isEmpty()) this.badge = badge.trim();
        if (imageUrl != null && !imageUrl.trim().isEmpty()) this.imageUrl = imageUrl.trim();
        this.openForOrders = openForOrders;
    }

    @Override
    public synchronized boolean matches(String query) {
        String q = query.toLowerCase();
        if (name.toLowerCase().contains(q)) return true;
        if (cuisine.getDisplayName().toLowerCase().contains(q)) return true;
        if (address != null && address.toLowerCase().contains(q)) return true;
        if (localBusiness && (q.contains("local") || q.contains("home") || businessType.getDisplayName().toLowerCase().contains(q))) {
            return true;
        }
        for (FoodItem item : menu) {
            if (item.getName().toLowerCase().contains(q)) return true;
        }
        return false;
    }

    @Override
    public int getId() { return id; }
    public synchronized String getName() { return name; }
    public synchronized Cuisine getCuisine() { return cuisine; }
    public double getRating() { return rating; }
    public synchronized int getDeliveryTimeMin() { return deliveryTimeMin; }
    public synchronized String getAddress() { return address; }
    public synchronized double getLatitude() { return latitude; }
    public synchronized double getLongitude() { return longitude; }
    public synchronized int getPriceForTwo() { return priceForTwo; }
    public int getReviewCount() { return reviewCount; }
    public synchronized String getBadge() { return badge; }
    public synchronized String getImageUrl() { return imageUrl; }
    public synchronized boolean isLocalBusiness() { return localBusiness; }
    public synchronized String getOwnerEmail() { return ownerEmail; }
    public synchronized BusinessType getBusinessType() { return businessType; }
    public synchronized boolean isVerified() { return verified; }
    public synchronized boolean isOpenForOrders() { return openForOrders; }
    public synchronized String getFssaiLicense() { return fssaiLicense; }
    public synchronized String getAreaKey() { return areaKey; }

    public synchronized void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public synchronized void setOpenForOrders(boolean openForOrders) {
        this.openForOrders = openForOrders;
    }

    @Override
    public String toString() {
        return "#" + id + " " + name + " (" + cuisine.getDisplayName() + ") "
                + rating + "* " + deliveryTimeMin + " min"
                + (localBusiness ? " [LOCAL PARTNER]" : "");
    }
}
