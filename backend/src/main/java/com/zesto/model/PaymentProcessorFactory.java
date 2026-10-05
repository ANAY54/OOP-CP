package com.zesto.model;

/**
 * OOP CONCEPTS: Factory Pattern, Static Methods, Anonymous Class, Generics (generic method)
 *
 * Factory that creates the right PaymentProcessor for a given PaymentMode.
 * Also demonstrates:
 *   - An ANONYMOUS CLASS (createAnonymousCashProcessor) for viva
 *   - A GENERIC METHOD (wrap) for viva
 */
public final class PaymentProcessorFactory {

    private PaymentProcessorFactory() { /* utility class */ }

    /**
     * Returns the correct processor for the given PaymentMode.
     * Defaults (no card/UPI details) work for COD and for quick previews.
     */
    public static PaymentProcessor forMode(PaymentMode mode) {
        switch (mode) {
            case UPI:              return new UpiPayment("user@zesto");   // default VPA for preview
            case CARD:             return new CardPayment("1234567890123456", "123", "Card User");
            case CASH_ON_DELIVERY: return new CashPayment();
            default:               return new CashPayment();
        }
    }

    /**
     * ANONYMOUS CLASS demonstration for viva.
     * Creates a PaymentProcessor that is a cash processor defined on-the-fly
     * without a named class.
     */
    public static PaymentProcessor createAnonymousCashProcessor() {
        return new PaymentProcessor() {          // <-- anonymous class
            @Override
            public void validate(double amount) { /* cash — always valid */ }

            @Override
            public String process(double amount) {
                return "ANON-COD-" + System.currentTimeMillis();
            }

            @Override
            public String getDisplayName() { return "Cash (anonymous)"; }
        };
    }

    /**
     * GENERIC METHOD demonstration for viva.
     * Wraps any PaymentProcessor so that it logs a message before processing.
     *
     * @param <P>  any type that implements PaymentProcessor
     * @param proc the original processor
     * @return a logging wrapper around proc
     */
    public static <P extends PaymentProcessor> PaymentProcessor wrap(P proc) {
        return new PaymentProcessor() {
            @Override
            public void validate(double amount) {
                proc.validate(amount);
            }

            @Override
            public String process(double amount) {
                String ref = proc.process(amount);
                System.out.println("[PaymentLog] " + proc.getDisplayName()
                        + " processed Rs." + amount + " → ref=" + ref);
                return ref;
            }

            @Override
            public String getDisplayName() {
                return proc.getDisplayName() + " [logged]";
            }
        };
    }
}
