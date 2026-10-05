package com.zesto.api;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.zesto.model.Customer;
import com.zesto.model.DeliveryPartner;
import com.zesto.model.FoodItem;
import com.zesto.model.NonVegItem;
import com.zesto.model.Offer;
import com.zesto.model.Order;
import com.zesto.model.Restaurant;

/**
 * OOP CONCEPTS:
 *   - Static utility class (private constructor, all-static methods)
 *   - Encapsulation (converts internal models to plain Maps for JSON)
 *   - final class (cannot be subclassed)
 *   - Polymorphism (instanceof check for NonVegItem vs VegItem)
 */
public final class JsonMapper {

    private JsonMapper() { /* utility class — no instances */ }

    public static Map<String, Object> foodItem(FoodItem item) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          item.getId());
        m.put("name",        item.getName());
        m.put("price",       item.calculatePrice());
        m.put("category",    item.getCategory());
        m.put("veg",         !(item instanceof NonVegItem));
        m.put("cuisine",     item.getCuisine().getDisplayName());
        m.put("description", item.getDescription());
        return m;
    }

    public static Map<String, Object> restaurant(Restaurant r, boolean withMenu) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",              r.getId());
        m.put("name",            r.getName());
        m.put("cuisine",         r.getCuisine().getDisplayName());
        m.put("cuisineKey",      r.getCuisine().name());
        m.put("rating",          r.getRating());
        m.put("deliveryTimeMin", r.getDeliveryTimeMin());
        m.put("address",         r.getAddress());
        m.put("latitude",        r.getLatitude());
        m.put("longitude",       r.getLongitude());
        m.put("priceForTwo",     r.getPriceForTwo());
        m.put("reviewCount",     r.getReviewCount());
        m.put("badge",           r.getBadge());
        m.put("imageUrl",        r.getImageUrl());
        m.put("pureVeg",         r.isPureVeg());
        if (withMenu) {
            List<Object> items = new ArrayList<>();
            for (FoodItem item : r.getMenu()) {
                items.add(foodItem(item));
            }
            m.put("menu", items);
        }
        return m;
    }

    public static Map<String, Object> offer(Offer o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code",            o.getCode());
        m.put("title",           o.getTitle());
        m.put("discountPercent", o.getDiscountPercent());
        m.put("minOrder",        o.getMinOrder());
        m.put("maxDiscount",     o.getMaxDiscount());
        return m;
    }

    public static Map<String, Object> customer(Customer c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            c.getId());
        m.put("name",          c.getName());
        m.put("email",         c.getEmail());
        m.put("address",       c.getAddress());
        m.put("loyaltyPoints", c.getLoyaltyPoints());
        return m;
    }

    public static Map<String, Object> order(Order o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",             o.getId());
        m.put("restaurantId",   o.getRestaurant().getId());
        m.put("restaurantName", o.getRestaurant().getName());

        List<Object> lines = new ArrayList<>();
        for (Order.OrderLine line : o.getLines()) {
            Map<String, Object> l = new LinkedHashMap<>();
            l.put("name",      line.getItemName());
            l.put("unitPrice", line.getUnitPrice());
            l.put("quantity",  line.getQuantity());
            l.put("lineTotal", line.getLineTotal());
            lines.add(l);
        }
        m.put("lines", lines);

        m.put("subtotal",    o.getSubtotal());
        m.put("discount",    o.getDiscount());
        m.put("tax",         o.getTax());
        m.put("deliveryFee", o.getDeliveryFee());
        m.put("total",       o.getTotal());
        m.put("coupon",      o.getCouponCode());
        m.put("payment",     o.getPaymentMode().name());
        m.put("status",      o.getStatus().name());
        m.put("statusLabel", o.getStatus().getLabel());

        // Delivery partner info (new — shown on Orders screen)
        DeliveryPartner partner = o.getDeliveryPartner();
        if (partner != null) {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("name",    partner.getName());
            p.put("vehicle", partner.getVehicle());
            m.put("deliveryPartner", p);
        } else {
            m.put("deliveryPartner", null);
        }

        return m;
    }
}