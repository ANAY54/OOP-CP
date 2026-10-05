package com.zesto.model;

public class DeliveryPartner extends User {

    private String vehicle;
    private boolean available;

    public DeliveryPartner(String name, String email, String vehicle) {
        super(name, email);
        this.vehicle = vehicle;
        this.available = true;
    }

    @Override
    public String getRole() {
        return "DELIVERY_PARTNER";
    }

    public String getVehicle() {
        return vehicle;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    @Override
    public String toString() {
        return super.toString() + ", vehicle=" + vehicle + ", available=" + available;
    }
}