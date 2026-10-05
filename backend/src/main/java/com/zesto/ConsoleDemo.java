package com.zesto;

import com.zesto.exception.OrderCancellationException;
import com.zesto.exception.ZestoException;
import com.zesto.model.*;
import com.zesto.service.*;

/**
 * OOP CONCEPTS DEMONSTRATED IN THIS FILE (viva reference):
 *
 *  1.  Abstract class          - FoodItem (abstract calculatePrice / getCategory)
 *  2.  Inheritance             - Customer extends User, DeliveryPartner extends User,
 *                                VegItem / NonVegItem extend FoodItem
 *  3.  Interface               - PaymentProcessor, Identifiable, Discountable, Searchable
 *  4.  Polymorphism            - PaymentProcessor ref holds UpiPayment / CashPayment
 *  5.  Method Overriding       - getRole(), getCategory(), calculatePrice()
 *  6.  Method Overloading      - addLoyaltyPoints(int) vs addLoyaltyPoints(int, String)
 *  7.  Constructor Overloading - Customer(name,email) vs Customer(name,email,address)
 *  8.  Encapsulation           - all fields private, getters only
 *  9.  static keyword          - User.totalUsers, FoodItem idCounter
 * 10.  final keyword           - final OrderLine fields, final setBasePrice()
 * 11.  this keyword            - used in Customer constructors
 * 12.  super keyword           - Customer/DeliveryPartner constructors call super(name, email)
 * 13.  Enum                    - Cuisine, PaymentMode, OrderStatus (with behaviour)
 * 14.  Static Nested Class     - Order.OrderLine
 * 15.  Inner (static) Builder  - Review.Builder
 * 16.  Anonymous Class         - PaymentProcessorFactory.createAnonymousCashProcessor()
 * 17.  Generic Method          - PaymentProcessorFactory.wrap<P>(P proc)
 * 18.  Collections / Generics  - List<Order>, Map<String, Customer>
 * 19.  Streams + Lambdas       - filter, sorted, map, collect, method references
 * 20.  Custom Exceptions       - ZestoException hierarchy (5 subclasses)
 * 21.  Synchronization         - volatile Order.status, synchronized cancel/advance
 * 22.  Multithreading          - OrderProgressTask daemon thread
 * 23.  File I/O                - PersistenceService (java.nio.file)
 * 24.  Comparable              - FoodItem.compareTo (sorted by price)
 * 25.  toString / equals       - overridden in Customer, FoodItem, Order
 */
public class ConsoleDemo {

    // -------------------------------------------------------
    //  Helper: print a section banner
    // -------------------------------------------------------
    private static void banner(String title) {
        System.out.println("\n================================================");
        System.out.println("  " + title);
        System.out.println("================================================");
    }

    // -------------------------------------------------------
    //  ENTRY POINT
    // -------------------------------------------------------
    public static void main(String[] args) throws InterruptedException {

        // ---- 1. Services (composition) ----------------------------
        RestaurantService    restaurantService = new RestaurantService();
        OfferService         offerService      = new OfferService();
        DeliveryPartnerService partnerService  = new DeliveryPartnerService();
        OrderService         orderService      = new OrderService(offerService, partnerService);
        ReviewService        reviewService     = new ReviewService();

        // ---- 2. Static variable demo (concept #9) -----------------
        banner("STATIC VARIABLE: User.totalUsers");
        System.out.println("Users before: " + User.getTotalUsers());
        Customer alice = new Customer("Alice Patel", "alice@zesto.in", "MG Road, Bangalore");
        Customer bob   = new Customer("Bob Sharma",  "bob@zesto.in");   // overloaded constructor
        System.out.println("Users after creating 2 Customers: " + User.getTotalUsers());

        // ---- 3. Inheritance + super + this (concepts #2, #11, #12) --
        banner("INHERITANCE / SUPER / THIS");
        System.out.println("alice role: " + alice.getRole());
        System.out.println("alice default address: " + bob.getAddress()); // "Not set" from this()

        DeliveryPartner partner = partnerService.getAll().get(0);
        System.out.println("partner role: " + partner.getRole());
        // Both alice and partner are Users at compile time — polymorphism
        User[] users = { alice, partner };
        for (User u : users) {
            System.out.println("  [polymorphism] " + u.getName() + " => " + u.getRole());
        }

        // ---- 4. Abstract class + polymorphism (concepts #1, #4) ----
        banner("ABSTRACT CLASS + POLYMORPHISM (FoodItem)");
        Restaurant restaurant;
        try {
            restaurant = restaurantService.getById(1);
        } catch (ZestoException e) {
            System.out.println("Could not load restaurant: " + e.getMessage());
            return;
        }
        FoodItem firstItem = restaurant.getMenu().get(0);
        FoodItem lastItem  = restaurant.getMenu().get(restaurant.getMenu().size() - 1);
        // calculatePrice() dispatched at runtime to VegItem / NonVegItem
        System.out.println("First item type: " + firstItem.getCategory()
                + " price: " + firstItem.calculatePrice());
        System.out.println("Last  item type: " + lastItem.getCategory()
                + " price: " + lastItem.calculatePrice());

        // ---- 5. Interface: PaymentProcessor (concepts #3, #4) ------
        banner("INTERFACE POLYMORPHISM (PaymentProcessor)");
        PaymentProcessor upi  = new UpiPayment("alice@paytm");
        PaymentProcessor cash = new CashPayment();
        PaymentProcessor anon = PaymentProcessorFactory.createAnonymousCashProcessor(); // anonymous class

        PaymentProcessor[] processors = { upi, cash, anon };
        for (PaymentProcessor p : processors) {
            p.validate(200.0);
            String ref = p.process(200.0);
            System.out.println("  " + p.getDisplayName() + " -> ref=" + ref);
        }

        // ---- 6. Generic method (concept #17) -----------------------
        banner("GENERIC METHOD (PaymentProcessorFactory.wrap<P>)");
        PaymentProcessor wrapped = PaymentProcessorFactory.wrap(upi);
        wrapped.process(999.0);  // prints [PaymentLog] ...

        // ---- 7. Comparable (concept #24) ---------------------------
        banner("Comparable: menu sorted by price");
        restaurant.getMenu().stream()
                .sorted()                     // uses FoodItem.compareTo()
                .limit(5)
                .forEach(System.out::println); // method reference

        // ---- 8. Streams + lambda (concept #19) ---------------------
        banner("STREAMS + LAMBDAS: search biryani");
        restaurantService.search("biryani").forEach(r ->
                System.out.println("  " + r.getName() + " (" + r.getCuisine().getDisplayName() + ")"));

        // ---- 9. Method overloading (concept #6) --------------------
        banner("METHOD OVERLOADING: addLoyaltyPoints");
        alice.addLoyaltyPoints(100);
        alice.addLoyaltyPoints(50, "Welcome bonus");
        System.out.println("Alice points: " + alice.getLoyaltyPoints());

        // ---- 10. Enum with behaviour (concept #13) ------------------
        banner("ENUM WITH BEHAVIOUR: OrderStatus.next()");
        OrderStatus status = OrderStatus.PLACED;
        while (status != OrderStatus.DELIVERED) {
            System.out.println("  " + status.getLabel());
            status = status.next();
        }
        System.out.println("  " + status.getLabel());

        // ---- 11. Enums: Cuisine, PaymentMode -----------------------
        banner("ENUMS: Cuisine and PaymentMode");
        for (Cuisine c : Cuisine.values()) {
            System.out.println("  " + c.name() + " => " + c.getDisplayName());
        }

        // ---- 12. Place order (synchronization, threads) (concepts #21, #22) ---
        banner("PLACE ORDER + SYNCHRONIZATION + DELIVERY PARTNER");
        try {
            Cart cart = new Cart(restaurant);
            cart.add(restaurant.getMenu().get(0), 2);
            cart.add(restaurant.getMenu().get(1));

            Order order = orderService.placeOrder(alice, cart, "ZESTO50", PaymentMode.UPI);
            System.out.println(order);

            // Static nested class usage
            System.out.println("\nOrder lines (static nested class Order.OrderLine):");
            for (Order.OrderLine line : order.getLines()) {
                System.out.println("  " + line);
            }

        } catch (ZestoException e) {
            System.out.println("Error: " + e.getMessage());
        }

        // ---- 13. Cancel order / custom exception (concept #20) -----
        banner("CUSTOM EXCEPTION: OrderCancellationException");
        try {
            Cart cart2 = new Cart(restaurant);
            cart2.add(restaurant.getMenu().get(2));
            Order order2 = orderService.placeOrder(alice, cart2, null, PaymentMode.CASH_ON_DELIVERY);
            System.out.println("Order placed: #" + order2.getId());
            order2.advanceStatus();                // now PREPARING
            order2.cancel();                       // throws OrderCancellationException
        } catch (ZestoException e) {
            // OrderCancellationException is a ZestoException
            System.out.println("Caught " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }

        // ---- 14. Inner Builder class: Review (concept #15) ---------
        banner("STATIC INNER CLASS: Review.Builder");
        Review review = new Review.Builder()
                .restaurantId(1)
                .restaurantName(restaurant.getName())
                .customerEmail(alice.getEmail())
                .customerName(alice.getName())
                .orderId(5001)
                .rating(5)
                .comment("Absolutely delicious!")
                .build();
        reviewService.submit(review);
        System.out.println(review);
        System.out.println("Average rating for restaurant 1: "
                + reviewService.averageRating(1));

        // ---- 15. Empty cart exception (custom exception) ------------
        banner("CUSTOM EXCEPTION: EmptyCartException");
        try {
            orderService.placeOrder(alice, new Cart(restaurant), null, PaymentMode.UPI);
        } catch (ZestoException e) {
            System.out.println("Caught: " + e.getClass().getSimpleName() + " -> " + e.getMessage());
        }

        // ---- 16. File I/O (concept #23) ----------------------------
        banner("FILE I/O: PersistenceService");
        java.util.Map<String, Customer> map = new java.util.HashMap<>();
        map.put(alice.getEmail(), alice);
        map.put(bob.getEmail(),   bob);
        PersistenceService.saveCustomers(map);
        java.util.List<java.util.Map<String,String>> loaded = PersistenceService.loadCustomers();
        System.out.println("Loaded " + loaded.size() + " customer(s) back from disk.");

        // ---- 17. toString / equals (concept #25) -------------------
        banner("toString / equals / hashCode");
        Customer aliceCopy = new Customer("Alice Patel", "alice@zesto.in");
        System.out.println("alice.equals(aliceCopy): " + alice.equals(aliceCopy)); // true (email-based)
        System.out.println("alice.toString():\n  " + alice);

        banner("DEMO COMPLETE");
        System.out.println("All 25 OOP concepts demonstrated successfully.");
    }
}