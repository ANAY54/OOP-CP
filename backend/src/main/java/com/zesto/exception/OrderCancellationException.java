package com.zesto.exception;

/**
 * OOP CONCEPTS: Custom Exception, Inheritance (extends ZestoException)
 *
 * Thrown when a client attempts to cancel an order that is not in PLACED status.
 */
public class OrderCancellationException extends ZestoException {

    private final int orderId;

    public OrderCancellationException(int orderId) {
        super("Order #" + orderId + " cannot be cancelled — it is already being prepared or delivered");
        this.orderId = orderId;
    }

    public OrderCancellationException(int orderId, String reason) {
        super("Order #" + orderId + " cannot be cancelled: " + reason);
        this.orderId = orderId;
    }

    public int getOrderId() {
        return orderId;
    }
}
