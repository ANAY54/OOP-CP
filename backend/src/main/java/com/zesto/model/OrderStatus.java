package com.zesto.model;

/**
 * OOP CONCEPTS:
 *   - Enum with behaviour (next() method transitions between states)
 *   - State Machine pattern (each constant represents a state)
 *   - Encapsulation (label private, getLabel() public)
 *   - Constructor (enum constructor sets label)
 */
public enum OrderStatus {
    PLACED("Order placed"),
    PREPARING("Restaurant is preparing your food"),
    OUT_FOR_DELIVERY("On the way"),
    DELIVERED("Delivered"),
    CANCELLED("Cancelled");

    private final String label;

    OrderStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public OrderStatus next() {
        switch (this) {
            case PLACED: return PREPARING;
            case PREPARING: return OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY: return DELIVERED;
            default: return this;
        }
    }
}