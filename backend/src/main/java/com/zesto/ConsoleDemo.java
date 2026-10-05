package com.zesto;

import com.zesto.exception.ZestoException;
import com.zesto.model.*;
import com.zesto.service.*;

public class ConsoleDemo {
    public static void main(String[] args) {

        RestaurantService restaurantService = new RestaurantService();
        OfferService offerService = new OfferService();
        OrderService orderService = new OrderService(offerService);
        Customer customer = new Customer("Aarav", "aarav@example.com", "Kothrud, Pune");

        System.out.println("=== RESTAURANTS (by rating) ===");
        for (Restaurant r : restaurantService.getSortedByRating()) {
            System.out.println(r);
        }

        System.out.println("\n=== SEARCH 'biryani' ===");
        restaurantService.search("biryani").forEach(System.out::println);

        System.out.println("\n=== OFFERS ===");
        offerService.getAll().forEach(System.out::println);

        System.out.println("\n=== PLACE ORDER ===");
        try {
            Restaurant restaurant = restaurantService.getById(1);
            Cart cart = new Cart(restaurant);
            cart.add(restaurant.getMenu().get(0), 2);
            cart.add(restaurant.getMenu().get(1));

            Order order = orderService.placeOrder(customer, cart, "ZESTO50", PaymentMode.UPI);
            System.out.println(order);

            order.advanceStatus();
            System.out.println("After advance: " + order.getStatus().getLabel());
            System.out.println("Loyalty points now: " + customer.getLoyaltyPoints());

            System.out.println("\n=== ERROR HANDLING ===");
            orderService.placeOrder(customer, new Cart(restaurant), null, PaymentMode.CARD);
        } catch (ZestoException e) {
            System.out.println("Error: " + e.getMessage());
        } finally {
            System.out.println("Done");
        }

        try {
            restaurantService.getById(99);
        } catch (ZestoException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}