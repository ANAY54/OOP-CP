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

public class OrderHandler extends BaseHandler {

    private final RestaurantService restaurantService;
    private final OrderService orderService;
    private final CustomerService customerService;

    public OrderHandler(RestaurantService restaurantService, OrderService orderService,
                        CustomerService customerService) {
        this.restaurantService = restaurantService;
        this.orderService = orderService;
        this.customerService = customerService;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if ("GET".equals(method)) {
            listOrders(exchange);
        } else if ("POST".equals(method) && path.endsWith("/preview")) {
            previewOrder(exchange);
        } else if ("POST".equals(method)) {
            placeOrder(exchange);
        } else {
            sendJson(exchange, 405, error("Method not allowed"));
        }
    }

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

    private void previewOrder(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));

        Customer customer = customerService.getByEmail(requireString(body, "email"));
        Restaurant restaurant = restaurantService.getById(toInt(body.get("restaurantId"), "restaurantId"));
        Cart cart = buildCart(body, restaurant);

        Bill bill = orderService.previewBill(customer, cart, optionalString(body, "coupon"));
        sendJson(exchange, 200, billJson(bill));
    }

    private void placeOrder(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));

        Customer customer = customerService.getByEmail(requireString(body, "email"));
        Restaurant restaurant = restaurantService.getById(toInt(body.get("restaurantId"), "restaurantId"));
        Cart cart = buildCart(body, restaurant);

        String payment = optionalString(body, "payment");
        PaymentMode mode = PaymentMode.valueOf((payment == null ? "UPI" : payment).toUpperCase());

        Order order = orderService.placeOrder(customer, cart, optionalString(body, "coupon"), mode);
        sendJson(exchange, 201, JsonMapper.order(order));
    }

    private Cart buildCart(Map<String, Object> body, Restaurant restaurant) {
        Object itemsObj = body.get("items");
        if (!(itemsObj instanceof List)) {
            throw new IllegalArgumentException("'items' must be a list");
        }

        Cart cart = new Cart(restaurant);
        for (Object entry : (List<?>) itemsObj) {
            if (!(entry instanceof Map)) {
                throw new IllegalArgumentException("Each item must be an object");
            }
            Map<?, ?> line = (Map<?, ?>) entry;
            int itemId = toInt(line.get("itemId"), "itemId");
            int quantity = toInt(line.get("quantity"), "quantity");

            FoodItem item = restaurant.findItemById(itemId).orElseThrow(
                    () -> new IllegalArgumentException("Item " + itemId + " is not on this menu"));
            cart.add(item, quantity);
        }
        return cart;
    }

    private static String optionalString(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value instanceof String ? (String) value : null;
    }

    private static Map<String, Object> billJson(Bill bill) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("subtotal", bill.getSubtotal());
        m.put("discount", bill.getDiscount());
        m.put("tax", bill.getTax());
        m.put("deliveryFee", bill.getDeliveryFee());
        m.put("total", bill.getTotal());
        return m;
    }
}