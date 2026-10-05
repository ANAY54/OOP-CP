package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.model.Review;
import com.zesto.service.CustomerService;
import com.zesto.service.ReviewService;
import com.zesto.util.JsonParser;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS:
 *   - Inheritance (extends BaseHandler)
 *   - Polymorphism (process() overrides abstract method)
 *   - Encapsulation
 *   - Composition (ReviewService, CustomerService)
 *
 * Handles /reviews endpoints:
 *   GET  /reviews?restaurantId=   — list reviews for a restaurant
 *   POST /reviews                 — submit a review for a delivered order
 */
public class ReviewHandler extends BaseHandler {

    private final ReviewService reviewService;
    private final CustomerService customerService;

    public ReviewHandler(ReviewService reviewService, CustomerService customerService) {
        this.reviewService   = reviewService;
        this.customerService = customerService;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        String method = exchange.getRequestMethod();
        if ("GET".equals(method)) {
            listReviews(exchange);
        } else if ("POST".equals(method)) {
            submitReview(exchange);
        } else {
            sendJson(exchange, 405, error("Method not allowed"));
        }
    }

    private void listReviews(HttpExchange exchange) throws Exception {
        Map<String, String> params = queryParams(exchange);
        String restIdStr = params.get("restaurantId");
        if (restIdStr == null) {
            sendJson(exchange, 400, error("restaurantId is required"));
            return;
        }
        int restaurantId = Integer.parseInt(restIdStr);
        List<Review> reviews = reviewService.getForRestaurant(restaurantId);

        List<Object> out = new ArrayList<>();
        for (Review r : reviews) {
            out.add(reviewJson(r));
        }

        // Also include aggregated average in response envelope
        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("averageRating", reviewService.averageRating(restaurantId));
        envelope.put("count", reviewService.countForRestaurant(restaurantId));
        envelope.put("reviews", out);
        sendJson(exchange, 200, envelope);
    }

    private void submitReview(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));

        String email   = requireString(body, "email");
        int restaurantId = toInt(body.get("restaurantId"), "restaurantId");
        int rating     = toInt(body.get("rating"), "rating");
        String comment = body.get("comment") instanceof String ? (String) body.get("comment") : "";
        int orderId    = body.get("orderId") instanceof Number
                ? ((Number) body.get("orderId")).intValue() : 0;

        // Validate the customer exists
        var customer = customerService.getByEmail(email);
        String restaurantName = body.get("restaurantName") instanceof String
                ? (String) body.get("restaurantName") : "";

        // Use the inner Builder class (demonstrates inner class in production code)
        Review review = new Review.Builder()
                .restaurantId(restaurantId)
                .restaurantName(restaurantName)
                .customerEmail(customer.getEmail())
                .customerName(customer.getName())
                .orderId(orderId)
                .rating(rating)
                .comment(comment)
                .build();

        Review saved = reviewService.submit(review);
        sendJson(exchange, 201, reviewJson(saved));
    }

    private static Map<String, Object> reviewJson(Review r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",             r.getId());
        m.put("restaurantId",   r.getRestaurantId());
        m.put("restaurantName", r.getRestaurantName());
        m.put("customerName",   r.getCustomerName());
        m.put("rating",         r.getRating());
        m.put("comment",        r.getComment());
        m.put("createdAt",      r.getCreatedAt());
        return m;
    }
}
