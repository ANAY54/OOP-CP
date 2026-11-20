package com.zesto.model;

import java.util.Objects;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends abstract class User via super())
 *   - Polymorphism (implements abstract getRole() returning "BUSINESS_OWNER")
 *   - Encapsulation (private verification, OTP, FSSAI, and restaurant linkage fields)
 *   - Object Contracts (overrides equals, hashCode, and toString based on email identity)
 *   - Thread Safety (synchronized state updates for verification workflow)
 */
public class BusinessOwner extends User {

    private String phone;
    private String fssaiLicense;
    private boolean verified;
    private String pendingOtp;
    private long otpGeneratedAtMs;
    private Integer restaurantId;

    public BusinessOwner(String name, String email) {
        super(name, email);
        this.phone = "";
        this.fssaiLicense = "";
        this.verified = false;
        this.pendingOtp = null;
        this.otpGeneratedAtMs = 0L;
        this.restaurantId = null;
    }

    @Override
    public String getRole() {
        return "BUSINESS_OWNER";
    }

    public synchronized void issueOtp(String otp, String phone, String fssaiLicense) {
        this.pendingOtp = otp;
        this.otpGeneratedAtMs = System.currentTimeMillis();
        if (phone != null) this.phone = phone.trim();
        if (fssaiLicense != null) this.fssaiLicense = fssaiLicense.trim().toUpperCase();
    }

    public synchronized boolean verifyOtp(String code) {
        if (pendingOtp == null || code == null) return false;
        // OTP valid for 15 minutes
        boolean notExpired = (System.currentTimeMillis() - otpGeneratedAtMs) <= 15L * 60L * 1000L;
        if (notExpired && pendingOtp.equals(code.trim())) {
            this.verified = true;
            this.pendingOtp = null;
            return true;
        }
        return false;
    }

    public synchronized void markVerifiedFromDisk(String phone, String fssaiLicense, Integer restaurantId) {
        this.verified = true;
        this.phone = phone != null ? phone : "";
        this.fssaiLicense = fssaiLicense != null ? fssaiLicense : "";
        this.restaurantId = restaurantId;
    }

    public synchronized String getPhone() { return phone; }
    public synchronized void setPhone(String phone) { this.phone = phone != null ? phone.trim() : ""; }

    public synchronized String getFssaiLicense() { return fssaiLicense; }
    public synchronized void setFssaiLicense(String fssaiLicense) {
        this.fssaiLicense = fssaiLicense != null ? fssaiLicense.trim().toUpperCase() : "";
    }

    public synchronized boolean isVerified() { return verified; }
    public synchronized String getPendingOtp() { return pendingOtp; }

    public synchronized Integer getRestaurantId() { return restaurantId; }
    public synchronized void setRestaurantId(Integer restaurantId) { this.restaurantId = restaurantId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BusinessOwner)) return false;
        BusinessOwner other = (BusinessOwner) o;
        return Objects.equals(getEmail(), other.getEmail());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getEmail());
    }

    @Override
    public String toString() {
        return super.toString() + " [BUSINESS_OWNER, verified=" + verified + ", restaurantId=" + restaurantId + "]";
    }
}
