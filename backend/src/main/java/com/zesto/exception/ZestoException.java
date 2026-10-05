package com.zesto.exception;

/**
 * Base class of all Zesto custom exceptions (inheritance hierarchy).
 * Unchecked, so services can throw it without declaring it everywhere.
 */
public class ZestoException extends RuntimeException {
    public ZestoException(String message) {
        super(message);
    }
}