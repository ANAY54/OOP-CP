package com.zesto.util;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Utility Class (final class, private constructor preventing instantiation)
 *   - Static Methods (pure functions without mutable state)
 *   - Mathematical Domain Modeling (Haversine formula for spherical distance)
 */
public final class DistanceCalculator {

    public static final double PUNE_LAT = 18.5204;
    public static final double PUNE_LON = 73.8567;
    private static final double EARTH_RADIUS_KM = 6371.0;

    private DistanceCalculator() {
        // Prevents instantiation
    }

    /**
     * Computes the great-circle distance between two GPS coordinates in kilometers.
     *
     * @param lat1 Customer latitude
     * @param lon1 Customer longitude
     * @param lat2 Restaurant latitude
     * @param lon2 Restaurant longitude
     * @return Distance in kilometers rounded to 2 decimal places
     */
    public static double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double rawKm = EARTH_RADIUS_KM * c;
        return Math.round(rawKm * 100.0) / 100.0;
    }

    public static double distance(double lat1, double lon1, double lat2, double lon2) {
        return haversineDistance(lat1, lon1, lat2, lon2);
    }
}
