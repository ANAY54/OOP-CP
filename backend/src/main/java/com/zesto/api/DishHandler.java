package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.model.FoodItem;
import com.zesto.service.RestaurantService;

import java.util.Map;
import java.util.Optional;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends BaseHandler for standard JSON REST responses)
 *   - Composition (delegates to RestaurantService and DataCatalogService)
 *   - Polymorphism (overrides abstract process() method)
 *   - Defensive Programming (graceful 404 handling with structured error payloads)
 *
 * Exposes:
 *   GET /dishes/{id}/recipe  -> Returns ingredients, measures, instructions, and YouTube link
 *   GET /dishes/{id}         -> Returns dish details
 */
public class DishHandler extends BaseHandler {

    private final RestaurantService restaurantService;

    public DishHandler(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, error("Method not allowed. Use GET."));
            return;
        }

        String path = exchange.getRequestURI().getPath();
        // Expected format: /dishes/{id} or /dishes/{id}/recipe
        String sub = path.substring("/dishes".length());
        if (sub.startsWith("/")) {
            sub = sub.substring(1);
        }

        String[] parts = sub.split("/");
        if (parts.length == 0 || parts[0].isEmpty()) {
            sendJson(exchange, 400, error("Missing dish id in path: /dishes/{id}/recipe"));
            return;
        }

        int dishId;
        try {
            dishId = Integer.parseInt(parts[0]);
        } catch (NumberFormatException e) {
            sendJson(exchange, 400, error("Invalid dish id: " + parts[0]));
            return;
        }

        boolean isRecipeRequest = parts.length > 1 && "recipe".equalsIgnoreCase(parts[1]);

        if (isRecipeRequest) {
            Map<String, Object> recipe = restaurantService.getCatalogService().getDishRecipe(dishId);
            if (recipe == null || recipe.isEmpty()) {
                // If not cached by MealDB id, look up dish name and construct fallback
                Optional<FoodItem> dishOpt = restaurantService.findDishById(dishId);
                if (dishOpt.isPresent()) {
                    FoodItem dish = dishOpt.get();
                    recipe = restaurantService.getCatalogService().getDishRecipe(dish.getId());
                }
            }

            if (recipe == null || recipe.isEmpty()) {
                sendJson(exchange, 404, error("Recipe not found for dish #" + dishId));
                return;
            }

            sendJson(exchange, 200, recipe);
        } else {
            Optional<FoodItem> dishOpt = restaurantService.findDishById(dishId);
            if (dishOpt.isEmpty()) {
                sendJson(exchange, 404, error("Dish not found: #" + dishId));
                return;
            }
            sendJson(exchange, 200, JsonMapper.foodItem(dishOpt.get()));
        }
    }
}
