package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.service.MoodScorer;
import com.zesto.service.RestaurantService;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends BaseHandler)
 *   - Composition (uses MoodScorer and RestaurantService)
 *   - Query Parameter Parsing & Validation
 *
 * Endpoint: GET /mood-dishes?mood=COMFORT
 */
public class MoodHandler extends BaseHandler {

    private final RestaurantService restaurantService;
    private final MoodScorer moodScorer = new MoodScorer();

    public MoodHandler(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, error("Method not allowed. Use GET."));
            return;
        }

        Map<String, String> params = queryParams(exchange);
        String moodRaw = params.getOrDefault("mood", "COMFORT");
        MoodScorer.Mood mood = MoodScorer.Mood.fromString(moodRaw);

        List<MoodScorer.ScoredDish> results = moodScorer.scoreDishesForMood(
                restaurantService.getAll(), mood, 10);

        List<Map<String, Object>> out = new ArrayList<>();
        for (MoodScorer.ScoredDish sd : results) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("dishId", sd.getItem().getId());
            m.put("dishName", sd.getItem().getName());
            m.put("dishPrice", sd.getItem().getPrice());
            m.put("dishType", sd.getItem().getType());
            m.put("dishImage", sd.getItem().getImageUrl());
            m.put("restaurantId", sd.getRestaurant().getId());
            m.put("restaurantName", sd.getRestaurant().getName());
            m.put("score", sd.getScore());
            m.put("matchReason", sd.getMatchReason());
            out.add(m);
        }

        sendJson(exchange, 200, out);
    }
}
