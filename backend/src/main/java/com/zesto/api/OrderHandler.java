package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.model.*;
import com.zesto.service.CustomerService;
import com.zesto.service.OrderService;
import com.zesto.service.RestaurantService;
import com.zesto.util.JsonParser;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS:
 *   - Inheritance (extends BaseHandler — Template Method pattern)
 *   - Polymorphism (process() overrides abstract method)
 *   - Encapsulation (private helper methods)
 *   - Custom Exceptions (caught and returned as 400/404)
 *   - Collections, Generics
 *
 * Handles all /orders endpoints:
 *   GET  /orders?email=          — list orders for a customer
 *   POST /orders/preview         — preview bill
 *   POST /orders                 — place order
 *   POST /orders/cancel          — cancel a PLACED order
 */
public class OrderHandler extends BaseHandler {

    private final RestaurantService restaurantService;
    private final OrderService orderService;
    private final CustomerService customerService;

    public OrderHandler(RestaurantService restaurantService, OrderService orderService,
                        CustomerService customerService) {
        this.restaurantService = restaurantService;
        this.orderService      = orderService;
        this.customerService   = customerService;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        String method = exchange.getRequestMethod();
        String path   = exchange.getRequestURI().getPath();

        if ("GET".equals(method)) {
            if (path.endsWith("/rider")) {
                getRiderLocation(exchange);
            } else {
                listOrders(exchange);
            }
        } else if ("POST".equals(method) && path.endsWith("/preview")) {
            previewOrder(exchange);
        } else if ("POST".equals(method) && path.endsWith("/cancel")) {
            cancelOrder(exchange);
        } else if ("POST".equals(method)) {
            placeOrder(exchange);
        } else {
            sendJson(exchange, 405, error("Method not allowed"));
        }
    }

    // ------------------------------------------------------------------ rider
    private void getRiderLocation(HttpExchange exchange) throws Exception {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int orderId = -1;
        for (int i = 0; i < parts.length; i++) {
            if ("orders".equalsIgnoreCase(parts[i]) && i + 1 < parts.length) {
                try {
                    orderId = Integer.parseInt(parts[i + 1]);
                } catch (NumberFormatException ignored) {}
                break;
            }
        }

        if (orderId <= 0) {
            sendJson(exchange, 400, error("Invalid order id in path /orders/{id}/rider"));
            return;
        }

        Order order = orderService.findById(orderId).orElse(null);
        if (order == null) {
            sendJson(exchange, 404, error("Order #" + orderId + " not found"));
            return;
        }

        Map<String, String> qp = queryParams(exchange);
        double custLat = 0.0;
        double custLon = 0.0;
        try {
            if (qp.containsKey("lat")) custLat = Double.parseDouble(qp.get("lat"));
            if (qp.containsKey("lon")) custLon = Double.parseDouble(qp.get("lon"));
        } catch (Exception ignored) {}

        com.zesto.service.RiderSimulator sim = new com.zesto.service.RiderSimulator();
        Map<String, Object> riderData = sim.simulateRiderPosition(order, custLat, custLon);
        sendJson(exchange, 200, riderData);
    }

    // ------------------------------------------------------------------ list
    private void listOrders(HttpExchange exchange) throws Exception {
        Customer customer = customerService.getByEmail(queryParams(exchange).get("email"));
        List<Order> orders = new ArrayList<>(orderService.getOrdersFor(customer));
        Collections.reverse(orders);

        List<Object> out = new ArrayList<>();
        for (Order order : orders) {
            out.add(JsonMapper.order(order));
        }
        sendJson(exchange, 200, out);
    }

    // ------------------------------------------------------------------ preview
    private void previewOrder(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));

        Customer   customer   = customerService.getByEmail(requireString(body, "email"));
        Restaurant restaurant = restaurantService.getById(toInt(body.get("restaurantId"), "restaurantId"));
        Cart       cart       = buildCart(body, restaurant);

        double deliveryFee = computeDeliveryFee(body, restaurant);
        Bill bill = orderService.previewBill(customer, cart, optionalString(body, "coupon"), deliveryFee);
        sendJson(exchange, 200, billJson(bill));
    }

    // ------------------------------------------------------------------ place
    private void placeOrder(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));

        Customer   customer   = customerService.getByEmail(requireString(body, "email"));
        Restaurant restaurant = restaurantService.getById(toInt(body.get("restaurantId"), "restaurantId"));
        Cart       cart       = buildCart(body, restaurant);

        String payment = optionalString(body, "payment");
        PaymentMode mode = PaymentMode.valueOf(
                (payment == null ? "UPI" : payment).toUpperCase());

        double deliveryFee = computeDeliveryFee(body, restaurant);
        Order order = orderService.placeOrder(customer, cart, optionalString(body, "coupon"), mode, deliveryFee);
        sendJson(exchange, 201, JsonMapper.order(order));
    }

    private double computeDeliveryFee(Map<String, Object> body, Restaurant restaurant) {
        if (body.containsKey("lat") && body.containsKey("lon")) {
            try {
                double userLat = Double.parseDouble(String.valueOf(body.get("lat")));
                double userLon = Double.parseDouble(String.valueOf(body.get("lon")));
                double distanceKm = com.zesto.util.DistanceCalculator.distance(
                        userLat, userLon, restaurant.getLatitude(), restaurant.getLongitude());
                return new com.zesto.service.PricingPolicy().calculateDeliveryFee(distanceKm);
            } catch (Exception ignored) {
                // fallback to default fee
            }
        }
        return Bill.DEFAULT_DELIVERY_FEE;
    }

    // ------------------------------------------------------------------ cancel
    private void cancelOrder(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
        int    orderId = toInt(body.get("orderId"), "orderId");
        String email   = requireString(body, "email");

        Order order = orderService.cancelOrder(orderId, email);
        sendJson(exchange, 200, JsonMapper.order(order));
    }

    // ------------------------------------------------------------------ helpers
    private Cart buildCart(Map<String, Object> body, Restaurant restaurant) {
        Object itemsObj = body.get("items");
        if (!(itemsObj instanceof List)) {
            throw new IllegalArgumentException("'items' must be a list");
        }
        Cart cart = new Cart(restaurant);
        for (Object entry : (List<?>) itemsObj) {
            if (!(entry instanceof Map)) throw new IllegalArgumentException("Each item must be an object");
            Map<?, ?> line = (Map<?, ?>) entry;
            int itemId   = toInt(line.get("itemId"),   "itemId");
            int quantity = toInt(line.get("quantity"),  "quantity");
            FoodItem item = restaurant.findItemById(itemId).orElseThrow(
                    () -> new IllegalArgumentException("Item " + itemId + " not on this menu"));
            cart.add(item, quantity);
        }
        return cart;
    }

    private static String optionalString(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v instanceof String ? (String) v : null;
    }

    private static Map<String, Object> billJson(Bill bill) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("subtotal",    bill.getSubtotal());
        m.put("discount",    bill.getDiscount());
        m.put("tax",         bill.getTax());
        m.put("deliveryFee", bill.getDeliveryFee());
        m.put("total",       bill.getTotal());
        return m;
    }
}