package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.model.FoodItem;
import com.zesto.model.Restaurant;
import com.zesto.service.RestaurantService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ItemHandler extends BaseHandler {

    private final RestaurantService service;

    public ItemHandler(RestaurantService service) {
        this.service = service;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        if (!"GET".equals(exchange.getRequestMethod())) {
            sendJson(exchange, 405, error("Method not allowed"));
            return;
        }

        String query = queryParams(exchange).getOrDefault("q", "").trim().toLowerCase();
        List<Object> out = new ArrayList<>();

        for (Restaurant restaurant : service.getSortedByRating()) {
            for (FoodItem item : restaurant.getMenu()) {
                if (query.isEmpty() || item.getName().toLowerCase().contains(query)) {
                    Map<String, Object> map = JsonMapper.foodItem(item);
                    map.put("restaurantId", restaurant.getId());
                    map.put("restaurantName", restaurant.getName());
                    out.add(map);
                }
            }
        }
        sendJson(exchange, 200, out);
    }
}