package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.model.Cuisine;
import com.zesto.model.Restaurant;
import com.zesto.service.RestaurantService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RestaurantHandler extends BaseHandler {

    private final RestaurantService service;

    public RestaurantHandler(RestaurantService service) {
        this.service = service;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        if (!"GET".equals(exchange.getRequestMethod())) {
            sendJson(exchange, 405, error("Method not allowed"));
            return;
        }

        String idPart = exchange.getRequestURI().getPath()
                .substring("/restaurants".length()).replace("/", "");

        if (!idPart.isEmpty()) {
            Restaurant restaurant = service.getById(Integer.parseInt(idPart));
            sendJson(exchange, 200, JsonMapper.restaurant(restaurant, true));
            return;
        }

        Map<String, String> params = queryParams(exchange);
        String query = params.getOrDefault("q", "");
        String cuisineParam = params.getOrDefault("cuisine", "");

        List<Restaurant> result;
        if (!cuisineParam.isEmpty()) {
            Cuisine cuisine = Cuisine.valueOf(cuisineParam.toUpperCase());
            result = service.search(query, cuisine);
        } else {
            result = service.search(query);
        }

        List<Object> out = new ArrayList<>();
        for (Restaurant r : result) {
            out.add(JsonMapper.restaurant(r, false));
        }
        sendJson(exchange, 200, out);
    }
}