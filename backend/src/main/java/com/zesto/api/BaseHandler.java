package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.zesto.exception.RestaurantNotFoundException;
import com.zesto.exception.ZestoException;
import com.zesto.util.JsonWriter;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

public abstract class BaseHandler implements HttpHandler {

    protected abstract void process(HttpExchange exchange) throws Exception;

    @Override
    public final void handle(HttpExchange exchange) throws IOException {
        try {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            process(exchange);
        } catch (RestaurantNotFoundException e) {
            sendJson(exchange, 404, error(e.getMessage()));
        } catch (ZestoException | IllegalArgumentException | IllegalStateException e) {
            sendJson(exchange, 400, error(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            sendJson(exchange, 500, error("Something went wrong on the server"));
        } finally {
            exchange.close();
        }
    }

    protected void sendJson(HttpExchange exchange, int status, Object body) throws IOException {
        byte[] bytes = JsonWriter.toJson(body).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    protected static Map<String, Object> error(String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("error", message);
        return map;
    }

    protected String readBody(HttpExchange exchange) throws IOException {
        return new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    }

    protected Map<String, String> queryParams(HttpExchange exchange) {
        Map<String, String> params = new LinkedHashMap<>();
        String query = exchange.getRequestURI().getRawQuery();
        if (query == null || query.isEmpty()) {
            return params;
        }
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
            String value = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
            params.put(key, value);
        }
        return params;
    }

    protected static String requireString(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (!(value instanceof String) || ((String) value).trim().isEmpty()) {
            throw new IllegalArgumentException("'" + key + "' is required");
        }
        return ((String) value).trim();
    }

    protected static int toInt(Object value, String field) {
        if (!(value instanceof Number)) {
            throw new IllegalArgumentException("'" + field + "' must be a number");
        }
        return ((Number) value).intValue();
    }
}