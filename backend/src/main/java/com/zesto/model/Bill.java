package com.zesto.model;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Encapsulation (immutable value object, all fields private final, getters only)
 *   - Method Overloading (calculate with default delivery fee vs custom distance-based delivery fee)
 *   - Financial Precision (rounding helper ensures exact 2-decimal precision without rounding drift)
 *   - Static Factory Method Pattern (Bill.calculate() encapsulates bill construction logic)
 */
public class Bill {

    public static final double DEFAULT_DELIVERY_FEE = 30.0;
    public static final double TAX_RATE = 0.05;

    private final double subtotal;
    private final double discount;
    private final double tax;
    private final double deliveryFee;
    private final double total;

    private Bill(double subtotal, double discount, double tax, double deliveryFee, double total) {
        this.subtotal = subtotal;
        this.discount = discount;
        this.tax = tax;
        this.deliveryFee = deliveryFee;
        this.total = total;
    }

    public static Bill calculate(Customer customer, double rawSubtotal, double couponDiscount) {
        return calculate(customer, rawSubtotal, couponDiscount, DEFAULT_DELIVERY_FEE);
    }

    public static Bill calculate(Customer customer, double rawSubtotal, double couponDiscount, double deliveryFee) {
        double subtotal = round(rawSubtotal);
        double afterCoupon = Math.max(0, subtotal - couponDiscount);
        double afterLoyalty = customer.applyDiscount(afterCoupon);
        double discount = round(subtotal - afterLoyalty);
        double tax = round(afterLoyalty * TAX_RATE);
        double validFee = Math.max(0, round(deliveryFee));
        double total = round(afterLoyalty + tax + validFee);
        return new Bill(subtotal, discount, tax, validFee, total);
    }

    public static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public double getSubtotal() { return subtotal; }
    public double getDiscount() { return discount; }
    public double getTax() { return tax; }
    public double getDeliveryFee() { return deliveryFee; }
    public double getTotal() { return total; }

    @Override
    public String toString() {
        return String.format("Bill[subtotal=%.2f, discount=%.2f, tax=%.2f, delivery=%.2f, total=%.2f]",
                subtotal, discount, tax, deliveryFee, total);
    }
}
