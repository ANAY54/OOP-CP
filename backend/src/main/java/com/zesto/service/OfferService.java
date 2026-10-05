package com.zesto.service;

import com.zesto.exception.InvalidCouponException;
import com.zesto.model.Offer;

import java.util.ArrayList;
import java.util.List;

public class OfferService {

    private final List<Offer> offers = new ArrayList<>();

    public OfferService() {
        offers.add(new Offer("ZESTO50", "50% off up to Rs.100 on orders above Rs.199", 50, 199, 100));
        offers.add(new Offer("WELCOME20", "20% off up to Rs.80 on orders above Rs.149", 20, 149, 80));
        offers.add(new Offer("BIGFEAST", "15% off up to Rs.150 on orders above Rs.599", 15, 599, 150));
    }

    public List<Offer> getAll() {
        return new ArrayList<>(offers);
    }

    public Offer findByCode(String code) throws InvalidCouponException {
        if (code == null) {
            throw new InvalidCouponException("null");
        }
        return offers.stream()
                .filter(o -> o.getCode().equalsIgnoreCase(code.trim()))
                .findFirst()
                .orElseThrow(() -> new InvalidCouponException(code));
    }
}