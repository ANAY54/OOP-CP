package com.zesto.exception;

public class EmptyCartException extends ZestoException {
    public EmptyCartException() {
        super("Your cart is empty. Add items before placing an order");
    }
}