package com.zesto.service;

import java.util.List;
import com.zesto.exception.ExternalApiException;
import com.zesto.model.Restaurant;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Interface (Defines the abstraction contract for fetching restaurant catalogs)
 *   - Strategy Pattern (Allows runtime polymorphic switching between live Overpass API and Sample fallback)
 *   - Polymorphism (Consumers program to the interface, not concrete implementations)
 */
public interface RestaurantProvider {
    List<Restaurant> fetchRestaurants() throws ExternalApiException;
    String getProviderName();
}
