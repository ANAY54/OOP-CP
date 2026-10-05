package com.zesto.service;

import com.zesto.model.Customer;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS:
 *   - Encapsulation (private map, public API)
 *   - Collections (HashMap)
 *   - Composition (uses PersistenceService)
 *   - File Persistence (loads data on startup, saves on every change)
 *   - Lambda (computeIfAbsent)
 */
public class CustomerService {

    private final Map<String, Customer> customers = new HashMap<>();

    public CustomerService() {
        loadFromDisk();
    }

    // ------------------------------------------------------------------ persistence
    private void loadFromDisk() {
        List<Map<String, String>> saved = PersistenceService.loadCustomers();
        for (Map<String, String> m : saved) {
            try {
                String name    = m.getOrDefault("name",    "Unknown");
                String email   = m.getOrDefault("email",   "");
                String address = m.getOrDefault("address", "Not set");
                int    points  = Integer.parseInt(m.getOrDefault("loyaltyPoints", "0"));

                if (email.isEmpty()) continue;
                Customer c = new Customer(name, email, address);
                for (int i = 0; i < points; i++) c.addLoyaltyPoints(1); // restore points
                customers.put(email.toLowerCase(), c);
            } catch (Exception ignored) { /* skip malformed entry */ }
        }
    }

    private void persist() {
        PersistenceService.saveCustomers(customers);
    }

    // ------------------------------------------------------------------ public API
    public Customer loginOrRegister(String name, String email) {
        String key = email.trim().toLowerCase();
        boolean isNew = !customers.containsKey(key);
        Customer c = customers.computeIfAbsent(key,
                k -> new Customer(name, email));   // lambda as function argument
        if (isNew) persist();
        return c;
    }

    public Customer getByEmail(String email) {
        String key = email == null ? "" : email.trim().toLowerCase();
        Customer customer = customers.get(key);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found. Please log in first");
        }
        return customer;
    }

    public Customer updateAddress(String email, String address) {
        Customer customer = getByEmail(email);
        if (address == null || address.trim().isEmpty()) {
            throw new IllegalArgumentException("Address cannot be empty");
        }
        customer.setAddress(address.trim());
        persist();
        return customer;
    }
}