package com.zesto.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Financial Precision & Invariant Maintenance (Sum of individual shares == exact total)
 *   - Encapsulation (state and calculation rules hidden behind clean API)
 *   - Static Factory / Utility Methods
 *   - Object Modeling (PersonShare record/inner class)
 *
 * Handles odd-cent penny rounding (e.g. splitting Rs. 100.00 among 3 people = 33.34, 33.33, 33.33 -> exact 100.00).
 */
public class BillSplitter {

    public static class SplitResult {
        private final double totalAmount;
        private final String splitType;
        private final List<Map<String, Object>> shares;
        private final String formattedSummary;

        public SplitResult(double totalAmount, String splitType, List<Map<String, Object>> shares, String formattedSummary) {
            this.totalAmount = totalAmount;
            this.splitType = splitType;
            this.shares = shares;
            this.formattedSummary = formattedSummary;
        }

        public double getTotalAmount() { return totalAmount; }
        public String getSplitType() { return splitType; }
        public List<Map<String, Object>> getShares() { return shares; }
        public String getFormattedSummary() { return formattedSummary; }
    }

    /**
     * Splits an order equally among N people, handling remainder cents so sum equals total exactly.
     */
    public static SplitResult splitEqually(double totalAmount, List<String> personNames) {
        if (personNames == null || personNames.isEmpty()) {
            throw new IllegalArgumentException("Must provide at least one person name");
        }
        int count = personNames.size();
        long totalCents = Math.round(totalAmount * 100.0);
        long baseShareCents = totalCents / count;
        long remainderCents = totalCents % count;

        List<Map<String, Object>> shares = new ArrayList<>();
        StringBuilder summary = new StringBuilder();
        summary.append(String.format("Zesto Bill Split (Total: Rs. %.2f across %d people):\n", totalAmount, count));

        for (int i = 0; i < count; i++) {
            long personCents = baseShareCents + (i < remainderCents ? 1 : 0);
            double personShare = personCents / 100.0;
            String name = personNames.get(i);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", name);
            m.put("amount", personShare);
            shares.add(m);

            summary.append(String.format("• %s: Rs. %.2f\n", name, personShare));
        }

        return new SplitResult(totalAmount, "EQUAL", shares, summary.toString());
    }

    /**
     * Splits an order with custom / itemized shares, distributing taxes & delivery proportionally.
     */
    public static SplitResult splitItemized(double subtotal, double additionalCharges, List<Map<String, Object>> personItems) {
        if (personItems == null || personItems.isEmpty()) {
            throw new IllegalArgumentException("Must provide at least one person with items");
        }

        double totalAmount = Math.round((subtotal + additionalCharges) * 100.0) / 100.0;
        long totalCents = Math.round(totalAmount * 100.0);

        List<Map<String, Object>> shares = new ArrayList<>();
        StringBuilder summary = new StringBuilder();
        summary.append(String.format("Zesto Itemized Split (Total: Rs. %.2f):\n", totalAmount));

        double rawItemSum = 0.0;
        for (Map<String, Object> p : personItems) {
            double itemTotal = Double.parseDouble(String.valueOf(p.getOrDefault("itemTotal", 0.0)));
            rawItemSum += itemTotal;
        }

        long allocatedCents = 0;
        for (int i = 0; i < personItems.size(); i++) {
            Map<String, Object> p = personItems.get(i);
            String name = String.valueOf(p.getOrDefault("name", "Person " + (i + 1)));
            double itemTotal = Double.parseDouble(String.valueOf(p.getOrDefault("itemTotal", 0.0)));

            long personCents;
            if (i == personItems.size() - 1) {
                // Invariant: last person absorbs any residual cent so sum == totalCents exactly
                personCents = totalCents - allocatedCents;
            } else {
                double ratio = rawItemSum > 0 ? (itemTotal / rawItemSum) : (1.0 / personItems.size());
                personCents = Math.round(totalCents * ratio);
                allocatedCents += personCents;
            }

            double personAmount = personCents / 100.0;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", name);
            m.put("itemTotal", itemTotal);
            m.put("amount", personAmount);
            shares.add(m);

            summary.append(String.format("• %s: Rs. %.2f (Items: Rs. %.2f)\n", name, personAmount, itemTotal));
        }

        return new SplitResult(totalAmount, "ITEMIZED", shares, summary.toString());
    }
}
