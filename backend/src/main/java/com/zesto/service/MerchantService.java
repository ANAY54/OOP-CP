package com.zesto.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import com.zesto.exception.MerchantVerificationException;
import com.zesto.model.Beverage;
import com.zesto.model.BusinessOwner;
import com.zesto.model.BusinessType;
import com.zesto.model.Cuisine;
import com.zesto.model.FoodItem;
import com.zesto.model.NonVegItem;
import com.zesto.model.PuneArea;
import com.zesto.model.Restaurant;
import com.zesto.model.VegItem;
import com.zesto.util.JsonParser;
import com.zesto.util.JsonWriter;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Composition (coordinates BusinessOwner, Restaurant, DataCatalogService & OrderService)
 *   - Polymorphism (creates VegItem, NonVegItem, Beverage through common FoodItem reference)
 *   - Thread Safety (ConcurrentHashMap + synchronized persistence)
 *   - Custom Checked Exception (throws MerchantVerificationException on invalid OTP / unverified owner)
 *   - File I/O Persistence (saves and restores merchants + custom menus to data/merchants.json)
 *   - Encapsulation (all OTP generation, license validation & ownership checks live in Java)
 */
public class MerchantService {

    private static final Path MERCHANTS_FILE = Path.of("data", "merchants.json");
    private static final String DEFAULT_KITCHEN_IMG =
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";
    private static final String DEFAULT_DISH_IMG =
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";

    private final DataCatalogService catalogService;
    private final Map<String, BusinessOwner> owners = new ConcurrentHashMap<>();
    private final Map<String, Restaurant> ownerRestaurants = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public MerchantService(DataCatalogService catalogService) {
        this.catalogService = catalogService;
        if (!loadFromDisk()) {
            seedShowcaseLocalKitchen();
        }
    }

    /** Seeds one verified Pune home kitchen so customers immediately see the Local Business spotlight. */
    private void seedShowcaseLocalKitchen() {
        BusinessOwner aai = new BusinessOwner("Sunita Kulkarni", "aai.kitchen@zesto.in");
        PuneArea area = PuneArea.SADASHIV_PETH;
        Restaurant r = new Restaurant(
                "Aai's Homemade Tiffin",
                Cuisine.NORTH_INDIAN,
                4.9,
                25,
                "Near Perugate, " + area.getLabel(),
                area.getLatitude() + 0.0018,
                area.getLongitude() - 0.0014,
                260,
                148,
                "Home Chef");
        r.setImageUrl("https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80");
        r.setPureVeg(true);
        r.configureAsLocalBusiness(aai.getEmail(), BusinessType.HOME_CHEF, area.name(), "FSSAI-MH-2026-1042", true);
        r.addItem(new VegItem(
                "Ghee Puran Poli (2 pcs)",
                130,
                Cuisine.NORTH_INDIAN,
                false,
                "Authentic Maharashtrian sweet flatbread stuffed with chana dal & jaggery, brushed with homemade ghee",
                "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80"));
        r.addItem(new VegItem(
                "Gharghuti Poli Bhaji Thali",
                160,
                Cuisine.NORTH_INDIAN,
                false,
                "3 phulkas, seasonal dry bhaji, varan-bhaat, koshimbir & roasted papad",
                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80"));
        r.addItem(new Beverage(
                "Homemade Kokum Solkadhi",
                65,
                250,
                true,
                "Chilled Konkani coconut milk & kokum digestive cooler",
                "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80"));

        aai.markVerifiedFromDisk("9822011223", "FSSAI-MH-2026-1042", r.getId());
        owners.put(aai.getEmail(), aai);
        ownerRestaurants.put(aai.getEmail(), r);
        catalogService.registerLocalBusiness(r);
        saveToDisk();
    }

    // ------------------------------------------------------------------ Auth & Verification
    public BusinessOwner loginOrRegister(String name, String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Valid email is required");
        }
        String key = email.trim().toLowerCase();
        String safeName = (name == null || name.trim().isEmpty()) ? key.split("@")[0] : name.trim();
        BusinessOwner owner = owners.computeIfAbsent(key, k -> new BusinessOwner(safeName, key));
        if (!safeName.isEmpty()) {
            owner.setName(safeName);
        }
        return owner;
    }

    public BusinessOwner getOwnerByEmail(String email) throws MerchantVerificationException {
        if (email == null || email.trim().isEmpty()) {
            throw new MerchantVerificationException("Merchant email is required");
        }
        BusinessOwner owner = owners.get(email.trim().toLowerCase());
        if (owner == null) {
            throw new MerchantVerificationException(email, "no business owner account found. Please sign in first.");
        }
        return owner;
    }

    public Optional<Restaurant> getRestaurantForOwner(String email) {
        if (email == null) return Optional.empty();
        return Optional.ofNullable(ownerRestaurants.get(email.trim().toLowerCase()));
    }

    /**
     * Step 1 of merchant verification: validates phone & kitchen details and issues a 6-digit OTP.
     */
    public String requestVerificationOtp(String email, String phone, String businessName, String fssaiLicense)
            throws MerchantVerificationException {
        BusinessOwner owner = getOwnerByEmail(email);

        if (businessName == null || businessName.trim().length() < 2) {
            throw new MerchantVerificationException("Business name must be at least 2 characters");
        }
        String digitsOnly = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        if (digitsOnly.length() < 10) {
            throw new MerchantVerificationException("Please enter a valid 10-digit mobile number for verification");
        }

        String license = (fssaiLicense == null || fssaiLicense.trim().isEmpty())
                ? "FSSAI-MH-LOCAL-" + (1000 + secureRandom.nextInt(9000))
                : fssaiLicense.trim().toUpperCase();

        String otp = String.format("%06d", 100000 + secureRandom.nextInt(900000));
        owner.issueOtp(otp, digitsOnly, license);
        return otp;
    }

    /**
     * Step 2 of merchant verification: validates OTP, marks BusinessOwner verified,
     * registers their Restaurant live in DataCatalogService, and persists to disk.
     */
    public Restaurant confirmVerificationAndCreateBusiness(
            String email,
            String otp,
            String businessName,
            String businessTypeKey,
            String cuisineKey,
            String areaKey,
            String streetAddress,
            int priceForTwo,
            int deliveryTimeMin,
            String fssaiLicense,
            String phone,
            String imageUrl,
            boolean pureVeg) throws MerchantVerificationException {

        BusinessOwner owner = getOwnerByEmail(email);

        if (!owner.isVerified()) {
            if (!owner.verifyOtp(otp)) {
                throw new MerchantVerificationException(email, "invalid or expired 6-digit verification code");
            }
        }

        if (businessName == null || businessName.trim().length() < 2) {
            throw new MerchantVerificationException("Business name is required");
        }

        BusinessType type = BusinessType.fromKey(businessTypeKey);
        Cuisine cuisine = parseCuisine(cuisineKey);
        PuneArea area = PuneArea.fromKey(areaKey);

        String fullAddress = (streetAddress == null || streetAddress.trim().isEmpty())
                ? area.getLabel()
                : streetAddress.trim() + ", " + area.getLabel();

        // Slight deterministic offset based on owner email hash so multiple shops in the same area don't overlap pins
        int hash = Math.abs(owner.getEmail().hashCode());
        double latOffset = ((hash % 17) - 8) * 0.00045;
        double lonOffset = (((hash / 17) % 17) - 8) * 0.00045;
        double lat = area.getLatitude() + latOffset;
        double lon = area.getLongitude() + lonOffset;

        int safePrice = priceForTwo > 0 ? priceForTwo : 300;
        int safeEta = deliveryTimeMin > 0 ? deliveryTimeMin : 25;
        String safeImg = (imageUrl == null || imageUrl.trim().isEmpty()) ? DEFAULT_KITCHEN_IMG : imageUrl.trim();
        String license = (fssaiLicense != null && !fssaiLicense.trim().isEmpty())
                ? fssaiLicense.trim().toUpperCase()
                : owner.getFssaiLicense();
        if (phone != null && !phone.trim().isEmpty()) {
            owner.setPhone(phone);
        }
        owner.setFssaiLicense(license);

        Restaurant existing = ownerRestaurants.get(owner.getEmail());
        if (existing != null) {
            existing.updateBusinessDetails(
                    businessName, cuisine, type, area.name(), fullAddress,
                    lat, lon, safePrice, safeEta, type.getDefaultBadge(), safeImg, true);
            existing.setPureVeg(pureVeg);
            catalogService.registerLocalBusiness(existing);
            saveToDisk();
            return existing;
        }

        Restaurant created = new Restaurant(
                businessName.trim(),
                cuisine,
                4.8, // Fresh verified partner launch rating
                safeEta,
                fullAddress,
                lat,
                lon,
                safePrice,
                1,
                type.getDefaultBadge());
        created.setImageUrl(safeImg);
        if (pureVeg) {
            created.setPureVeg(true);
        }
        created.configureAsLocalBusiness(owner.getEmail(), type, area.name(), license, true);

        owner.setRestaurantId(created.getId());
        ownerRestaurants.put(owner.getEmail(), created);
        catalogService.registerLocalBusiness(created);
        saveToDisk();
        return created;
    }

    // ------------------------------------------------------------------ Business Profile & Menu CRUD
    public Restaurant updateBusiness(
            String email,
            String businessName,
            String businessTypeKey,
            String cuisineKey,
            String areaKey,
            String address,
            int priceForTwo,
            int deliveryTimeMin,
            String badge,
            String imageUrl,
            boolean openForOrders) throws MerchantVerificationException {

        BusinessOwner owner = requireVerifiedOwner(email);
        Restaurant r = requireOwnedRestaurant(owner);

        BusinessType type = BusinessType.fromKey(businessTypeKey);
        Cuisine cuisine = parseCuisine(cuisineKey);
        PuneArea area = PuneArea.fromKey(areaKey);

        int hash = Math.abs(owner.getEmail().hashCode());
        double lat = area.getLatitude() + ((hash % 17) - 8) * 0.00045;
        double lon = area.getLongitude() + (((hash / 17) % 17) - 8) * 0.00045;

        r.updateBusinessDetails(
                businessName, cuisine, type, area.name(), address,
                lat, lon, priceForTwo, deliveryTimeMin, badge, imageUrl, openForOrders);
        catalogService.registerLocalBusiness(r);
        saveToDisk();
        return r;
    }

    /**
     * Polymorphically creates VegItem, NonVegItem, or Beverage and adds it to the owner's live menu.
     */
    public FoodItem addMenuItem(
            String email,
            String name,
            double price,
            String categoryKey,
            String description,
            boolean jain,
            int spiceLevel,
            int sizeMl,
            boolean cold,
            String imageUrl) throws MerchantVerificationException {

        BusinessOwner owner = requireVerifiedOwner(email);
        Restaurant restaurant = requireOwnedRestaurant(owner);

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Dish name cannot be empty");
        }
        if (price <= 0 || price > 25000) {
            throw new IllegalArgumentException("Price must be between Rs.1 and Rs.25,000");
        }

        String desc = (description == null || description.trim().isEmpty())
                ? "Freshly prepared homemade specialty from " + restaurant.getName()
                : description.trim();
        String img = (imageUrl == null || imageUrl.trim().isEmpty()) ? DEFAULT_DISH_IMG : imageUrl.trim();
        String cat = categoryKey == null ? "VEG" : categoryKey.trim().toUpperCase();

        FoodItem created;
        if ("NON_VEG".equals(cat) || "NON-VEG".equals(cat)) {
            int safeSpice = Math.max(1, Math.min(3, spiceLevel <= 0 ? 2 : spiceLevel));
            created = new NonVegItem(name.trim(), price, restaurant.getCuisine(), safeSpice, desc, img);
            // If restaurant had pureVeg override, update it since a non-veg dish was added
            restaurant.setPureVeg(false);
        } else if ("BEVERAGE".equals(cat) || "DRINK".equals(cat)) {
            int safeSize = sizeMl > 0 ? sizeMl : 300;
            created = new Beverage(name.trim(), price, safeSize, cold, desc, img);
        } else {
            boolean isJain = jain || "JAIN".equals(cat);
            created = new VegItem(name.trim(), price, restaurant.getCuisine(), isJain, desc, img);
        }

        restaurant.addItem(created);
        catalogService.registerLocalBusiness(restaurant);
        saveToDisk();
        return created;
    }

    public boolean deleteMenuItem(String email, int itemId) throws MerchantVerificationException {
        BusinessOwner owner = requireVerifiedOwner(email);
        Restaurant restaurant = requireOwnedRestaurant(owner);

        boolean removed = restaurant.removeItemById(itemId);
        if (!removed) {
            throw new IllegalArgumentException("Menu item #" + itemId + " not found in your kitchen");
        }
        catalogService.registerLocalBusiness(restaurant);
        saveToDisk();
        return true;
    }

    // ------------------------------------------------------------------ Helpers
    private BusinessOwner requireVerifiedOwner(String email) throws MerchantVerificationException {
        BusinessOwner owner = getOwnerByEmail(email);
        if (!owner.isVerified()) {
            throw new MerchantVerificationException(email, "business is not verified yet");
        }
        return owner;
    }

    private Restaurant requireOwnedRestaurant(BusinessOwner owner) throws MerchantVerificationException {
        Restaurant r = ownerRestaurants.get(owner.getEmail());
        if (r == null) {
            throw new MerchantVerificationException(owner.getEmail(), "no business profile registered yet");
        }
        return r;
    }

    private static Cuisine parseCuisine(String key) {
        if (key == null || key.trim().isEmpty()) return Cuisine.NORTH_INDIAN;
        String normalized = key.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        for (Cuisine c : Cuisine.values()) {
            if (c.name().equalsIgnoreCase(normalized) || c.getDisplayName().equalsIgnoreCase(key.trim())) {
                return c;
            }
        }
        return Cuisine.MULTI_CUISINE;
    }

    // ------------------------------------------------------------------ Persistence (File I/O)
    private synchronized boolean loadFromDisk() {
        try {
            if (!Files.exists(MERCHANTS_FILE)) {
                return false;
            }
            String json = Files.readString(MERCHANTS_FILE);
            Object root = JsonParser.parse(json);
            if (!(root instanceof List)) {
                return false;
            }

            int loadedCount = 0;
            for (Object entry : (List<?>) root) {
                if (!(entry instanceof Map)) continue;
                Map<?, ?> m = (Map<?, ?>) entry;

                String ownerName = (String) m.get("ownerName");
                String ownerEmail = (String) m.get("ownerEmail");
                if (ownerEmail == null || ownerEmail.trim().isEmpty()) continue;

                String phone = (String) m.get("phone");
                String fssai = (String) m.get("fssaiLicense");
                BusinessOwner owner = new BusinessOwner(
                        ownerName != null && !ownerName.isEmpty() ? ownerName : "Partner",
                        ownerEmail);

                Object restObj = m.get("restaurant");
                if (restObj instanceof Map) {
                    Map<?, ?> rm = (Map<?, ?>) restObj;
                    String rName = (String) rm.get("name");
                    Cuisine cuisine = parseCuisine((String) rm.get("cuisineKey"));
                    BusinessType bType = BusinessType.fromKey((String) rm.get("businessType"));
                    String areaKey = (String) rm.get("areaKey");
                    double rating = rm.get("rating") instanceof Number ? ((Number) rm.get("rating")).doubleValue() : 4.8;
                    int eta = rm.get("deliveryTimeMin") instanceof Number ? ((Number) rm.get("deliveryTimeMin")).intValue() : 25;
                    String address = (String) rm.get("address");
                    double lat = rm.get("latitude") instanceof Number ? ((Number) rm.get("latitude")).doubleValue() : PuneArea.FC_ROAD.getLatitude();
                    double lon = rm.get("longitude") instanceof Number ? ((Number) rm.get("longitude")).doubleValue() : PuneArea.FC_ROAD.getLongitude();
                    int priceForTwo = rm.get("priceForTwo") instanceof Number ? ((Number) rm.get("priceForTwo")).intValue() : 300;
                    int reviewCount = rm.get("reviewCount") instanceof Number ? ((Number) rm.get("reviewCount")).intValue() : 1;
                    String badge = (String) rm.get("badge");
                    String imageUrl = (String) rm.get("imageUrl");
                    boolean openForOrders = !Boolean.FALSE.equals(rm.get("openForOrders"));

                    Restaurant r = new Restaurant(rName, cuisine, rating, eta, address, lat, lon, priceForTwo, reviewCount, badge);
                    r.setImageUrl(imageUrl != null ? imageUrl : DEFAULT_KITCHEN_IMG);
                    r.configureAsLocalBusiness(owner.getEmail(), bType, areaKey, fssai, true);
                    r.setOpenForOrders(openForOrders);

                    Object menuObj = rm.get("menu");
                    if (menuObj instanceof List) {
                        for (Object itemObj : (List<?>) menuObj) {
                            if (!(itemObj instanceof Map)) continue;
                            Map<?, ?> im = (Map<?, ?>) itemObj;
                            String itemName = (String) im.get("name");
                            double itemPrice = im.get("price") instanceof Number ? ((Number) im.get("price")).doubleValue() : 100.0;
                            boolean veg = !Boolean.FALSE.equals(im.get("veg"));
                            String cat = (String) im.get("category");
                            String desc = (String) im.get("description");
                            String img = (String) im.get("imageUrl");

                            if ("BEVERAGE".equalsIgnoreCase(cat)) {
                                r.addItem(new Beverage(itemName, itemPrice, 300, true, desc, img));
                            } else if (veg) {
                                r.addItem(new VegItem(itemName, itemPrice, cuisine, false, desc, img));
                            } else {
                                r.addItem(new NonVegItem(itemName, itemPrice, cuisine, 2, desc, img));
                            }
                        }
                    }

                    owner.markVerifiedFromDisk(phone, fssai, r.getId());
                    ownerRestaurants.put(owner.getEmail(), r);
                    catalogService.registerLocalBusiness(r);
                }

                owners.put(owner.getEmail(), owner);
                loadedCount++;
            }

            if (loadedCount > 0) {
                System.out.println("[MerchantService] Loaded " + loadedCount + " verified local business partner(s) from " + MERCHANTS_FILE);
                return true;
            }
        } catch (Exception e) {
            System.err.println("[MerchantService] Could not read " + MERCHANTS_FILE + ": " + e.getMessage());
        }
        return false;
    }

    private synchronized void saveToDisk() {
        try {
            if (MERCHANTS_FILE.getParent() != null) {
                Files.createDirectories(MERCHANTS_FILE.getParent());
            }
            List<Object> out = new ArrayList<>();
            for (BusinessOwner owner : owners.values()) {
                Map<String, Object> record = new LinkedHashMap<>();
                record.put("ownerName", owner.getName());
                record.put("ownerEmail", owner.getEmail());
                record.put("phone", owner.getPhone());
                record.put("fssaiLicense", owner.getFssaiLicense());
                record.put("verified", owner.isVerified());

                Restaurant r = ownerRestaurants.get(owner.getEmail());
                if (r != null) {
                    Map<String, Object> rm = new LinkedHashMap<>();
                    rm.put("name", r.getName());
                    rm.put("cuisineKey", r.getCuisine().name());
                    rm.put("businessType", r.getBusinessType().name());
                    rm.put("areaKey", r.getAreaKey());
                    rm.put("rating", r.getRating());
                    rm.put("deliveryTimeMin", r.getDeliveryTimeMin());
                    rm.put("address", r.getAddress());
                    rm.put("latitude", r.getLatitude());
                    rm.put("longitude", r.getLongitude());
                    rm.put("priceForTwo", r.getPriceForTwo());
                    rm.put("reviewCount", r.getReviewCount());
                    rm.put("badge", r.getBadge());
                    rm.put("imageUrl", r.getImageUrl());
                    rm.put("openForOrders", r.isOpenForOrders());

                    List<Object> menuList = new ArrayList<>();
                    for (FoodItem item : r.getMenu()) {
                        Map<String, Object> im = new LinkedHashMap<>();
                        im.put("name", item.getName());
                        im.put("price", item.calculatePrice());
                        im.put("veg", !(item instanceof NonVegItem));
                        im.put("category", item.getCategory());
                        im.put("description", item.getDescription());
                        im.put("imageUrl", item.getImageUrl());
                        menuList.add(im);
                    }
                    rm.put("menu", menuList);
                    record.put("restaurant", rm);
                }
                out.add(record);
            }
            Files.writeString(MERCHANTS_FILE, JsonWriter.toJson(out));
        } catch (Exception e) {
            System.err.println("[MerchantService] Failed saving merchants to disk: " + e.getMessage());
        }
    }
}
