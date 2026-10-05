package com.zesto.service;

import com.zesto.exception.RestaurantNotFoundException;
import com.zesto.model.*;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class RestaurantService {

    private final Repository<Restaurant> repository = new Repository<>();

    public RestaurantService() {
        loadSampleData();
    }

    private void loadSampleData() {
        Restaurant r1 = new Restaurant("Spice Junction", Cuisine.NORTH_INDIAN, 4.5, 30,
                "FC Road, Pune", 18.5196, 73.8410);
        r1.addItem(new VegItem("Paneer Butter Masala", 240, Cuisine.NORTH_INDIAN, false));
        r1.addItem(new VegItem("Dal Makhani", 190, Cuisine.NORTH_INDIAN, true));
        r1.addItem(new NonVegItem("Chicken Biryani", 280, Cuisine.NORTH_INDIAN, 3));
        r1.addItem(new Beverage("Sweet Lassi", 70, 300, true));

        Restaurant r2 = new Restaurant("Madras Tiffin House", Cuisine.SOUTH_INDIAN, 4.3, 25,
                "Shivajinagar, Pune", 18.5308, 73.8475);
        r2.addItem(new VegItem("Masala Dosa", 90, Cuisine.SOUTH_INDIAN, true));
        r2.addItem(new VegItem("Idli Sambar", 70, Cuisine.SOUTH_INDIAN, true));
        r2.addItem(new VegItem("Medu Vada", 80, Cuisine.SOUTH_INDIAN, true));
        r2.addItem(new Beverage("Filter Coffee", 50, 200, false));

        Restaurant r3 = new Restaurant("Dragon Bowl", Cuisine.CHINESE, 4.1, 35,
                "Camp, Pune", 18.5114, 73.8780);
        r3.addItem(new VegItem("Veg Hakka Noodles", 170, Cuisine.CHINESE, false));
        r3.addItem(new NonVegItem("Chicken Manchurian", 230, Cuisine.CHINESE, 4));
        r3.addItem(new VegItem("Veg Manchow Soup", 120, Cuisine.CHINESE, false));
        r3.addItem(new Beverage("Iced Lemon Tea", 90, 400, true));

        Restaurant r4 = new Restaurant("Little Italy Kitchen", Cuisine.ITALIAN, 4.4, 40,
                "Baner, Pune", 18.5590, 73.7868);
        r4.addItem(new VegItem("Margherita Pizza", 320, Cuisine.ITALIAN, false));
        r4.addItem(new NonVegItem("Chicken Alfredo Pasta", 350, Cuisine.ITALIAN, 1));
        r4.addItem(new VegItem("Garlic Bread", 140, Cuisine.ITALIAN, false));
        r4.addItem(new Beverage("Mango Smoothie", 160, 500, true));

        Restaurant r5 = new Restaurant("Burger Barn", Cuisine.FAST_FOOD, 4.0, 20,
                "Kothrud, Pune", 18.5074, 73.8077);
        r5.addItem(new VegItem("Aloo Tikki Burger", 110, Cuisine.FAST_FOOD, false));
        r5.addItem(new NonVegItem("Crispy Chicken Burger", 170, Cuisine.FAST_FOOD, 2));
        r5.addItem(new VegItem("Peri Peri Fries", 100, Cuisine.FAST_FOOD, false));
        r5.addItem(new Beverage("Cola Large", 80, 750, true));

        Restaurant r6 = new Restaurant("Sweet Tooth", Cuisine.DESSERTS, 4.6, 25,
                "Koregaon Park, Pune", 18.5362, 73.8940);
        r6.addItem(new VegItem("Chocolate Brownie", 130, Cuisine.DESSERTS, false));
        r6.addItem(new VegItem("Gulab Jamun", 90, Cuisine.DESSERTS, true));
        r6.addItem(new VegItem("Blueberry Cheesecake", 210, Cuisine.DESSERTS, false));
        r6.addItem(new Beverage("Cold Coffee", 120, 300, true));

        repository.save(r1);
        repository.save(r2);
        repository.save(r3);
        repository.save(r4);
        repository.save(r5);
        repository.save(r6);
    }

    public List<Restaurant> getAll() {
        return repository.findAll();
    }

    public Restaurant getById(int id) throws RestaurantNotFoundException {
        return repository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));
    }

    public List<Restaurant> getSortedByRating() {
        return repository.findAll().stream()
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