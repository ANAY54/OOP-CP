package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.service.RestaurantService;
import com.zesto.service.planner.GreedyStrategy;
import com.zesto.service.planner.KnapsackStrategy;
import com.zesto.service.planner.MealPlanner;
import com.zesto.util.JsonParser;

import java.util.Map;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends BaseHandler)
 *   - Strategy Pattern Invocation (selects Greedy vs Knapsack dynamically)
 *   - JSON Request Body Parsing and Validation
 *   - Separation of Concerns
 *
 * Endpoint: POST /meal-plan
 * Request Body:
 *   {
 *     "budget": 600,
 *     "people": 2,
 *     "diet": "veg",
 *     "maxSpice": 2,
 *     "strategy": "knapsack"
 *   }
 */
public class MealPlanHandler extends BaseHandler {

    private final RestaurantService restaurantService;

    public MealPlanHandler(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, error("Method not allowed. Use POST."));
            return;
        }

        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));

        double budget = 500.0;
        if (body.containsKey("budget")) {
            budget = Double.parseDouble(String.valueOf(body.get("budget")));
        }

        int people = 2;
        if (body.containsKey("people")) {
            people = (int) Math.round(Double.parseDouble(String.valueOf(body.get("people"))));
        }

        String diet = body.containsKey("diet") ? String.valueOf(body.get("diet")) : "veg";
        int maxSpice = 2;
        if (body.containsKey("maxSpice")) {
            maxSpice = (int) Math.round(Double.parseDouble(String.valueOf(body.get("maxSpice"))));
        }

        String strategyType = body.containsKey("strategy") ? String.valueOf(body.get("strategy")).toLowerCase() : "knapsack";

        MealPlanner planner = new MealPlanner(restaurantService);
        if ("greedy".equals(strategyType)) {
            planner.setStrategy(new GreedyStrategy());
        } else {
            planner.setStrategy(new KnapsackStrategy());
        }

        Map<String, Object> result = planner.planMeal(budget, people, diet, maxSpice);
        sendJson(exchange, 200, result);
    }
}
