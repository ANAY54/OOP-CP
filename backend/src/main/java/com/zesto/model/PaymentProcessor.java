package com.zesto.model;

/**
 * OOP CONCEPTS: Interface, Polymorphism, Method contract
 *
 * PaymentProcessor defines the contract every payment method must fulfil.
 * At runtime, OrderService holds a reference to this interface — it doesn't
 * care whether it's UPI, Card or Cash (runtime polymorphism).
 */
public interface PaymentProcessor {

    /**
     * Validate the payment details and throw a ZestoException subclass if
     * the details are invalid (e.g. card number too short).
     *
     * @param amount the total amount to be charged
     * @throws com.zesto.exception.ZestoException if validation fails
     */
    void validate(double amount);

    /**
     * Process the payment.  Returns a transaction reference string.
     */
    String process(double amount);

    /** Human-readable name shown in receipts. */
    String getDisplayName();
}
