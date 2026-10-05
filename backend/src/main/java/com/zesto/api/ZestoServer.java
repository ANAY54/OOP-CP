package com.zesto.api;

import java.io.IOException;
import java.net.InetSocketAddress;

import com.sun.net.httpserver.HttpServer;
import com.zesto.service.CustomerService;
import com.zesto.service.DeliveryPartnerService;
import com.zesto.service.OfferService;
import com.zesto.service.OrderService;
import com.zesto.service.RestaurantService;
import com.zesto.service.ReviewService;

/**
 * OOP CONCEPTS:
 *   - Composition (wires all services together)
 *   - Dependency Injection (services injected into handlers)
 *   - Encapsulation (HttpServer is private)
 *   - Uses com.sun.net.httpserver.HttpServer (JDK built-in, no external libs)
 *
 * Entry point for the HTTP layer.  Registers every route and starts the server.
 * New routes:
 *   POST /orders/cancel   — cancel a PLACED order
 *   GET  /reviews         — list reviews for a restaurant
 *   POST /reviews         — submit a review
 */
public class ZestoServer {

    private final HttpServer server;
    private final int port;

    public ZestoServer(int port) throws IOException {
        this.port = port;

        // Instantiate services (demonstrates composition)
        RestaurantService restaurantService = new RestaurantService();
        OfferService      offerService      = new OfferService();
        DeliveryPartnerService partnerService = new DeliveryPartnerService();
        OrderService      orderService      = new OrderService(offerService, partnerService);
        CustomerService   customerService   = new CustomerService();
        ReviewService     reviewService     = new ReviewService();

        server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/restaurants", new RestaurantHandler(restaurantService));
        server.createContext("/items",       new ItemHandler(restaurantService));
        server.createContext("/offers",      new OfferHandler(offerService));
        server.createContext("/login",       new LoginHandler(customerService));
        server.createContext("/profile",     new ProfileHandler(customerService));
        server.createContext("/orders",      new OrderHandler(restaurantService, orderService, customerService));
        server.createContext("/reviews",     new ReviewHandler(reviewService, customerService));
        server.setExecutor(null);
    }

    public void start() {
        server.start();
        System.out.println("+----------------------------------------------+");
        System.out.println("| Zesto backend running on port " + port + "          |");
        System.out.println("+----------------------------------------------+");
        System.out.println("| GET  /restaurants                            |");
        System.out.println("| GET  /restaurants/{id}                       |");
        System.out.println("| GET  /items?q=                               |");
        System.out.println("| GET  /offers                                 |");
        System.out.println("| POST /login                                  |");
        System.out.println("| GET|POST /profile                            |");
        System.out.println("| POST /orders/preview                         |");
        System.out.println("| POST /orders                                 |");
        System.out.println("| GET  /orders?email=                          |");
        System.out.println("| POST /orders/cancel                          |");
        System.out.println("| GET  /reviews?restaurantId=                  |");
        System.out.println("| POST /reviews                                |");
        System.out.println("+----------------------------------------------+");
        System.out.println("Press Ctrl+C to stop");
    }
}