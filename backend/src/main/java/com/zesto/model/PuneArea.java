package com.zesto.model;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Enum with Geographic Coordinates (encapsulates real Pune neighborhood lat/lon pairs)
 *   - Encapsulation (immutable private final fields)
 *   - Static Lookup Method (fromKey with safe default)
 */
public enum PuneArea {
    FC_ROAD("FC Road, Deccan, Pune", 18.5228, 73.8414),
    KOREGAON_PARK("Koregaon Park, Pune", 18.5362, 73.8939),
    CAMP("MG Road, Camp, Pune", 18.5136, 73.8791),
    SADASHIV_PETH("Tilak Road, Sadashiv Peth, Pune", 18.5089, 73.8478),
    KOTHRUD("Karve Road, Kothrud, Pune", 18.5074, 73.8077),
    VIMAN_NAGAR("Viman Nagar, Pune", 18.5679, 73.9143),
    BANER("Baner High Street, Pune", 18.5590, 73.7868),
    AUNDH("ITI Road, Aundh, Pune", 18.5580, 73.8075),
    WAKAD("Wakad, Pune", 18.5987, 73.7607),
    HINJEWADI("Phase 1, Hinjewadi, Pune", 18.5913, 73.7389);

    private final String label;
    private final double latitude;
    private final double longitude;

    PuneArea(String label, double latitude, double longitude) {
        this.label = label;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getLabel() { return label; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }

    public static PuneArea fromKey(String key) {
        if (key == null || key.trim().isEmpty()) {
            return FC_ROAD;
        }
        String normalized = key.trim().toUpperCase().replace(' ', '_');
        for (PuneArea area : values()) {
            if (area.name().equalsIgnoreCase(normalized) || area.label.equalsIgnoreCase(key.trim())) {
                return area;
            }
        }
        return FC_ROAD;
    }
}
