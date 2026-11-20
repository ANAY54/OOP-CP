package com.zesto.service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.zesto.model.Order;
import com.zesto.model.OrderStatus;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Immutable Value / Analytics Object (final fields computed via static factory)
 *   - Streams & Lambdas (filtering & aggregating Order revenue and item frequency)
 *   - Encapsulation (business payout formula: 8% small-business platform fee)
 */
public final class MerchantAnalytics {

    public static final double SMALL_BUSINESS_FEE_RATE = 0.08; // 8% partner-friendly fee

    private final int totalOrders;
    private final int activeOrders;
    private final int deliveredOrders;
    private final int cancelledOrders;
    private final int totalItemsSold;
    private final double grossRevenue;
    private final double platformFee;
    private final double netPayout;
    private final double averageOrderValue;
    private final String topSellingDish;

    private MerchantAnalytics(
            int totalOrders,
            int activeOrders,
            int deliveredOrders,
            int cancelledOrders,
            int totalItemsSold,
            double grossRevenue,
            double platformFee,
            double netPayout,
            double averageOrderValue,
            String topSellingDish) {
        this.totalOrders = totalOrders;
        this.activeOrders = activeOrders;
        this.deliveredOrders = deliveredOrders;
        this.cancelledOrders = cancelledOrders;
        this.totalItemsSold = totalItemsSold;
        this.grossRevenue = grossRevenue;
        this.platformFee = platformFee;
        this.netPayout = netPayout;
        this.averageOrderValue = averageOrderValue;
        this.topSellingDish = topSellingDish;
    }

    public static MerchantAnalytics compute(List<Order> restaurantOrders) {
        if (restaurantOrders == null || restaurantOrders.isEmpty()) {
            return new MerchantAnalytics(0, 0, 0, 0, 0, 0.0, 0.0, 0.0, 0.0, "No orders yet");
        }

        int total = restaurantOrders.size();
        int cancelled = (int) restaurantOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELLED)
                .count();
        int delivered = (int) restaurantOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .count();
        int active = total - cancelled - delivered;

        List<Order> nonCancelled = restaurantOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .toList();

        double gross = nonCancelled.stream()
                .mapToDouble(Order::getSubtotal)
                .sum();
        gross = round2(gross);
        double fee = round2(gross * SMALL_BUSINESS_FEE_RATE);
        double payout = round2(gross - fee);
        double avg = nonCancelled.isEmpty() ? 0.0 : round2(gross / nonCancelled.size());

        Map<String, Integer> dishCounts = new HashMap<>();
        int itemsSold = 0;
        for (Order o : nonCancelled) {
            for (Order.OrderLine line : o.getLines()) {
                itemsSold += line.getQuantity();
                dishCounts.merge(line.getItemName(), line.getQuantity(), Integer::sum);
            }
        }

        String topDish = dishCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey() + " (" + e.getValue() + " sold)")
                .orElse("No orders yet");

        return new MerchantAnalytics(total, active, delivered, cancelled, itemsSold, gross, fee, payout, avg, topDish);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    public int getTotalOrders() { return totalOrders; }
    public int getActiveOrders() { return activeOrders; }
    public int getDeliveredOrders() { return deliveredOrders; }
    public int getCancelledOrders() { return cancelledOrders; }
    public int getTotalItemsSold() { return totalItemsSold; }
    public double getGrossRevenue() { return grossRevenue; }
    public double getPlatformFee() { return platformFee; }
    public double getNetPayout() { return netPayout; }
    public double getAverageOrderValue() { return averageOrderValue; }
    public String getTopSellingDish() { return topSellingDish; }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalOrders", totalOrders);
        m.put("activeOrders", activeOrders);
        m.put("deliveredOrders", deliveredOrders);
        m.put("cancelledOrders", cancelledOrders);
        m.put("totalItemsSold", totalItemsSold);
        m.put("grossRevenue", grossRevenue);
        m.put("platformFee", platformFee);
        m.put("netPayout", netPayout);
        m.put("averageOrderValue", averageOrderValue);
        m.put("topSellingDish", topSellingDish);
        return m;
    }
}
