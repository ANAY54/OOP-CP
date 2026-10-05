package com.zesto.service;

import com.zesto.model.Review;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * OOP CONCEPTS: Generics (List<Review>), Collections, Streams & Lambdas,
 *               Encapsulation, Synchronization (thread-safe map)
 *
 * Manages customer reviews.  Reviews are stored in a thread-safe map keyed
 * by restaurantId so look-up by restaurant is O(1).
 *
 * Uses Java Streams with lambda expressions to compute average ratings.
 */
public class ReviewService {

    // ConcurrentHashMap — thread-safe, one list of reviews per restaurant
    private final Map<Integer, List<Review>> byRestaurant = new ConcurrentHashMap<>();

    /**
     * Add a review.  Thread-safe via computeIfAbsent + synchronized list.
     */
    public synchronized Review submit(Review review) {
        byRestaurant.computeIfAbsent(review.getRestaurantId(),
                k -> new ArrayList<>()).add(review);
        return review;
    }

    /**
     * Get all reviews for a restaurant (sorted newest-first via lambda).
     * Demonstrates: Streams + Comparator lambda.
     */
    public List<Review> getForRestaurant(int restaurantId) {
        List<Review> list = byRestaurant.getOrDefault(restaurantId, Collections.emptyList());
        // Lambda passed to sorted() — demonstrates lambda expression
        return list.stream()
                .sorted((a, b) -> b.getId() - a.getId())   // newest first
                .collect(Collectors.toList());
    }

    /**
     * Compute average rating for a restaurant using streams and OptionalDouble.
     * Demonstrates: Stream → mapToInt → average → lambda.
     */
    public double averageRating(int restaurantId) {
        List<Review> list = byRestaurant.getOrDefault(restaurantId, Collections.emptyList());
        OptionalDouble avg = list.stream()
                .mapToInt(Review::getRating)   // method reference (lambda shorthand)
                .average();
        return avg.isPresent() ? Math.round(avg.getAsDouble() * 10.0) / 10.0 : 0.0;
    }

    /** Total review count for a restaurant. */
    public int countForRestaurant(int restaurantId) {
        return byRestaurant.getOrDefault(restaurantId, Collections.emptyList()).size();
    }

    /** All reviews across all restaurants (for ConsoleDemo). */
    public List<Review> getAll() {
        return byRestaurant.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.toList());
    }
}
