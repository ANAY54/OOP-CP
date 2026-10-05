package com.zesto.model;

/**
 * OOP CONCEPTS: Interface Implementation, Polymorphism, Anonymous Class usage
 *
 * Cash-on-delivery payment.  No validation is needed (cash is always valid).
 * This class also demonstrates how to create a PaymentProcessor via an
 * anonymous class — see PaymentProcessorFactory.createAnonymousCashProcessor().
 */
public class CashPayment implements PaymentProcessor {

    @Override
    public void validate(double amount) {
        // Cash is always valid — no card number, no UPI ID required.
    }

    @Override
    public String process(double amount) {
        return "COD-" + System.currentTimeMillis();
    }

    @Override
    public String getDisplayName() {
        return "Cash on Delivery";
    }
}
