package com.zesto.model;

public interface Discountable {

    double applyDiscount(double amount);

    default String discountInfo() {
        return "No discount available";
    }
}