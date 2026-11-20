package com.zesto.service;

import java.util.List;
import com.zesto.exception.ExternalApiException;
import com.zesto.model.FoodItem;
import com.zesto.model.Restaurant;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Interface (Defines the abstraction contract for acquiring menu items and culinary data)
 *   - Dependency Inversion Principle (High-level catalog logic depends on MenuProvider abstraction)
 *   - Polymorphism (Permits pluggable menu generation from TheMealDB or offline sample menus)
 */
public interface MenuProvider {
    List<FoodItem> fetchMenuFor(Restaurant restaurant) throws ExternalApiException;
    String getProviderName();
}
