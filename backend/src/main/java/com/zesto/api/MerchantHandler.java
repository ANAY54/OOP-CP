package com.zesto.api;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.model.BusinessOwner;
import com.zesto.model.BusinessType;
import com.zesto.model.Cuisine;
import com.zesto.model.FoodItem;
import com.zesto.model.Order;
import com.zesto.model.PuneArea;
import com.zesto.model.Restaurant;
import com.zesto.service.MerchantAnalytics;
import com.zesto.service.MerchantService;
import com.zesto.service.OrderService;
import com.zesto.util.JsonParser;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance & Template Method Pattern (extends BaseHandler, implements process())
 *   - Dependency Injection (MerchantService & OrderService injected via constructor)
 *   - Encapsulation (clean HTTP routing for onboarding, OTP verification, menu CRUD & analytics)
 *   - Polymorphism (delegates FoodItem creation & Order progression to domain services)
 */
public class MerchantHandler extends BaseHandler {

    private final MerchantService merchantService;
    private final OrderService orderService;

    public MerchantHandler(MerchantService merchantService, OrderService orderService) {
        this.merchantService = merchantService;
        this.orderService = orderService;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if ("GET".equals(method) && path.endsWith("/meta")) {
            handleMeta(exchange);
            return;
        }
        if ("GET".equals(method) && path.endsWith("/dashboard")) {
            handleDashboard(exchange);
            return;
        }
        if ("POST".equals(method) && path.endsWith("/login")) {
            handleLogin(exchange);
            return;
        }
        if ("POST".equals(method) && path.endsWith("/verify/request")) {
            handleVerifyRequest(exchange);
            return;
        }
        if ("POST".equals(method) && path.endsWith("/verify/confirm")) {
            handleVerifyConfirm(exchange);
            return;
        }
        if ("POST".equals(method) && path.endsWith("/business")) {
            handleUpdateBusiness(exchange);
            return;
        }
        if ("POST".equals(method) && path.endsWith("/items/delete")) {
            handleDeleteItem(exchange);
            return;
        }
        if ("POST".equals(method) && path.endsWith("/items")) {
            handleAddItem(exchange);
            return;
        }
        if ("POST".equals(method) && path.endsWith("/orders/advance")) {
            handleAdvanceOrder(exchange);
            return;
        }

        sendJson(exchange, 404, error("Unknown merchant endpoint: " + method + " " + path));
    }

    private void handleMeta(HttpExchange exchange) throws Exception {
        Map<String, Object> out = new LinkedHashMap<>();

        List<Object> areas = new ArrayList<>();
        for (PuneArea area : PuneArea.values()) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("key", area.name());
            a.put("label", area.getLabel());
            a.put("latitude", area.getLatitude());
            a.put("longitude", area.getLongitude());
            areas.add(a);
        }
        out.put("areas", areas);

        List<Object> types = new ArrayList<>();
        for (BusinessType type : BusinessType.values()) {
            Map<String, Object> t = new LinkedHashMap<>();
            t.put("key", type.name());
            t.put("label", type.getDisplayName());
            t.put("badge", type.getDefaultBadge());
            t.put("icon", type.getIconName());
            types.add(t);
        }
        out.put("businessTypes", types);

        List<Object> cuisines = new ArrayList<>();
        for (Cuisine c : Cuisine.values()) {
            Map<String, Object> cm = new LinkedHashMap<>();
            cm.put("key", c.name());
            cm.put("label", c.getDisplayName());
            cuisines.add(cm);
        }
        out.put("cuisines", cuisines);

        sendJson(exchange, 200, out);
    }

    private void handleLogin(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
        String name = requireString(body, "name");
        String email = requireString(body, "email");

        BusinessOwner owner = merchantService.loginOrRegister(name, email);
        Optional<Restaurant> rest = merchantService.getRestaurantForOwner(owner.getEmail());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("owner", JsonMapper.businessOwner(owner));
        out.put("restaurant", rest.map(r -> JsonMapper.restaurant(r, true)).orElse(null));
        sendJson(exchange, 200, out);
    }

    private void handleDashboard(HttpExchange exchange) throws Exception {
        String email = queryParams(exchange).get("email");
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("'email' query param is required");
        }

        BusinessOwner owner = merchantService.getOwnerByEmail(email);
        Optional<Restaurant> restOpt = merchantService.getRestaurantForOwner(owner.getEmail());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("owner", JsonMapper.businessOwner(owner));
        if (restOpt.isPresent()) {
            Restaurant r = restOpt.get();
            List<Order> restOrders = orderService.getOrdersForRestaurant(r.getId());
            List<Object> orderMaps = new ArrayList<>();
            for (Order o : restOrders) {
                orderMaps.add(JsonMapper.order(o));
            }
            MerchantAnalytics analytics = MerchantAnalytics.compute(restOrders);

            out.put("restaurant", JsonMapper.restaurant(r, true));
            out.put("orders", orderMaps);
            out.put("analytics", analytics.toMap());
        } else {
            out.put("restaurant", null);
            out.put("orders", new ArrayList<>());
            out.put("analytics", MerchantAnalytics.compute(List.of()).toMap());
        }
        sendJson(exchange, 200, out);
    }

    private void handleVerifyRequest(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
        String email = requireString(body, "email");
        String phone = requireString(body, "phone");
        String businessName = requireString(body, "businessName");
        String fssai = optionalString(body, "fssaiLicense", "");

        String otp = merchantService.requestVerificationOtp(email, phone, businessName, fssai);
        BusinessOwner owner = merchantService.getOwnerByEmail(email);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("otpSent", true);
        out.put("verificationCode", otp);
        out.put("fssaiLicense", owner.getFssaiLicense());
        out.put("message", "6-digit verification code sent to +91 " + owner.getPhone());
        sendJson(exchange, 200, out);
    }

    private void handleVerifyConfirm(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
        String email = requireString(body, "email");
        String otp = requireString(body, "otp");
        String businessName = requireString(body, "businessName");
        String businessType = optionalString(body, "businessType", "HOME_CHEF");
        String cuisine = optionalString(body, "cuisine", "NORTH_INDIAN");
        String areaKey = optionalString(body, "areaKey", "FC_ROAD");
        String address = optionalString(body, "address", "");
        int priceForTwo = optionalInt(body, "priceForTwo", 300);
        int deliveryTimeMin = optionalInt(body, "deliveryTimeMin", 25);
        String fssai = optionalString(body, "fssaiLicense", "");
        String phone = optionalString(body, "phone", "");
        String imageUrl = optionalString(body, "imageUrl", "");
        boolean pureVeg = Boolean.TRUE.equals(body.get("pureVeg"));

        Restaurant r = merchantService.confirmVerificationAndCreateBusiness(
                email, otp, businessName, businessType, cuisine, areaKey, address,
                priceForTwo, deliveryTimeMin, fssai, phone, imageUrl, pureVeg);
        BusinessOwner owner = merchantService.getOwnerByEmail(email);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("owner", JsonMapper.businessOwner(owner));
        out.put("restaurant", JsonMapper.restaurant(r, true));
        sendJson(exchange, 201, out);
    }

    private void handleUpdateBusiness(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
        String email = requireString(body, "email");
        String businessName = optionalString(body, "businessName", "");
        String businessType = optionalString(body, "businessType", "HOME_CHEF");
        String cuisine = optionalString(body, "cuisine", "NORTH_INDIAN");
        String areaKey = optionalString(body, "areaKey", "FC_ROAD");
        String address = optionalString(body, "address", "");
        int priceForTwo = optionalInt(body, "priceForTwo", 300);
        int deliveryTimeMin = optionalInt(body, "deliveryTimeMin", 25);
        String badge = optionalString(body, "badge", "");
        String imageUrl = optionalString(body, "imageUrl", "");
        boolean openForOrders = !Boolean.FALSE.equals(body.get("openForOrders"));

        Restaurant r = merchantService.updateBusiness(
                email, businessName, businessType, cuisine, areaKey, address,
                priceForTwo, deliveryTimeMin, badge, imageUrl, openForOrders);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("restaurant", JsonMapper.restaurant(r, true));
        sendJson(exchange, 200, out);
    }

    private void handleAddItem(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
        String email = requireString(body, "email");
        String name = requireString(body, "name");
        double price = requireDouble(body, "price");
        String category = optionalString(body, "category", "VEG");
        String description = optionalString(body, "description", "");
        boolean jain = Boolean.TRUE.equals(body.get("jain"));
        int spiceLevel = optionalInt(body, "spiceLevel", 2);
        int sizeMl = optionalInt(body, "sizeMl", 300);
        boolean cold = !Boolean.FALSE.equals(body.get("cold"));
        String imageUrl = optionalString(body, "imageUrl", "");

        FoodItem created = merchantService.addMenuItem(
                email, name, price, category, description, jain, spiceLevel, sizeMl, cold, imageUrl);
        Restaurant r = merchantService.getRestaurantForOwner(email).orElseThrow();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("item", JsonMapper.foodItem(created));
        out.put("restaurant", JsonMapper.restaurant(r, true));
        sendJson(exchange, 201, out);
    }

    private void handleDeleteItem(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
        String email = requireString(body, "email");
        int itemId = toInt(body.get("itemId"), "itemId");

        merchantService.deleteMenuItem(email, itemId);
        Restaurant r = merchantService.getRestaurantForOwner(email).orElseThrow();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("deleted", true);
        out.put("restaurant", JsonMapper.restaurant(r, true));
        sendJson(exchange, 200, out);
    }

    private void handleAdvanceOrder(HttpExchange exchange) throws Exception {
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
        String email = requireString(body, "email");
        int orderId = toInt(body.get("orderId"), "orderId");

        Restaurant r = merchantService.getRestaurantForOwner(email)
                .orElseThrow(() -> new IllegalArgumentException("No verified business found for " + email));
        Order updated = orderService.advanceOrderForMerchant(orderId, r.getId());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("order", JsonMapper.order(updated));
        sendJson(exchange, 200, out);
    }

    private static String optionalString(Map<String, Object> body, String key, String fallback) {
        Object val = body.get(key);
        return (val instanceof String && !((String) val).trim().isEmpty()) ? ((String) val).trim() : fallback;
    }

    private static int optionalInt(Map<String, Object> body, String key, int fallback) {
        Object val = body.get(key);
        if (val instanceof Number) return ((Number) val).intValue();
        if (val instanceof String) {
            try { return Integer.parseInt(((String) val).trim()); } catch (NumberFormatException ignored) {}
        }
        return fallback;
    }

    private static double requireDouble(Map<String, Object> body, String key) {
        Object val = body.get(key);
        if (val instanceof Number) return ((Number) val).doubleValue();
        if (val instanceof String) {
            try { return Double.parseDouble(((String) val).trim()); } catch (NumberFormatException ignored) {}
        }
        throw new IllegalArgumentException("'" + key + "' must be a valid price number");
    }
}
