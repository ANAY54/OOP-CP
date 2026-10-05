package com.zesto.exception;

/**
 * OOP CONCEPTS: Custom Exception, Inheritance (extends ZestoException),
 * Constructor Overloading
 *
 * Thrown when card payment details fail validation rules.
 */
public class InvalidPaymentException extends ZestoException {

    /** Thrown when the card number length is wrong. */
    public InvalidPaymentException(String paymentMethod, String reason) {
        super("Payment validation failed for " + paymentMethod + ": " + reason);
    }

    /** Thrown with a numeric detail (e.g. card number length). */
    public InvalidPaymentException(String paymentMethod, String field, int found, int expected) {
        super("Payment validation failed for " + paymentMethod
                + ": " + field + " must be " + expected + " digits (got " + found + ")");
    }
}
