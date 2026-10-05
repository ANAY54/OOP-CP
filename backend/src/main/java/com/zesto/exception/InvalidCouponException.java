package com.zesto.exception;

public class InvalidCouponException extends ZestoException {

    public InvalidCouponException(String code) {
        super("Coupon '" + code + "' is invalid or expired");
    }

    public InvalidCouponException(String code, String reason) {
        super("Coupon '" + code + "' can't be applied: " + reason);
    }
}