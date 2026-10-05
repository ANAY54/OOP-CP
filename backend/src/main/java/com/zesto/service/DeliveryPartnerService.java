package com.zesto.service;

import com.zesto.model.DeliveryPartner;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * OOP CONCEPTS: Encapsulation, Synchronization (thread safety),
 *               Collections (ArrayList), Polymorphism (DeliveryPartner extends User)
 *
 * Manages a fixed pool of delivery partners.  When an order is placed,
 * OrderService calls assignAvailable() to get a free partner and marks
 * them unavailable.  When the order reaches DELIVERED or CANCELLED, the
 * partner is released back to the pool.
 *
 * All public mutating methods are synchronized to prevent two orders
 * from being assigned the same partner concurrently.
 */
public class DeliveryPartnerService {

    private final List<DeliveryPartner> pool = new ArrayList<>();

    public DeliveryPartnerService() {
        // Pre-loaded partner pool (demonstrates object creation and collections)
        pool.add(new DeliveryPartner("Ravi Kumar",    "ravi@zesto.in",    "Bike"));
        pool.add(new DeliveryPartner("Priya Singh",   "priya@zesto.in",   "Scooter"));
        pool.add(new DeliveryPartner("Arun Sharma",   "arun@zesto.in",    "Bike"));
        pool.add(new DeliveryPartner("Neha Patil",    "neha@zesto.in",    "Cycle"));
        pool.add(new DeliveryPartner("Vikram Desai",  "vikram@zesto.in",  "Bike"));
    }

    /**
     * Assign the first available partner and mark them unavailable.
     * synchronized ensures thread safety when multiple orders are placed
     * at the same time.
     *
     * @return Optional.empty() if no partner is free right now
     */
    public synchronized Optional<DeliveryPartner> assignAvailable() {
        // Lambda passed to stream filter — demonstrates lambda + streams
        return pool.stream()
                .filter(DeliveryPartner::isAvailable)
                .findFirst()
                .map(partner -> {
                    partner.setAvailable(false);
                    return partner;
                });
    }

    /**
     * Release a partner back to the pool after order completion/cancellation.
     */
    public synchronized void release(DeliveryPartner partner) {
        if (partner != null) {
            partner.setAvailable(true);
        }
    }

    /** Returns a snapshot of the full pool (read-only view). */
    public List<DeliveryPartner> getAll() {
        return new ArrayList<>(pool);
    }
}
