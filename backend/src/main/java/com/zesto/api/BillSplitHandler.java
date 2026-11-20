package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.service.BillSplitter;
import com.zesto.util.JsonParser;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends BaseHandler)
 *   - Polymorphism & Encapsulation
 *   - JSON DTO parsing and mapping
 *
 * Endpoint: POST /bill-split
 * Request:
 *   {
 *     "total": 628.50,
 *     "people": ["Anay", "Rohan", "Sneha"]
 *   }
 * or
 *   {
 *     "subtotal": 550.00,
 *     "additionalCharges": 78.50,
 *     "personItems": [
 *        { "name": "Anay", "itemTotal": 240.00 },
 *        { "name": "Rohan", "itemTotal": 190.00 },
 *        { "name": "Sneha", "itemTotal": 120.00 }
 *     ]
 *   }
 */
public class BillSplitHandler extends BaseHandler {

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, error("Method not allowed. Use POST."));
            return;
        }

        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
        BillSplitter.SplitResult result;

        if (body.containsKey("personItems")) {
            double subtotal = Double.parseDouble(String.valueOf(body.getOrDefault("subtotal", 0.0)));
            double additional = Double.parseDouble(String.valueOf(body.getOrDefault("additionalCharges", 0.0)));
            Object itemsObj = body.get("personItems");
            List<Map<String, Object>> personItems = new ArrayList<>();
            if (itemsObj instanceof List<?> list) {
                for (Object o : list) {
                    if (o instanceof Map<?, ?> m) {
                        Map<String, Object> casted = new LinkedHashMap<>();
                        m.forEach((k, v) -> casted.put(String.valueOf(k), v));
                        personItems.add(casted);
                    }
                }
            }
            result = BillSplitter.splitItemized(subtotal, additional, personItems);
        } else {
            double total = Double.parseDouble(String.valueOf(body.getOrDefault("total", 0.0)));
            List<String> people = new ArrayList<>();
            Object peopleObj = body.get("people");
            if (peopleObj instanceof List<?> list) {
                for (Object o : list) {
                    people.add(String.valueOf(o));
                }
            }
            if (people.isEmpty()) {
                int count = body.containsKey("count") ? (int) Math.round(Double.parseDouble(String.valueOf(body.get("count")))) : 2;
                for (int i = 1; i <= count; i++) {
                    people.add("Person " + i);
                }
            }
            result = BillSplitter.splitEqually(total, people);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalAmount", result.getTotalAmount());
        out.put("splitType", result.getSplitType());
        out.put("shares", result.getShares());
        out.put("formattedSummary", result.getFormattedSummary());

        sendJson(exchange, 200, out);
    }
}
