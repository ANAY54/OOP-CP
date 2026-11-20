package com.zesto.exception;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends custom checked exception ZestoException)
 *   - Exception Handling (domain-specific failure for merchant onboarding & authorization)
 *   - Constructor Overloading (message-only vs detailed reason)
 */
public class MerchantVerificationException extends ZestoException {

    public MerchantVerificationException(String message) {
        super(message);
    }

    public MerchantVerificationException(String email, String reason) {
        super("Merchant verification failed for " + email + ": " + reason);
    }
}
