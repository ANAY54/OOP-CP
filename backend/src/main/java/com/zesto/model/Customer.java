package com.zesto.model;

/**
 * OOP CONCEPTS:
 *   - Inheritance (extends User)
 *   - Interface (implements Discountable)
 *   - Constructor Overloading (two constructors — with/without address)
 *   - super keyword (calls User constructor)
 *   - this keyword (this(name, email, "Not set") delegation)
 *   - Method Overloading (addLoyaltyPoints with and without reason)
 *   - Method Overriding (@Override getRole, applyDiscount, discountInfo, equals, hashCode, toString)
 *   - Encapsulation (private loyaltyPoints, getters only)
 */
public class Customer extends User implements Discountable {

    private String address;
    private int loyaltyPoints;

    public Customer(String name, String email) {
        this(name, email, "Not set");
    }

    public Customer(String name, String email, String address) {
        super(name, email);
        this.address = address;
        this.loyaltyPoints = 0;
    }

    @Override
    public String getRole() {
        return "CUSTOMER";
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public int getLoyaltyPoints() {
        return loyaltyPoints;
    }

    public void addLoyaltyPoints(int points) {
        if (points > 0) {
            loyaltyPoints += points;
        }
    }

    public void addLoyaltyPoints(int points, String reason) {
        addLoyaltyPoints(points);
        System.out.println(points + " points added: " + reason);
    }

    private int getDiscountPercent() {
        if (loyaltyPoints >= 500) return 10;
        if (loyaltyPoints >= 200) return 5;
        return 0;
    }

    @Override
    public double applyDiscount(double amount) {
        return amount - (amount * getDiscountPercent() / 100.0);
    }

    @Override
    public String discountInfo() {
        return "Loyalty discount of " + getDiscountPercent() + "% (" + loyaltyPoints + " points)";
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Customer)) return false;
        Customer other = (Customer) obj;
        return getEmail().equals(other.getEmail());
    }

    @Override
    public int hashCode() {
        return getEmail().hashCode();
    }

    @Override
    public String toString() {
        return super.toString() + ", address=" + address + ", points=" + loyaltyPoints;
    }
}