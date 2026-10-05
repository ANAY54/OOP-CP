package com.zesto.service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import com.zesto.exception.RestaurantNotFoundException;
import com.zesto.model.Beverage;
import com.zesto.model.Cuisine;
import com.zesto.model.NonVegItem;
import com.zesto.model.Restaurant;
import com.zesto.model.VegItem;

public class RestaurantService {

    private final Repository<Restaurant> repository = new Repository<>();

    public RestaurantService() {
        loadSampleData();
    }

    private static void veg(Restaurant r, String name, double price) {
        r.addItem(new VegItem(name, price, r.getCuisine(), false));
    }

    private static void jain(Restaurant r, String name, double price) {
        r.addItem(new VegItem(name, price, r.getCuisine(), true));
    }

    private static void nonVeg(Restaurant r, String name, double price, int spice) {
        r.addItem(new NonVegItem(name, price, r.getCuisine(), spice));
    }

    private static void drink(Restaurant r, String name, double price, int sizeMl, boolean cold) {
        r.addItem(new Beverage(name, price, sizeMl, cold));
    }

    private void loadSampleData() {
        Restaurant r1 = new Restaurant("Spice Junction", Cuisine.NORTH_INDIAN, 4.5, 30,
                "FC Road, Pune", 18.5196, 73.8410, 600, 2400, "Bestseller");
        veg(r1, "Paneer Butter Masala", 240);
        jain(r1, "Dal Makhani", 190);
        nonVeg(r1, "Chicken Biryani", 280, 3);
        nonVeg(r1, "Butter Chicken", 320, 2);
        veg(r1, "Garlic Naan", 60);
        veg(r1, "Tandoori Roti", 25);
        veg(r1, "Gulab Jamun", 90);
        drink(r1, "Sweet Lassi", 70, 300, true);

        Restaurant r2 = new Restaurant("Madras Tiffin House", Cuisine.SOUTH_INDIAN, 4.3, 25,
                "Shivajinagar, Pune", 18.5308, 73.8475, 300, 1800, null);
        jain(r2, "Masala Dosa", 90);
        jain(r2, "Idli Sambar", 70);
        veg(r2, "Medu Vada", 80);
        veg(r2, "Mysore Masala Dosa", 110);
        veg(r2, "Rava Upma", 75);
        veg(r2, "Onion Uttapam", 100);
        veg(r2, "Ven Pongal", 85);
        drink(r2, "Filter Coffee", 50, 200, false);

        Restaurant r3 = new Restaurant("Dragon Bowl", Cuisine.CHINESE, 4.1, 35,
                "Camp, Pune", 18.5114, 73.8780, 500, 950, null);
        veg(r3, "Veg Hakka Noodles", 170);
        nonVeg(r3, "Chicken Hakka Noodles", 220, 3);
        nonVeg(r3, "Chicken Manchurian", 230, 4);
        veg(r3, "Chilli Paneer", 210);
        veg(r3, "Schezwan Fried Rice", 190);
        veg(r3, "Veg Manchow Soup", 120);
        veg(r3, "Honey Chilli Potato", 160);
        drink(r3, "Iced Lemon Tea", 90, 400, true);

        Restaurant r4 = new Restaurant("Little Italy Kitchen", Cuisine.ITALIAN, 4.4, 40,
                "Baner, Pune", 18.5590, 73.7868, 800, 1500, "Top rated");
        veg(r4, "Margherita Pizza", 320);
        veg(r4, "Farmhouse Pizza", 380);
        nonVeg(r4, "Pepperoni Pizza", 420, 2);
        nonVeg(r4, "Chicken Alfredo Pasta", 350, 1);
        veg(r4, "Penne Arrabbiata", 310);
        veg(r4, "Garlic Bread", 140);
        veg(r4, "Tiramisu", 220);
        drink(r4, "Mango Smoothie", 160, 500, true);

        Restaurant r5 = new Restaurant("Burger Barn", Cuisine.FAST_FOOD, 4.0, 20,
                "Kothrud, Pune", 18.5074, 73.8077, 350, 3100, "Trending");
        veg(r5, "Aloo Tikki Burger", 110);
        nonVeg(r5, "Crispy Chicken Burger", 170, 2);
        nonVeg(r5, "Chicken Wrap", 160, 2);
        nonVeg(r5, "Chicken Nuggets", 150, 1);
        veg(r5, "Veg Club Sandwich", 140);
        veg(r5, "Cheese Loaded Fries", 130);
        veg(r5, "Peri Peri Fries", 100);
        drink(r5, "Cola Large", 80, 750, true);

        Restaurant r6 = new Restaurant("Sweet Tooth", Cuisine.DESSERTS, 4.6, 25,
                "Koregaon Park, Pune", 18.5362, 73.8940, 400, 2700, "Top rated");
        veg(r6, "Chocolate Brownie", 130);
        jain(r6, "Gulab Jamun", 90);
        veg(r6, "Blueberry Cheesecake", 210);
        veg(r6, "Red Velvet Pastry", 150);
        veg(r6, "Rasmalai", 120);
        veg(r6, "Waffle with Nutella", 180);
        drink(r6, "Cold Coffee", 120, 300, true);

        Restaurant r7 = new Restaurant("Tandoor Tales", Cuisine.NORTH_INDIAN, 4.2, 35,
                "Viman Nagar, Pune", 18.5679, 73.9143, 700, 1200, null);
        nonVeg(r7, "Tandoori Chicken", 350, 3);
        nonVeg(r7, "Chicken Tikka", 290, 3);
        nonVeg(r7, "Mutton Seekh Kebab", 380, 3);
        veg(r7, "Paneer Tikka", 260);
        veg(r7, "Hara Bhara Kebab", 220);
        jain(r7, "Dal Tadka", 180);
        veg(r7, "Butter Naan", 55);
        drink(r7, "Masala Chaas", 50, 250, true);

        Restaurant r8 = new Restaurant("Udupi Sagar", Cuisine.SOUTH_INDIAN, 4.4, 20,
                "Deccan, Pune", 18.5167, 73.8390, 250, 4200, "Bestseller");
        veg(r8, "Idli Vada Combo", 90);
        veg(r8, "Plain Dosa", 70);
        veg(r8, "Paper Dosa", 120);
        veg(r8, "Bisi Bele Bath", 130);
        veg(r8, "Kesari Bath", 60);
        veg(r8, "Medu Vada", 75);
        drink(r8, "Filter Coffee", 45, 200, false);

        Restaurant r9 = new Restaurant("Wok & Roll", Cuisine.CHINESE, 4.3, 30,
                "Aundh, Pune", 18.5580, 73.8075, 550, 1100, "New");
        nonVeg(r9, "Chicken Fried Rice", 210, 2);
        nonVeg(r9, "Chilli Chicken", 240, 4);
        nonVeg(r9, "Chicken Dumplings", 210, 1);
        veg(r9, "Veg Dumplings", 180);
        veg(r9, "Veg Spring Rolls", 150);
        veg(r9, "Hot & Sour Soup", 110);
        veg(r9, "Paneer Chilli Dry", 220);
        drink(r9, "Jasmine Tea", 80, 300, false);

        Restaurant r10 = new Restaurant("Crust & Co", Cuisine.ITALIAN, 4.2, 35,
                "Kalyani Nagar, Pune", 18.5463, 73.9033, 750, 890, null);
        veg(r10, "Four Cheese Pizza", 399);
        veg(r10, "Paneer Tikka Pizza", 360);
        nonVeg(r10, "Chicken Tikka Pizza", 410, 2);
        veg(r10, "White Sauce Pasta", 280);
        veg(r10, "Red Sauce Pasta", 270);
        veg(r10, "Cheesy Garlic Bread", 160);
        veg(r10, "Brownie Sundae", 190);
        drink(r10, "Peach Iced Tea", 110, 400, true);

        Restaurant r11 = new Restaurant("Grill House 24", Cuisine.FAST_FOOD, 4.1, 25,
                "Hadapsar, Pune", 18.5089, 73.9260, 450, 760, null);
        nonVeg(r11, "Grilled Chicken Burger", 190, 2);
        nonVeg(r11, "BBQ Chicken Wings", 260, 3);
        veg(r11, "Veggie Supreme Burger", 130);
        veg(r11, "Paneer Grilled Sandwich", 120);
        veg(r11, "Loaded Nachos", 170);
        veg(r11, "French Fries", 90);
        drink(r11, "Chocolate Shake", 140, 400, true);

        Restaurant r12 = new Restaurant("Brew & Chill", Cuisine.BEVERAGES, 4.5, 15,
                "Wakad, Pune", 18.5987, 73.7607, 300, 1300, "Trending");
        drink(r12, "Cold Brew Coffee", 150, 350, true);
        drink(r12, "Cappuccino", 130, 250, false);
        drink(r12, "Mango Lassi", 100, 400, true);
        drink(r12, "Fresh Lime Soda", 70, 350, true);
        drink(r12, "Masala Chai", 40, 200, false);
        drink(r12, "Strawberry Smoothie", 170, 450, true);
        veg(r12, "Blueberry Muffin", 90);

        Restaurant r13 = new Restaurant("Frosty Scoops", Cuisine.DESSERTS, 4.4, 20,
                "Karve Nagar, Pune", 18.4920, 73.8200, 250, 980, null);
        veg(r13, "Vanilla Scoop", 70);
        veg(r13, "Chocolate Fudge Sundae", 160);
        veg(r13, "Butterscotch Cone", 90);
        veg(r13, "Kulfi Falooda", 130);
        veg(r13, "Sizzling Brownie", 190);
        veg(r13, "Mango Sundae", 150);
        drink(r13, "Choco Shake", 140, 400, true);

        Restaurant r14 = new Restaurant("The Biryani Pot", Cuisine.NORTH_INDIAN, 4.3, 40,
                "Kondhwa, Pune", 18.4650, 73.8870, 650, 2100, "Bestseller");
        nonVeg(r14, "Chicken Dum Biryani", 290, 3);
        nonVeg(r14, "Mutton Biryani", 360, 3);
        nonVeg(r14, "Egg Biryani", 240, 2);
        nonVeg(r14, "Chicken 65", 230, 4);
        veg(r14, "Veg Dum Biryani", 220);
        veg(r14, "Mirchi Ka Salan", 90);
        veg(r14, "Boondi Raita", 50);
        drink(r14, "Cola", 60, 330, true);

        // To show a real photo for any restaurant, add a line like:
        // r1.setImageUrl("https://your-image-link.jpg");

        for (Restaurant r : List.of(r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14)) {
            repository.save(r);
        }
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