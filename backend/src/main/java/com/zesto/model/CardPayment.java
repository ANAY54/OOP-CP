package com.zesto.model;

import com.zesto.exception.InvalidPaymentException;

/**
 * OOP CONCEPTS: Interface Implementation, Polymorphism, Encapsulation,
 *               Constructor Overloading
 *
 * Concrete Card payment processor.  Validates that the card number is exactly
 * 16 digits and CVV is 3 digits.  Demonstrates interface implementation and
 * overloaded constructors.
 */
public class CardPayment implements PaymentProcessor {

    private static final int CARD_LENGTH = 16;
    private static final int CVV_LENGTH  = 3;

    private final String cardNumber; // Last 4 digits stored for display
    private final String cvv;
    private final String holderName;

    /** Full constructor. */
    public CardPayment(String cardNumber, String cvv, String holderName) {
        this.cardNumber  = cardNumber  == null ? "" : cardNumber.replaceAll("\\s", "");
        this.cvv         = cvv         == null ? "" : cvv.trim();
        this.holderName  = holderName  == null ? "" : holderName.trim();
    }

    /** Convenience constructor (no holder name). */
    public CardPayment(String cardNumber, String cvv) {
        this(cardNumber, cvv, "Card holder");
    }

    @Override
    public void validate(double amount) {
        if (cardNumber.length() != CARD_LENGTH) {
            throw new InvalidPaymentException("CARD", "card number", cardNumber.length(), CARD_LENGTH);
        }
        if (cvv.length() != CVV_LENGTH) {
            throw new InvalidPaymentException("CARD", "CVV", cvv.length(), CVV_LENGTH);
        }
        if (holderName.isEmpty()) {
            throw new InvalidPaymentException("CARD", "Holder name cannot be empty");
        }
    }

    @Override
    public String process(double amount) {
        return "CARD-" + System.currentTimeMillis();
    }

    @Override
    public String getDisplayName() {
        String last4 = cardNumber.length() >= 4
                ? cardNumber.substring(cardNumber.length() - 4) : "????";
        return "Card ending " + last4;
    }
}
