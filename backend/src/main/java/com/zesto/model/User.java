package com.zesto.model;

/**
 * OOP CONCEPTS:
 *   - Abstract Class (cannot be instantiated directly)
 *   - Encapsulation (private fields with public getters/final setters)
 *   - Inheritance base (Customer and DeliveryPartner extend this)
 *   - Static variables (idCounter, totalUsers — class-level, shared)
 *   - final methods (setName, setEmail — cannot be overridden)
 *   - Abstract method (getRole — subclasses MUST implement)
 *   - this keyword (used in setters)
 */
public abstract class User {

    private static int idCounter = 1000;
    private static int totalUsers = 0;

    private final int id;
    private String name;
    private String email;

    protected User(String name, String email) {
        this.id = ++idCounter;
        setName(name);
        setEmail(email);
        totalUsers++;
    }

    public abstract String getRole();

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public final void setName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        this.name = name.trim();
    }

    public String getEmail() {
        return email;
    }

    public final void setEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email: " + email);
        }
        this.email = email.trim().toLowerCase();
    }

    public static int getTotalUsers() {
        return totalUsers;
    }

    @Override
    public String toString() {
        return "#" + id + " " + name + " <" + email + ">";
    }
}