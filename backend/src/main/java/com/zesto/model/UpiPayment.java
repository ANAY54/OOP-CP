package com.zesto.model;

import com.zesto.exception.InvalidPaymentException;

/**
 * OOP CONCEPTS: Interface Implementation, Polymorphism, Encapsulation
 *
 * Concrete UPI payment processor.  Validates that a VPA (UPI ID) contains
 * the '@' character.  Demonstrates implementing an interface and runtime
 * polymorphism: PaymentProcessor ref = new UpiPayment(...).
 */
public class UpiPayment implements PaymentProcessor {

    private final String vpa; // Virtual Payment Address, e.g. "user@paytm"

    public UpiPayment(String vpa) {
        this.vpa = vpa == null ? "" : vpa.trim();
    }

    @Override
    public void validate(double amount) {
        if (vpa.isEmpty()) {
            throw new InvalidPaymentException("UPI", "VPA (UPI ID) cannot be empty");
        }
        if (!vpa.contains("@")) {
            throw new InvalidPaymentException("UPI", "VPA must be in the format user@bank");
        }
    }

    @Override
    public String process(double amount) {
        // In a real app this would call a payment gateway SDK.
        return "UPI-" + System.currentTimeMillis();
    }

    @Override
    public String getDisplayName() {
        return "UPI (" + vpa + ")";
    }
}
