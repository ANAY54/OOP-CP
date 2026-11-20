package com.zesto.service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.zesto.exception.RestaurantNotFoundException;
import com.zesto.model.Cuisine;
import com.zesto.model.FoodItem;
import com.zesto.model.Restaurant;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Composition (holds and delegates to DataCatalogService)
 *   - Streams & Lambdas (filter, sorted, map, collect)
 *   - Method Overloading (search(query) vs search(query, cuisine))
 *   - Custom Exceptions (throws RestaurantNotFoundException)
 */
public class RestaurantService {

    private final DataCatalogService catalogService;

    public RestaurantService() {
        this(new DataCatalogService());
    }

    public RestaurantService(DataCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    public DataCatalogService getCatalogService() {
        return catalogService;
    }

    public List<Restaurant> getAll() {
        return catalogService.getRestaurants();
    }

    public Restaurant getById(int id) throws RestaurantNotFoundException {
        return catalogService.findRestaurantById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));
    }

    public Optional<FoodItem> findDishById(int id) {
        return catalogService.findDishById(id);
    }

    public List<Restaurant> getSortedByRating() {
        return catalogService.getRestaurants().stream()
                .sorted(Comparator.comparingDouble(Restaurant::getRating).reversed())
                .collect(Collectors.toList());
    }

    public List<Restaurant> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getSortedByRating();
        }
        return getSortedByRating().stream()
                .filter(r -> r.matches(query.trim()))
                .collect(Collectors.toList());
    }

    public List<Restaurant> search(String query, Cuisine cuisine) {
        return search(query).stream()
                .filter(r -> r.getCuisine() == cuisine)
                .collect(Collectors.toList());
    }
}
