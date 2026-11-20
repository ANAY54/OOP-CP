package com.zesto.exception;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Inheritance (extends RuntimeException)
 *   - Constructor Overloading (message only vs message + cause)
 *   - Encapsulation
 *
 * Base class of all Zesto custom exceptions (inheritance hierarchy).
 * Unchecked, so services can throw it without declaring it everywhere.
 */
public class ZestoException extends RuntimeException {
    public ZestoException(String message) {
        super(message);
    }

    public ZestoException(String message, Throwable cause) {
        super(message, cause);
    }
}