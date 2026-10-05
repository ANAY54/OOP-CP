package com.zesto.model;

import com.zesto.exception.OrderCancellationException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS:
 *   - Class, Encapsulation (private fields + public getters)
 *   - Static Nested Class (OrderLine)
 *   - Multithreading (volatile status, synchronized methods)
 *   - Collections (List<OrderLine>)
 *   - final fields (immutable bill values)
 *   - Identifiable interface implementation
 *   - Custom Exception (OrderCancellationException)
 */
public class Order implements Identifiable {

    private static int idCounter = 5000;

    // ------------------------------------------------------------------ inner static class
    /**
     * STATIC NESTED CLASS — for viva.
     * Represents a single line in the order receipt.
     * Declared static because it has no need to access the outer Order instance.
     */
    public static class OrderLine {
        private final String itemName;
        private final double unitPrice;
        private final int quantity;

        public OrderLine(String itemName, double unitPrice, int quantity) {
            this.itemName  = itemName;
            this.unitPrice = unitPrice;
            this.quantity  = quantity;
        }

        public String getItemName()   { return itemName; }
        public double getUnitPrice()  { return unitPrice; }
        public int    getQuantity()   { return quantity; }

        public double getLineTotal() {
            return unitPrice * quantity;
        }

        @Override
        public String toString() {
            return quantity + " x " + itemName + " = Rs." + String.format("%.2f", getLineTotal());
        }
    }

    // ------------------------------------------------------------------ fields
    private final int id;
    private final Customer customer;
    private final Restaurant restaurant;
    private final List<OrderLine> lines = new ArrayList<>();
    private final double subtotal;
    private final double discount;
    private final double tax;
    private final double deliveryFee;
    private final double total;
    private final String couponCode;
    private final PaymentMode paymentMode;

    /**
     * volatile: ensures the status value is always read from main memory, not
     * from a CPU cache — important because the OrderProgressTask thread writes
     * it while the HTTP handler thread reads it.
     */
    private volatile OrderStatus status;

    /** The assigned delivery partner (may be null if none is available). */
    private volatile DeliveryPartner deliveryPartner;

    // ------------------------------------------------------------------ constructor
    public Order(Customer customer, Cart cart, double couponDiscount,
                 String couponCode, PaymentMode paymentMode) {
        this.id          = ++idCounter;
        this.customer    = customer;
        this.restaurant  = cart.getRestaurant();
        this.couponCode  = couponCode;
        this.paymentMode = paymentMode;
        this.status      = OrderStatus.PLACED;

        for (Map.Entry<FoodItem, Integer> entry : cart.getItems().entrySet()) {
            FoodItem item = entry.getKey();
            lines.add(new OrderLine(item.getName(), item.calculatePrice(), entry.getValue()));
        }

        Bill bill       = Bill.calculate(customer, cart.getSubtotal(), couponDiscount);
        this.subtotal   = bill.getSubtotal();
        this.discount   = bill.getDiscount();
        this.tax        = bill.getTax();
        this.deliveryFee = bill.getDeliveryFee();
        this.total      = bill.getTotal();
    }

    // ------------------------------------------------------------------ state transitions
    /** Advances to the next status (thread-safe). */
    public synchronized void advanceStatus() {
        status = status.next();
    }

    /**
     * Cancels the order.  Throws {@link OrderCancellationException} if the order
     * is already being prepared or delivered — demonstrates custom exception usage.
     */
    public synchronized void cancel() throws com.zesto.exception.OrderCancellationException {
        if (status != OrderStatus.PLACED) {
            throw new OrderCancellationException(id);
        }
        status = OrderStatus.CANCELLED;
    }

    // ------------------------------------------------------------------ delivery partner
    public synchronized void assignDeliveryPartner(DeliveryPartner partner) {
        this.deliveryPartner = partner;
    }

    public DeliveryPartner getDeliveryPartner() {
        return deliveryPartner;
    }

    // ------------------------------------------------------------------ getters
    @Override public int        getId()           { return id; }
    public Customer    getCustomer()              { return customer; }
    public Restaurant  getRestaurant()            { return restaurant; }
    public List<OrderLine> getLines()             { return Collections.unmodifiableList(lines); }
    public double      getSubtotal()              { return subtotal; }
    public double      getDiscount()              { return discount; }
    public double      getTax()                   { return tax; }
    public double      getDeliveryFee()           { return deliveryFee; }
    public double      getTotal()                 { return total; }
    public String      getCouponCode()            { return couponCode; }
    public PaymentMode getPaymentMode()           { return paymentMode; }
    public OrderStatus getStatus()                { return status; }

    // ------------------------------------------------------------------ toString
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("ORDER #").append(id).append(" from ").append(restaurant.getName()).append("\n");
        for (OrderLine line : lines) {
            sb.append("  ").append(line).append("\n");
        }
        sb.append(String.format("  Subtotal: Rs.%.2f%n", subtotal));
        sb.append(String.format("  Discount: -Rs.%.2f%n", discount));
        sb.append(String.format("  Tax (5%%): Rs.%.2f%n", tax));
        sb.append(String.format("  Delivery: Rs.%.2f%n", deliveryFee));
        sb.append(String.format("  TOTAL:    Rs.%.2f%n", total));
        sb.append("  Status: ").append(status.getLabel());
        if (deliveryPartner != null) {
            sb.append("\n  Partner: ").append(deliveryPartner.getName())
              .append(" (").append(deliveryPartner.getVehicle()).append(")");
        }
        return sb.toString();
    }
}