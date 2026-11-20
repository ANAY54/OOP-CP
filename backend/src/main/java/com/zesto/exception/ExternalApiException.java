package com.zesto.exception;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Custom Exception Hierarchy (extends ZestoException domain base exception)
 *   - Exception Chaining (preserves root cause via super(message, cause))
 *   - Error Abstraction (shields application logic from raw HTTP and JSON parsing errors)
 */
public class ExternalApiException extends ZestoException {

    private final String serviceName;

    public ExternalApiException(String serviceName, String message) {
        super(String.format("[%s API Error] %s", serviceName, message));
        this.serviceName = serviceName;
    }

    public ExternalApiException(String serviceName, String message, Throwable cause) {
        super(String.format("[%s API Error] %s", serviceName, message), cause);
        this.serviceName = serviceName;
    }

    public String getServiceName() {
        return serviceName;
    }
}
