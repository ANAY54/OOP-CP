package com.zesto;

import com.zesto.model.Bill;
import com.zesto.model.Customer;
import com.zesto.model.Restaurant;
import com.zesto.service.BillSplitter;
import com.zesto.service.DataCatalogService;
import com.zesto.service.PricingPolicy;
import com.zesto.service.SampleRestaurantProvider;
import com.zesto.service.planner.GreedyStrategy;
import com.zesto.service.planner.KnapsackStrategy;
import com.zesto.service.planner.MealPlanner;
import com.zesto.service.RestaurantService;
import com.zesto.util.DistanceCalculator;

import java.util.List;
import java.util.Map;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Automated Unit Testing in Pure Java (No JUnit / external testing frameworks needed)
 *   - Invariant Verification (Validates mathematical and architectural invariants)
 *   - Defensive Assertions
 *
 * Test Runner covering:
 *   1. Bill Calculation & Decimal Rounding
 *   2. Haversine Distance Spherical Math
 *   3. Dynamic Pricing Policy & Distance-based Delivery Fee
 *   4. Sample Provider Fallback
 *   5. DataCatalogService Cache Load
 *   6. MealPlanStrategy (Knapsack DP & Greedy variety)
 *   7. BillSplitter Odd-Cent Precision Invariant (Sum of shares == total)
 */
public class DemoTestRunner {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   ZESTO PURE JAVA VIVA TEST RUNNER              ");
        System.out.println("==================================================");

        testBillCalculation();
        testDistanceCalculator();
        testPricingPolicy();
        testProviderFallback();
        testDataCatalog();
        testMealPlannerStrategies();
        testBillSplitterInvariant();

        System.out.println("==================================================");
        System.out.printf("   TOTAL: %d | PASSED: %d | FAILED: %d\n", (passed + failed), passed, failed);
        if (failed == 0) {
            System.out.println("   ALL TESTS PASSED SUCCESSFULLY! (100% GREEN)   ");
        } else {
            System.out.println("   SOME TESTS FAILED! CHECK OUTPUT ABOVE.       ");
        }
        System.out.println("==================================================");

        if (failed > 0) {
            System.exit(1);
        }
    }

    private static void testBillCalculation() {
        Customer c = new Customer("Test User", "test@zesto.in", "Pune");
        Bill bill = Bill.calculate(c, 500.0, 50.0, 30.0);

        // Subtotal = 500, coupon = 50 -> 450, tax 5% of 450 = 22.50, delivery = 30 -> 502.50
        boolean ok = Math.abs(bill.getSubtotal() - 500.0) < 0.01
                && Math.abs(bill.getTax() - 22.50) < 0.01
                && Math.abs(bill.getDeliveryFee() - 30.0) < 0.01
                && Math.abs(bill.getTotal() - 502.50) < 0.01;

        assertTest("Bill.calculate() financial arithmetic & tax invariant", ok);
    }

    private static void testDistanceCalculator() {
        // Distance between Shaniwar Wada (18.5196, 73.8553) and Koregaon Park (18.5362, 73.8940) ~ 4.4 km
        double dist = DistanceCalculator.distance(18.5196, 73.8553, 18.5362, 73.8940);
        boolean ok = dist >= 3.5 && dist <= 5.5;
        assertTest("DistanceCalculator Haversine spherical math (Pune coordinates)", ok);
    }

    private static void testPricingPolicy() {
        PricingPolicy policy = new PricingPolicy();
        double fee5km = policy.calculateDeliveryFee(5.0);
        int time5km = policy.calculateDeliveryTime(5.0);

        boolean ok = fee5km >= 25.0 && time5km >= 20;
        assertTest("PricingPolicy dynamic fee (>=25) and ETA calculation", ok);
    }

    private static void testProviderFallback() {
        SampleRestaurantProvider sampleProvider = new SampleRestaurantProvider();
        List<Restaurant> sampleRestaurants = sampleProvider.fetchRestaurants();

        boolean ok = sampleRestaurants != null && sampleRestaurants.size() >= 14;
        assertTest("SampleRestaurantProvider guaranteed 14-restaurant fallback", ok);
    }

    private static void testDataCatalog() {
        DataCatalogService catalogService = new DataCatalogService();
        List<Restaurant> list = catalogService.getRestaurants();

        boolean ok = list != null && !list.isEmpty();
        assertTest("DataCatalogService disk cache / offline catalog bootstrap", ok);
    }

    private static void testMealPlannerStrategies() {
        RestaurantService restaurantService = new RestaurantService();
        MealPlanner planner = new MealPlanner(restaurantService, new KnapsackStrategy());

        Map<String, Object> knapsackPlan = planner.planMeal(600.0, 2, "veg", 2);
        boolean knapsackOk = knapsackPlan.containsKey("items") && !((List<?>) knapsackPlan.get("items")).isEmpty();

        planner.setStrategy(new GreedyStrategy());
        Map<String, Object> greedyPlan = planner.planMeal(600.0, 2, "veg", 2);
        boolean greedyOk = greedyPlan.containsKey("items") && !((List<?>) greedyPlan.get("items")).isEmpty();

        assertTest("MealPlanner Strategy Pattern (0/1 Knapsack & Greedy variety)", knapsackOk && greedyOk);
    }

    private static void testBillSplitterInvariant() {
        // Odd-cent test: Split Rs. 100.00 among 3 people -> 33.34 + 33.33 + 33.33 == 100.00
        BillSplitter.SplitResult result = BillSplitter.splitEqually(100.00, List.of("Anay", "Rohan", "Sneha"));
        double sum = 0.0;
        for (Map<String, Object> share : result.getShares()) {
            sum += Double.parseDouble(String.valueOf(share.get("amount")));
        }

        boolean ok = Math.abs(sum - 100.00) < 0.0001;
        assertTest("BillSplitter odd-cent remainder invariant (sum of shares == exact total)", ok);
    }

    private static void assertTest(String testName, boolean condition) {
        if (condition) {
            System.out.printf("  [PASS] %s\n", testName);
            passed++;
        } else {
            System.out.printf("  [FAIL] %s\n", testName);
            failed++;
        }
    }
}
