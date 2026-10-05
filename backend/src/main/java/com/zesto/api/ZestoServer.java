package com.zesto.api;

import com.sun.net.httpserver.HttpServer;
import com.zesto.service.CustomerService;
import com.zesto.service.OfferService;
import com.zesto.service.OrderService;
import com.zesto.service.RestaurantService;

import java.io.IOException;
import java.net.InetSocketAddress;

public class ZestoServer {

    private final HttpServer server;
    private final int port;

    public ZestoServer(int port) throws IOException {
        this.port = port;

        RestaurantService restaurantService = new RestaurantService();
        OfferService offerService = new OfferService();
        OrderService orderService = new OrderService(offerService);
        CustomerService customerService = new CustomerService();

        server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/restaurants", new RestaurantHandler(restaurantService));
        server.createContext("/items", new ItemHandler(restaurantService));
        server.createContext("/offers", new OfferHandler(offerService));
        server.createContext("/login", new LoginHandler(customerService));
        server.createContext("/orders", new OrderHandler(restaurantService, orderService, customerService));
        server.setExecutor(null);
    }

    public void start() {
        server.start();
        System.out.println("Zesto server running on port " + port);
        System.out.println("Try: http://localhost:" + port + "/restaurants");
        System.out.println("Press Ctrl+C to stop");
    }
}