package com.zesto.service;

import com.zesto.exception.EmptyCartException;
import com.zesto.exception.InvalidCouponException;
import com.zesto.model.*;

import java.util.List;
import java.util.stream.Collectors;

public class OrderService {

    private static final long STATUS_STEP_DELAY_MS = 15_000;

    private final Repository<Order> orders = new Repository<>();
    private final OfferService offerService;

    public OrderService(OfferService offerService) {
        this.offerService = offerService;
    }

    private Offer resolveOffer(Cart cart, String couponCode) throws InvalidCouponException {
        if (couponCode == null || couponCode.trim().isEmpty()) {
            return null;
        }
        Offer offer = offerService.findByCode(couponCode);
        if (!offer.isApplicable(cart.getSubtotal())) {
            throw new InvalidCouponException(offer.getCode(),
                    "add items worth Rs." + (int) offer.getMinOrder() + " or more");
        }
        return offer;
    }

    public Bill previewBill(Customer customer, Cart cart, String couponCode)
            throws EmptyCartException, InvalidCouponException {

        if (cart.isEmpty()) {
            throw new EmptyCartException();
        }
        Offer offer = resolveOffer(cart, couponCode);
        double couponDiscount = offer == null ? 0 : offer.calculateDiscount(cart.getSubtotal());
        return Bill.calculate(customer, cart.getSubtotal(), couponDiscount);
    }

    public Order placeOrder(Customer customer, Cart cart, String couponCode, PaymentMode mode)
            throws EmptyCartException, InvalidCouponException {

        if (cart.isEmpty()) {
            throw new EmptyCartException();
        }

        Offer offer = resolveOffer(cart, couponCode);
        double couponDiscount = offer == null ? 0 : offer.calculateDiscount(cart.getSubtotal());
        String appliedCode = offer == null ? null : offer.getCode();

        Order order = new Order(customer, cart, couponDiscount, appliedCode, mode);
        orders.save(order);
        customer.addLoyaltyPoints((int) (order.getTotal() / 10), "Order #" + order.getId());
        startTracking(order);
        return order;
    }

    private void startTracking(Order order) {
        Thread worker = new Thread(
                new OrderProgressTask(order, STATUS_STEP_DELAY_MS),
                "order-" + order.getId());
        worker.setDaemon(true);
        worker.start();
    }

    public List<Order> getAll() {
        return orders.findAll();
    }

    public List<Order> getOrdersFor(Customer customer) {
        return orders.findAll().stream()
                .filter(o -> o.getCustomer().equals(customer))
                .collect(Collectors.toList());
    }
}