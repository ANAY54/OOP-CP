package com.zesto.model;

public class Offer {

    private final String code;
    private final String title;
    private final int discountPercent;
    private final double minOrder;
    private final double maxDiscount;

    public Offer(String code, String title, int discountPercent, double minOrder, double maxDiscount) {
        this.code = code;
        this.title = title;
        this.discountPercent = discountPercent;
        this.minOrder = minOrder;
        this.maxDiscount = maxDiscount;
    }

    public boolean isApplicable(double subtotal) {
        return subtotal >= minOrder;
    }

    public double calculateDiscount(double subtotal) {
        if (!isApplicable(subtotal)) {
            return 0;
        }
        double discount = subtotal * discountPercent / 100.0;
        return Math.min(discount, maxDiscount);
    }

    public String getCode() { return code; }
    public String getTitle() { return title; }
    public int getDiscountPercent() { return discountPercent; }
    public double getMinOrder() { return minOrder; }
    public double getMaxDiscount() { return maxDiscount; }

    @Override
    public String toString() {
        return code + ": " + title;
    }
}