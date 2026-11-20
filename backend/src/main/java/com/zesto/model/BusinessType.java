package com.zesto.model;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Enum with State & Behaviour (label, badgeText, defaultIcon)
 *   - Encapsulation (immutable private final fields with getters)
 *   - Static Factory / Lookup Method (fromKey with safe fallback)
 */
public enum BusinessType {
    HOME_CHEF("Home Chef", "Home Chef", "home"),
    CLOUD_KITCHEN("Cloud Kitchen", "Cloud Kitchen", "flame"),
    STREET_FOOD("Street Food Stall", "Local Street Gem", "fast-food"),
    BAKERY_CAFE("Local Bakery & Cafe", "Artisan Bakery", "cafe"),
    TIFFIN_SERVICE("Tiffin & Thali", "Daily Tiffin", "nutrition"),
    FAMILY_RESTAURANT("Family Restaurant", "Local Kitchen", "storefront");

    private final String displayName;
    private final String defaultBadge;
    private final String iconName;

    BusinessType(String displayName, String defaultBadge, String iconName) {
        this.displayName = displayName;
        this.defaultBadge = defaultBadge;
        this.iconName = iconName;
    }

    public String getDisplayName() { return displayName; }
    public String getDefaultBadge() { return defaultBadge; }
    public String getIconName() { return iconName; }

    public static BusinessType fromKey(String key) {
        if (key == null || key.trim().isEmpty()) {
            return HOME_CHEF;
        }
        String normalized = key.trim().toUpperCase().replace(' ', '_');
        for (BusinessType type : values()) {
            if (type.name().equalsIgnoreCase(normalized) || type.displayName.equalsIgnoreCase(key.trim())) {
                return type;
            }
        }
        return HOME_CHEF;
    }
}
