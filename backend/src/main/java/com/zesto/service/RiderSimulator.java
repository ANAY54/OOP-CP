package com.zesto.service;

import com.zesto.model.DeliveryPartner;
import com.zesto.model.Order;
import com.zesto.model.OrderStatus;
import com.zesto.model.Restaurant;
import com.zesto.util.DistanceCalculator;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Encapsulation (Interpolation physics & navigation state concealed)
 *   - Mathematical Modeling (Linear geospatial interpolation)
 *   - Defensive Programming (graceful fallbacks for missing delivery partners or invalid coordinates)
 *   - Separation of Concerns
 *
 * Interpolates real-time delivery rider coordinates between restaurant and customer drop-off.
 */
public class RiderSimulator {

    // Default Pune Customer Reference Location (Koregaon Park / Pune Camp)
    public static final double DEFAULT_CUSTOMER_LAT = 18.5362;
    public static final double DEFAULT_CUSTOMER_LON = 73.8940;

    public Map<String, Object> simulateRiderPosition(Order order, double customerLat, double customerLon) {
        Restaurant restaurant = order.getRestaurant();
        double startLat = restaurant.getLatitude();
        double startLon = restaurant.getLongitude();

        double destLat = (customerLat != 0.0) ? customerLat : DEFAULT_CUSTOMER_LAT;
        double destLon = (customerLon != 0.0) ? customerLon : DEFAULT_CUSTOMER_LON;

        OrderStatus status = order.getStatus();
        double ratio;
        String statusNote;

        switch (status) {
            case PLACED -> {
                ratio = 0.0;
                statusNote = "Partner assigned, heading to " + restaurant.getName();
            }
            case PREPARING -> {
                ratio = 0.05;
                statusNote = "Partner waiting at restaurant for your hot food";
            }
            case OUT_FOR_DELIVERY -> {
                // Dynamically simulate smooth progress based on system timestamp
                long timeSec = (System.currentTimeMillis() / 1000L) % 120L; // 2 min cycle
                ratio = 0.15 + (0.75 * (timeSec / 120.0));
                statusNote = "Partner is en route with your delivery";
            }
            case DELIVERED -> {
                ratio = 1.0;
                statusNote = "Delivered safely at your doorstep!";
            }
            case CANCELLED -> {
                ratio = 0.0;
                statusNote = "Order was cancelled";
            }
            default -> {
                ratio = 0.0;
                statusNote = "Tracking order progress...";
            }
        }

        double currentLat = startLat + (ratio * (destLat - startLat));
        double currentLon = startLon + (ratio * (destLon - startLon));
        double remainingKm = DistanceCalculator.distance(currentLat, currentLon, destLat, destLon);
        int etaMinutes = Math.max(1, (int) Math.round(remainingKm * 3.5));

        DeliveryPartner partner = order.getDeliveryPartner();
        String partnerName = partner != null ? partner.getName() : "Ravi Kumar";
        String vehicle = partner != null ? partner.getVehicleType() : "Electric Scooter";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", order.getId());
        result.put("orderStatus", status.name());
        result.put("statusNote", statusNote);
        result.put("progressRatio", Math.round(ratio * 100.0) / 100.0);
        result.put("latitude", Math.round(currentLat * 10000.0) / 10000.0);
        result.put("longitude", Math.round(currentLon * 10000.0) / 10000.0);
        result.put("restaurantLat", startLat);
        result.put("restaurantLon", startLon);
        result.put("customerLat", destLat);
        result.put("customerLon", destLon);
        result.put("distanceRemainingKm", Math.round(remainingKm * 10.0) / 10.0);
        result.put("etaMinutes", etaMinutes);
        result.put("partnerName", partnerName);
        result.put("vehicle", vehicle);

        return result;
    }
}
