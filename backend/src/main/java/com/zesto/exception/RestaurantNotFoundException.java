package com.zesto.exception;

public class RestaurantNotFoundException extends ZestoException {
    public RestaurantNotFoundException(int id) {
        super("No restaurant found with id " + id);
    }
}