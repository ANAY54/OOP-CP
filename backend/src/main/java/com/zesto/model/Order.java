package com.zesto.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class Order implements Identifiable {

    private static int idCounter = 5000;

    public static class OrderLine {
        private final String itemName;
        private final double unitPrice;
        private final int quantity;

        public OrderLine(String itemName, double unitPrice, int quantity) {
            this.itemName = itemName;
            this.unitPrice = unitPrice;
            this.quantity = quantity;
        }

        public String getItemName() { return itemName; }
        public double getUnitPrice() { return unitPrice; }
        public int getQuantity() { return quantity; }

        public double getLineTotal() {
            return unitPrice * quantity;
        }

        @Override
        public String toString() {
            return quantity + " x " + itemName + " = Rs." + String.format("%.2f", getLineTotal());
        }
    }

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
    private volatile OrderStatus status;

    public Order(Customer customer, Cart cart, double couponDiscount,
                 String couponCode, PaymentMode paymentMode) {
        this.id = ++idCounter;
        this.customer = customer;
        this.restaurant = cart.getRestaurant();
        this.couponCode = couponCode;
        this.paymentMode = paymentMode;
        this.status = OrderStatus.PLACED;

        for (Map.Entry<FoodItem, Integer> entry : cart.getItems().entrySet()) {
            FoodItem item = entry.getKey();
            lines.add(new OrderLine(item.getName(), item.calculatePrice(), entry.getValue()));
        }

        Bill bill = Bill.calculate(customer, cart.getSubtotal(), couponDiscount);
        this.subtotal = bill.getSubtotal();
        this.discount = bill.getDiscount();
        this.tax = bill.getTax();
        this.deliveryFee = bill.getDeliveryFee();
        this.total = bill.getTotal();
    }

    public synchronized void advanceStatus() {
        status = status.next();
    }

    public synchronized void cancel() {
        if (status != OrderStatus.PLACED) {
            throw new IllegalStateException("Order can no longer be cancelled");
        }
        status = OrderStatus.CANCELLED;
    }

    @Override
    public int getId() { return id; }
    public Customer getCustomer() { return customer; }
    public Restaurant getRestaurant() { return restaurant; }
    public List<OrderLine> getLines() { return Collections.unmodifiableList(lines); }
    public double getSubtotal() { return subtotal; }
    public double getDiscount() { return discount; }
    public double getTax() { return tax; }
    public double getDeliveryFee() { return deliveryFee; }
    public double getTotal() { return total; }
    public String getCouponCode() { return couponCode; }
    public PaymentMode getPaymentMode() { return paymentMode; }
    public OrderStatus getStatus() { return status; }

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
        return sb.toString();
    }
}