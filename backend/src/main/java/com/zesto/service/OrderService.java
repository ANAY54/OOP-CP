package com.zesto.service;

import com.zesto.exception.EmptyCartException;
import com.zesto.exception.InvalidCouponException;
import com.zesto.exception.OrderCancellationException;
import com.zesto.model.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * OOP CONCEPTS:
 *   - Composition (holds Repository, OfferService, DeliveryPartnerService)
 *   - Polymorphism (PaymentProcessor interface — different payment types at runtime)
 *   - Multithreading (starts OrderProgressTask daemon thread per order)
 *   - Streams & Lambdas (filter, collect)
 *   - Custom Exceptions (EmptyCartException, InvalidCouponException, OrderCancellationException)
 *   - Generics (Repository<Order>)
 */
public class OrderService {

    /** How long each status step takes (15 s for demo, lower in tests). */
    private static final long STATUS_STEP_DELAY_MS = 15_000;

    private final Repository<Order> orders = new Repository<>();
    private final OfferService offerService;
    private final DeliveryPartnerService partnerService;

    public OrderService(OfferService offerService, DeliveryPartnerService partnerService) {
        this.offerService  = offerService;
        this.partnerService = partnerService;
    }

    // ------------------------------------------------------------------ helpers
    private Offer resolveOffer(Cart cart, String couponCode) throws InvalidCouponException {
        if (couponCode == null || couponCode.trim().isEmpty()) return null;
        Offer offer = offerService.findByCode(couponCode);
        if (!offer.isApplicable(cart.getSubtotal())) {
            throw new InvalidCouponException(offer.getCode(),
                    "add items worth Rs." + (int) offer.getMinOrder() + " or more");
        }
        return offer;
    }

    // ------------------------------------------------------------------ public API
    public Bill previewBill(Customer customer, Cart cart, String couponCode)
            throws EmptyCartException, InvalidCouponException {
        if (cart.isEmpty()) throw new EmptyCartException();
        Offer offer = resolveOffer(cart, couponCode);
        double couponDiscount = offer == null ? 0 : offer.calculateDiscount(cart.getSubtotal());
        return Bill.calculate(customer, cart.getSubtotal(), couponDiscount);
    }

    public Order placeOrder(Customer customer, Cart cart, String couponCode, PaymentMode mode)
            throws EmptyCartException, InvalidCouponException {

        if (cart.isEmpty()) throw new EmptyCartException();

        // Validate + process payment using PaymentProcessor (polymorphism)
        PaymentProcessor processor = PaymentProcessorFactory.forMode(mode);
        processor.validate(cart.getSubtotal());
        processor.process(cart.getSubtotal()); // simulate charge

        Offer offer = resolveOffer(cart, couponCode);
        double couponDiscount = offer == null ? 0 : offer.calculateDiscount(cart.getSubtotal());
        String appliedCode    = offer == null ? null : offer.getCode();

        Order order = new Order(customer, cart, couponDiscount, appliedCode, mode);

        // Assign a delivery partner (synchronized inside DeliveryPartnerService)
        Optional<DeliveryPartner> partner = partnerService.assignAvailable();
        partner.ifPresent(order::assignDeliveryPartner); // method reference

        orders.save(order);
        customer.addLoyaltyPoints((int) (order.getTotal() / 10), "Order #" + order.getId());
        startTracking(order);
        return order;
    }

    /**
     * Cancel an order by ID for a given customer.
     * Throws OrderCancellationException if the order cannot be cancelled.
     */
    public Order cancelOrder(int orderId, String customerEmail) throws OrderCancellationException {
        Order order = orders.findById(orderId)
                .orElseThrow(() -> new OrderCancellationException(orderId, "order not found"));

        if (!order.getCustomer().getEmail().equals(customerEmail.toLowerCase())) {
            throw new OrderCancellationException(orderId, "you do not own this order");
        }

        order.cancel(); // throws OrderCancellationException if not PLACED

        // Release the delivery partner back to the pool
        partnerService.release(order.getDeliveryPartner());
        return order;
    }

    private void startTracking(Order order) {
        // Lambda passed as Runnable — demonstrates lambda used as a functional interface
        Thread worker = new Thread(
                new OrderProgressTask(order, STATUS_STEP_DELAY_MS),
                "order-tracker-" + order.getId());
        worker.setDaemon(true);
        worker.start();
    }

    public List<Order> getAll() {
        return orders.findAll();
    }

    /** Streams + lambda filter — demonstrates Streams API. */
    public List<Order> getOrdersFor(Customer customer) {
        return orders.findAll().stream()
                .filter(o -> o.getCustomer().equals(customer))
                .collect(Collectors.toList());
    }

    public Optional<Order> findById(int id) {
        return orders.findById(id);
    }
}