package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.model.Customer;
import com.zesto.model.Order;
import com.zesto.service.AchievementService;
import com.zesto.service.CustomerService;
import com.zesto.service.OrderService;

import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends BaseHandler)
 *   - Composition (uses CustomerService, OrderService, AchievementService)
 *   - Encapsulation
 *
 * Endpoint: GET /achievements?email=...
 */
public class AchievementHandler extends BaseHandler {

    private final CustomerService customerService;
    private final OrderService orderService;
    private final AchievementService achievementService;

    public AchievementHandler(CustomerService customerService, OrderService orderService, AchievementService achievementService) {
        this.customerService = customerService;
        this.orderService = orderService;
        this.achievementService = achievementService;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, error("Method not allowed. Use GET."));
            return;
        }

        String email = queryParams(exchange).get("email");
        if (email == null || email.trim().isEmpty()) {
            sendJson(exchange, 400, error("Missing query parameter: email"));
            return;
        }

        Customer customer = customerService.getByEmail(email);
        List<Order> orders = orderService.getOrdersFor(customer);
        List<Map<String, Object>> badges = achievementService.evaluateForCustomer(customer, orders);

        sendJson(exchange, 200, badges);
    }
}
