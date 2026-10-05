package com.zesto.service;

import com.zesto.model.Customer;

import java.util.HashMap;
import java.util.Map;

public class CustomerService {

    private final Map<String, Customer> customers = new HashMap<>();

    public Customer loginOrRegister(String name, String email) {
        String key = email.trim().toLowerCase();
        return customers.computeIfAbsent(key, k -> new Customer(name, email));
    }

    public Customer getByEmail(String email) {
        String key = email == null ? "" : email.trim().toLowerCase();
        Customer customer = customers.get(key);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found. Please log in first");
        }
        return customer;
    }
}