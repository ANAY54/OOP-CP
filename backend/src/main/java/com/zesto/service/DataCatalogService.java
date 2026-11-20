package com.zesto.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicReference;
import com.zesto.exception.ExternalApiException;
import com.zesto.model.Beverage;
import com.zesto.model.Cuisine;
import com.zesto.model.FoodItem;
import com.zesto.model.NonVegItem;
import com.zesto.model.Restaurant;
import com.zesto.model.VegItem;
import com.zesto.util.JsonParser;
import com.zesto.util.JsonWriter;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Strategy Pattern Coordinator (swaps concrete RestaurantProvider & MenuProvider implementations)
 *   - Thread Safety & Atomic Swapping (AtomicReference<List<Restaurant>> enables lock-free atomic catalog update)
 *   - Asynchronous Execution (CompletableFuture background thread for non-blocking server startup)
 *   - File I/O Persistence (caches catalog to backend/data/catalog.json with 24-hour expiration check)
 *   - Polymorphism (manages Restaurant and FoodItem hierarchies seamlessly)
 */
public class DataCatalogService {

    private static final Path CACHE_FILE = Path.of("data", "catalog.json");
    private static final long CACHE_MAX_AGE_MS = 24L * 60L * 60L * 1000L; // 24 hours

    private final AtomicReference<List<Restaurant>> activeCatalog = new AtomicReference<>(new ArrayList<>());
    private final List<Restaurant> localBusinesses = new java.util.concurrent.CopyOnWriteArrayList<>();
    private final RestaurantProvider sampleProvider;
    private final RestaurantProvider liveOsmProvider;
    private final MealDbMenuProvider mealDbMenuProvider;

    public DataCatalogService() {
        this(new PricingPolicy());
    }

    public DataCatalogService(PricingPolicy pricingPolicy) {
        this.sampleProvider = new SampleRestaurantProvider();
        this.liveOsmProvider = new OverpassRestaurantProvider(pricingPolicy);
        this.mealDbMenuProvider = new MealDbMenuProvider(pricingPolicy);

        // 1. Immediately load guaranteed offline fallback or disk cache
        if (!loadFromDiskCache()) {
            System.out.println("[DataCatalogService] Loading guaranteed sample catalog fallback...");
            List<Restaurant> initial = sampleProvider.fetchRestaurants();
            activeCatalog.set(initial);
            saveToDiskCache(initial);
        }

        // 2. Start asynchronous warm-up in a daemon thread so the server opens ports instantly
        CompletableFuture.runAsync(this::refreshCatalogInBackground);
    }

    public synchronized void registerLocalBusiness(Restaurant restaurant) {
        if (restaurant == null) return;
        localBusinesses.removeIf(r -> r.getId() == restaurant.getId()
                || (r.getOwnerEmail() != null && r.getOwnerEmail().equalsIgnoreCase(restaurant.getOwnerEmail())));
        localBusinesses.add(0, restaurant);
    }

    public List<Restaurant> getLocalBusinesses() {
        return new ArrayList<>(localBusinesses);
    }

    public List<Restaurant> getRestaurants() {
        List<Restaurant> merged = new ArrayList<>(localBusinesses.size() + activeCatalog.get().size());
        merged.addAll(localBusinesses);
        merged.addAll(activeCatalog.get());
        return merged;
    }

    public Optional<Restaurant> findRestaurantById(int id) {
        return getRestaurants().stream()
                .filter(r -> r.getId() == id)
                .findFirst();
    }

    public Optional<FoodItem> findDishById(int dishId) {
        for (Restaurant r : getRestaurants()) {
            for (FoodItem item : r.getMenu()) {
                if (item.getId() == dishId) {
                    return Optional.of(item);
                }
            }
        }
        return Optional.empty();
    }

    public Map<String, Object> getDishRecipe(int dishId) {
        return mealDbMenuProvider.getRecipe(dishId);
    }

    private void refreshCatalogInBackground() {
        try {
            mealDbMenuProvider.warmCache();

            File file = CACHE_FILE.toFile();
            if (file.exists() && (System.currentTimeMillis() - file.lastModified() < CACHE_MAX_AGE_MS)) {
                System.out.println("[DataCatalogService] Cache in " + CACHE_FILE + " is fresh (<24h). Skipping network fetch.");
                return;
            }

            System.out.println("[DataCatalogService] Querying live OpenStreetMap Overpass for Pune restaurants...");
            List<Restaurant> freshOsmRestaurants = liveOsmProvider.fetchRestaurants();

            if (!freshOsmRestaurants.isEmpty()) {
                // Populate menus from TheMealDB provider
                for (Restaurant r : freshOsmRestaurants) {
                    List<FoodItem> menu = mealDbMenuProvider.fetchMenuFor(r);
                    for (FoodItem item : menu) {
                        r.addItem(item);
                    }
                }

                // Combine iconic Pune restaurants with fresh OSM restaurants (avoiding duplicates)
                List<Restaurant> combined = new ArrayList<>(sampleProvider.fetchRestaurants());
                java.util.Set<String> existingNames = combined.stream()
                        .map(r -> r.getName().toLowerCase().trim())
                        .collect(java.util.stream.Collectors.toSet());
                for (Restaurant r : freshOsmRestaurants) {
                    if (existingNames.add(r.getName().toLowerCase().trim())) {
                        combined.add(r);
                    }
                }

                // Atomic Swap! (Thread safe, zero lock contention)
                activeCatalog.set(combined);
                saveToDiskCache(combined);
                System.out.println("[DataCatalogService] Successfully updated catalog with "
                        + combined.size() + " Pune restaurants (Iconic + OSM)!");
            }
        } catch (ExternalApiException e) {
            System.err.println("[DataCatalogService] Offline mode active: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("[DataCatalogService] Background refresh encountered: " + e.getMessage());
        }
    }

    private synchronized boolean loadFromDiskCache() {
        try {
            if (!Files.exists(CACHE_FILE)) {
                return false;
            }
            String json = Files.readString(CACHE_FILE);
            Object root = JsonParser.parse(json);
            if (!(root instanceof List)) {
                return false;
            }

            List<Restaurant> list = new ArrayList<>();
            for (Object obj : (List<?>) root) {
                if (!(obj instanceof Map)) continue;
                Map<?, ?> map = (Map<?, ?>) obj;

                String name = (String) map.get("name");
                String cuisineKey = (String) map.get("cuisineKey");
                Cuisine cuisine = Cuisine.valueOf(cuisineKey != null ? cuisineKey : "NORTH_INDIAN");
                double rating = ((Number) map.get("rating")).doubleValue();
                int deliveryTime = ((Number) map.get("deliveryTimeMin")).intValue();
                String address = (String) map.get("address");
                double lat = ((Number) map.get("latitude")).doubleValue();
                double lon = ((Number) map.get("longitude")).doubleValue();
                int priceForTwo = ((Number) map.get("priceForTwo")).intValue();
                int reviewCount = ((Number) map.get("reviewCount")).intValue();
                String badge = (String) map.get("badge");

                Restaurant r = new Restaurant(name, cuisine, rating, deliveryTime, address, lat, lon, priceForTwo, reviewCount, badge);
                r.setImageUrl((String) map.get("imageUrl"));

                Object menuObj = map.get("menu");
                if (menuObj instanceof List) {
                    for (Object mItem : (List<?>) menuObj) {
                        if (!(mItem instanceof Map)) continue;
                        Map<?, ?> itemMap = (Map<?, ?>) mItem;
                        String itemName = (String) itemMap.get("name");
                        double price = ((Number) itemMap.get("price")).doubleValue();
                        boolean veg = Boolean.TRUE.equals(itemMap.get("veg"));
                        String cat = (String) itemMap.get("category");
                        String desc = (String) itemMap.get("description");
                        String img = (String) itemMap.get("imageUrl");

                        if ("BEVERAGE".equalsIgnoreCase(cat)) {
                            r.addItem(new Beverage(itemName, price, 300, true, desc, img));
                        } else if (veg) {
                            r.addItem(new VegItem(itemName, price, cuisine, false, desc, img));
                        } else {
                            r.addItem(new NonVegItem(itemName, price, cuisine, 2, desc, img));
                        }
                    }
                }
                list.add(r);
            }

            if (!list.isEmpty()) {
                activeCatalog.set(list);
                System.out.println("[DataCatalogService] Loaded " + list.size() + " restaurants from " + CACHE_FILE);
                return true;
            }
        } catch (Exception e) {
            System.err.println("[DataCatalogService] Failed reading disk cache: " + e.getMessage());
        }
        return false;
    }

    private synchronized void saveToDiskCache(List<Restaurant> list) {
        try {
            Files.createDirectories(CACHE_FILE.getParent());
            List<Object> out = new ArrayList<>();
            for (Restaurant r : list) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", r.getName());
                m.put("cuisineKey", r.getCuisine().name());
                m.put("rating", r.getRating());
                m.put("deliveryTimeMin", r.getDeliveryTimeMin());
                m.put("address", r.getAddress());
                m.put("latitude", r.getLatitude());
                m.put("longitude", r.getLongitude());
                m.put("priceForTwo", r.getPriceForTwo());
                m.put("reviewCount", r.getReviewCount());
                m.put("badge", r.getBadge());
                m.put("imageUrl", r.getImageUrl());

                List<Object> menu = new ArrayList<>();
                for (FoodItem item : r.getMenu()) {
                    Map<String, Object> line = new LinkedHashMap<>();
                    line.put("name", item.getName());
                    line.put("price", item.getBasePrice());
                    line.put("veg", !(item instanceof NonVegItem));
                    line.put("category", item.getCategory());
                    line.put("description", item.getDescription());
                    line.put("imageUrl", item.getImageUrl());
                    menu.add(line);
                }
                m.put("menu", menu);
                out.add(m);
            }

            Files.writeString(CACHE_FILE, JsonWriter.toJson(out));
            System.out.println("[DataCatalogService] Saved catalog cache to " + CACHE_FILE);
        } catch (IOException e) {
            System.err.println("[DataCatalogService] Warning: Could not write cache file: " + e.getMessage());
        }
    }
}
