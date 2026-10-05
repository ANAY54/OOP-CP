package com.zesto.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * OOP CONCEPTS: Class, Encapsulation, Immutability (final fields),
 *               Composition (Review belongs to a Restaurant and Customer)
 *
 * Represents a customer's review for a restaurant after an order.
 * Rating is 1-5 stars.  Text is optional.
 */
public class Review implements Identifiable {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm");

    private static int idCounter = 9000;

    // ------------------------------------------------------------------ fields
    private final int id;
    private final int restaurantId;
    private final String restaurantName;
    private final String customerEmail;
    private final String customerName;
    private final int orderId;
    private final int rating;          // 1–5
    private final String comment;
    private final String createdAt;

    // ------------------------------------------------------------------ inner class (for viva)
    /**
     * INNER CLASS demonstration for viva.
     * A simple builder that makes constructing Review objects readable.
     */
    public static class Builder {
        private int restaurantId;
        private String restaurantName = "";
        private String customerEmail  = "";
        private String customerName   = "";
        private int orderId;
        private int rating            = 5;
        private String comment        = "";

        public Builder restaurantId(int id)          { this.restaurantId = id; return this; }
        public Builder restaurantName(String n)      { this.restaurantName = n; return this; }
        public Builder customerEmail(String e)       { this.customerEmail = e; return this; }
        public Builder customerName(String n)        { this.customerName = n; return this; }
        public Builder orderId(int id)               { this.orderId = id; return this; }
        public Builder rating(int r)                 { this.rating = Math.max(1, Math.min(5, r)); return this; }
        public Builder comment(String c)             { this.comment = c == null ? "" : c.trim(); return this; }

        public Review build() {
            return new Review(restaurantId, restaurantName, customerEmail,
                    customerName, orderId, rating, comment);
        }
    }

    // ------------------------------------------------------------------ constructor
    private Review(int restaurantId, String restaurantName, String customerEmail,
                   String customerName, int orderId, int rating, String comment) {
        this.id             = ++idCounter;
        this.restaurantId   = restaurantId;
        this.restaurantName = restaurantName;
        this.customerEmail  = customerEmail;
        this.customerName   = customerName;
        this.orderId        = orderId;
        this.rating         = Math.max(1, Math.min(5, rating));
        this.comment        = comment;
        this.createdAt      = LocalDateTime.now().format(FMT);
    }

    // ------------------------------------------------------------------ getters
    @Override public int getId()              { return id; }
    public int getRestaurantId()              { return restaurantId; }
    public String getRestaurantName()         { return restaurantName; }
    public String getCustomerEmail()          { return customerEmail; }
    public String getCustomerName()           { return customerName; }
    public int getOrderId()                   { return orderId; }
    public int getRating()                    { return rating; }
    public String getComment()                { return comment; }
    public String getCreatedAt()              { return createdAt; }

    @Override
    public String toString() {
        return String.format("Review#%d [%d★] %s → %s: %s (%s)",
                id, rating, customerName, restaurantName,
                comment.isEmpty() ? "(no comment)" : comment, createdAt);
    }
}
