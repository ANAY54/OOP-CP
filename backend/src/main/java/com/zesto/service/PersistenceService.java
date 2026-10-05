package com.zesto.service;

import com.zesto.model.Customer;
import com.zesto.util.JsonWriter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS:
 *   - File I/O (java.io / java.nio.file) — demonstrates file persistence
 *   - Encapsulation (private helper methods)
 *   - Static methods (utility-style load/save)
 *   - Collections (List<Map<String,Object>>)
 *   - Serialisation using the project's own JsonWriter (no external libraries)
 *
 * Saves and loads the CustomerService map to/from a JSON file so that
 * customer data (loyalty points, address) survives server restarts.
 * The file is written with our own JsonWriter — no Gson or Jackson.
 */
public class PersistenceService {

    /** Where customer data is saved (relative to the working directory). */
    private static final Path CUSTOMERS_FILE = Paths.get("zesto_customers.json");

    // ------------------------------------------------------------------ save
    /**
     * Serialises all customers to zesto_customers.json using JsonWriter.
     * Called by CustomerService after every mutating operation.
     */
    public static void saveCustomers(Map<String, Customer> customers) {
        try {
            List<Object> list = new ArrayList<>();
            // Lambda forEach — demonstrates lambda with file I/O
            customers.forEach((email, c) -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name",          c.getName());
                m.put("email",         c.getEmail());
                m.put("address",       c.getAddress());
                m.put("loyaltyPoints", c.getLoyaltyPoints());
                list.add(m);
            });
            String json = JsonWriter.toJson(list);
            Files.writeString(CUSTOMERS_FILE, json,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING);
            System.out.println("[Persistence] Saved " + customers.size() + " customer(s).");
        } catch (IOException e) {
            System.err.println("[Persistence] Could not save customers: " + e.getMessage());
        }
    }

    // ------------------------------------------------------------------ load
    /**
     * Loads customers from disk at server start.  If the file does not exist,
     * returns an empty list (first-run scenario).
     *
     * Parsing is done manually — the file format is simple enough that we
     * can use String.split() line-by-line without an external JSON parser.
     * This satisfies the "no external libraries" rule while still demonstrating
     * file I/O and basic text parsing.
     */
    public static List<Map<String, String>> loadCustomers() {
        List<Map<String, String>> result = new ArrayList<>();
        if (!Files.exists(CUSTOMERS_FILE)) {
            System.out.println("[Persistence] No saved customer file found — starting fresh.");
            return result;
        }
        try {
            String json = Files.readString(CUSTOMERS_FILE, StandardCharsets.UTF_8).trim();
            // Very simple parser for our own format: [{...},{...}]
            // Remove outer array brackets
            if (json.startsWith("[")) json = json.substring(1);
            if (json.endsWith("]")) json  = json.substring(0, json.length() - 1);

            // Split on },{  to get individual object strings
            String[] objects = json.split("\\},\\s*\\{");
            for (String obj : objects) {
                obj = obj.replaceAll("[\\{\\}]", "").trim();
                if (obj.isEmpty()) continue;
                Map<String, String> map = new LinkedHashMap<>();
                for (String pair : obj.split(",(?=\")")) {
                    String[] kv = pair.split(":", 2);
                    if (kv.length == 2) {
                        String key = kv[0].trim().replaceAll("\"", "");
                        String val = kv[1].trim().replaceAll("\"", "");
                        map.put(key, val);
                    }
                }
                if (!map.isEmpty()) result.add(map);
            }
            System.out.println("[Persistence] Loaded " + result.size() + " customer(s) from disk.");
        } catch (IOException e) {
            System.err.println("[Persistence] Could not read customers file: " + e.getMessage());
        }
        return result;
    }
}
