package com.zesto.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.zesto.exception.ExternalApiException;
import com.zesto.model.Cuisine;
import com.zesto.model.Restaurant;
import com.zesto.util.JsonParser;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Interface Implementation (RestaurantProvider)
 *   - Resilient Networking (java.net.http.HttpClient with User-Agent, timeouts & mirror failover)
 *   - Strategy Pattern Implementation (replaces sample data with real geographic OSM nodes)
 *   - Custom Exception Handling (wraps low-level I/O in ExternalApiException)
 *   - Mandatory OpenStreetMap Attribution: "© OpenStreetMap contributors"
 */
public class OverpassRestaurantProvider implements RestaurantProvider {

    private static final String PRIMARY_URL = "https://overpass-api.de/api/interpreter";
    private static final String MIRROR_URL = "https://overpass.kumi.systems/api/interpreter";
    private static final String USER_AGENT = "ZestoCollegeProject/1.0 (Java OOP Course Viva; anaypalimkar@gmail.com)";

    private final HttpClient httpClient;
    private final PricingPolicy pricingPolicy;

    public OverpassRestaurantProvider(PricingPolicy pricingPolicy) {
        this.pricingPolicy = pricingPolicy;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @Override
    public String getProviderName() {
        return "OpenStreetMapOverpassProvider (© OpenStreetMap contributors)";
    }

    @Override
    public List<Restaurant> fetchRestaurants() throws ExternalApiException {
        String query = "[out:json][timeout:12];"
                + "(node[\"amenity\"~\"restaurant|cafe|fast_food\"][\"name\"](18.42,73.74,18.62,73.96););"
                + "out body 35;";

        try {
            return executeOverpassQuery(PRIMARY_URL, query);
        } catch (Exception primaryEx) {
            System.err.println("[OverpassProvider] Primary endpoint failed (" + primaryEx.getMessage() + "). Retrying mirror...");
            try {
                return executeOverpassQuery(MIRROR_URL, query);
            } catch (Exception mirrorEx) {
                throw new ExternalApiException("OpenStreetMap Overpass",
                        "Failed to query Pune OSM nodes: " + mirrorEx.getMessage(), mirrorEx);
            }
        }
    }

    private List<Restaurant> executeOverpassQuery(String endpoint, String overpassQuery) throws Exception {
        String formBody = "data=" + URLEncoder.encode(overpassQuery, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(12))
                .header("User-Agent", USER_AGENT)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(formBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new ExternalApiException("Overpass", "HTTP status " + response.statusCode());
        }

        Map<String, Object> root = JsonParser.parseObject(response.body());
        Object elementsObj = root.get("elements");
        if (!(elementsObj instanceof List)) {
            throw new ExternalApiException("Overpass", "Invalid Overpass JSON response: 'elements' missing");
        }

        List<Restaurant> result = new ArrayList<>();
        List<?> elements = (List<?>) elementsObj;

        for (Object el : elements) {
            if (!(el instanceof Map)) continue;
            Map<?, ?> node = (Map<?, ?>) el;

            long osmId = node.get("id") instanceof Number ? ((Number) node.get("id")).longValue() : 0L;
            double lat = node.get("lat") instanceof Number ? ((Number) node.get("lat")).doubleValue() : 18.5204;
            double lon = node.get("lon") instanceof Number ? ((Number) node.get("lon")).doubleValue() : 73.8567;

            Object tagsObj = node.get("tags");
            if (!(tagsObj instanceof Map)) continue;
            Map<?, ?> tags = (Map<?, ?>) tagsObj;

            String name = String.valueOf(tags.get("name"));
            if (name == null || name.trim().isEmpty() || "null".equals(name)) continue;

            String osmCuisine = tags.get("cuisine") instanceof String ? (String) tags.get("cuisine") : "";
            Cuisine cuisine = mapOsmCuisine(osmCuisine, name);

            String street = tags.get("addr:street") instanceof String ? (String) tags.get("addr:street") : "";
            String suburb = tags.get("addr:suburb") instanceof String ? (String) tags.get("addr:suburb") : "";
            String address = formatAddress(street, suburb);

            double rating = pricingPolicy.generateRating(osmId);
            int reviewCount = pricingPolicy.generateReviewCount(osmId);
            int priceForTwo = pricingPolicy.generatePriceForTwo(osmId, cuisine);
            String badge = pricingPolicy.generateBadge(osmId);
            int deliveryTime = pricingPolicy.calculateDeliveryTime(3.5);

            Restaurant restaurant = new Restaurant(
                    name.trim(),
                    cuisine,
                    rating,
                    deliveryTime,
                    address,
                    lat,
                    lon,
                    priceForTwo,
                    reviewCount,
                    badge
            );

            result.add(restaurant);
            if (result.size() >= 35) break;
        }

        if (result.isEmpty()) {
            throw new ExternalApiException("Overpass", "No named restaurants matched Pune query bounding box");
        }

        return result;
    }

    private Cuisine mapOsmCuisine(String osmCuisine, String name) {
        String c = (osmCuisine + " " + name).toLowerCase();
        if (c.contains("south indian") || c.contains("dosa") || c.contains("udupi")) return Cuisine.SOUTH_INDIAN;
        if (c.contains("north indian") || c.contains("punjabi") || c.contains("biryani") || c.contains("mughlai")) return Cuisine.NORTH_INDIAN;
        if (c.contains("chinese") || c.contains("asian") || c.contains("noodle") || c.contains("wok")) return Cuisine.CHINESE;
        if (c.contains("pizza") || c.contains("italian") || c.contains("pasta")) return Cuisine.ITALIAN;
        if (c.contains("burger") || c.contains("fast food") || c.contains("sandwich") || c.contains("fries")) return Cuisine.FAST_FOOD;
        if (c.contains("dessert") || c.contains("ice cream") || c.contains("cake") || c.contains("sweet")) return Cuisine.DESSERTS;
        if (c.contains("coffee") || c.contains("cafe") || c.contains("tea") || c.contains("juice") || c.contains("beverage")) return Cuisine.BEVERAGES;
        return Cuisine.MULTI_CUISINE;
    }

    private String formatAddress(String street, String suburb) {
        if (!street.isEmpty() && !suburb.isEmpty()) return street + ", " + suburb + ", Pune";
        if (!suburb.isEmpty()) return suburb + ", Pune";
        if (!street.isEmpty()) return street + ", Pune";
        return "Pune, Maharashtra";
    }
}
