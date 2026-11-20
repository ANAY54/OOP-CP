# 🎓 ZESTO — College Java OOP Viva Master Reference & Notes

> **Prepared for College Java Viva Presentation (2026)**  
> **Student:** Anay Palimkar  
> **Backend Architecture:** Pure Java (JDK 17+, No external frameworks/jars)

---

## 📑 PART 1: OOP Concept to Java Class Mapping Table

| Concept | Java Class / Interface | Code Location | Key Viva Talking Point |
|:---|:---|:---|:---|
| **Inheritance** | `Customer`, `DeliveryPartner` | `model/Customer.java`, `model/DeliveryPartner.java` | Extend base class `User`; call `super(name, email)` to initialize inherited state. |
| **Polymorphism (Interface)** | `PaymentProcessor` | `model/PaymentProcessor.java` | Runtime polymorphism: `UPIPayment`, `CardPayment`, `CashPayment` implement common method `process(amount)`. |
| **Polymorphism (Abstract Class)** | `FoodItem` | `model/FoodItem.java` | Abstract methods `calculatePrice()` and `getCategory()` overridden by `VegItem`, `NonVegItem`, and `Beverage`. |
| **Abstraction** | `RestaurantProvider`, `MenuProvider` | `service/RestaurantProvider.java`, `service/MenuProvider.java` | Decouples caller from concrete data fetching; allows swapping OpenStreetMap, TheMealDB, or Sample data. |
| **Encapsulation** | `Bill` | `model/Bill.java` | Immutable value object. Private final fields, no setters, rounding logic inside factory method `calculate()`. |
| **Strategy Design Pattern** | `MealPlanStrategy`, `MealPlanner` | `service/planner/MealPlanStrategy.java`, `MealPlanner.java` | Encapsulates interchangeable algorithms (`KnapsackStrategy` DP vs `GreedyStrategy` variety heuristic). |
| **Factory Method Pattern** | `PaymentProcessorFactory` | `model/PaymentProcessorFactory.java` | Centralizes object creation: `forMode(PaymentMode mode)` returns appropriate processor without caller needing `new`. |
| **Static Nested Class** | `Order.OrderLine` | `model/Order.java` | Represents itemized receipt line; static nested because it requires no implicit pointer to outer `Order` instance. |
| **Builder Design Pattern** | `Review.Builder` | `model/Review.java` | Step-by-step construction of complex review objects with method chaining (`.rating()`, `.comment()`, `.build()`). |
| **Comparable Interface** | `FoodItem` | `model/FoodItem.java` | Implements `Comparable<FoodItem>`; defines natural sorting order by price (`compareTo` method). |
| **Method Overloading** | `Bill.calculate()`, `Customer.addLoyaltyPoints()` | `model/Bill.java`, `model/Customer.java` | Same method name with different parameter signatures (compile-time / static polymorphism). |
| **Method Overriding** | `User.getRole()`, `equals()`, `toString()` | `model/Customer.java`, `model/DeliveryPartner.java` | Subclass provides specific implementation of inherited superclass method (runtime dynamic dispatch). |
| **Custom Exceptions** | `ZestoException`, `EmptyCartException`, etc. | `exception/ZestoException.java` | Unchecked exception hierarchy extending `RuntimeException` providing clear domain semantics. |
| **Multithreading** | `OrderProgressTask` | `service/OrderProgressTask.java` | Implements `Runnable`; spawned as daemon thread to transition order status every 15s in background. |
| **Thread Synchronization** | `DeliveryPartnerService` | `service/DeliveryPartnerService.java` | `synchronized` keyword prevents race conditions when allocating available delivery partners from the shared pool. |
| **Volatile Keyword** | `Order.status`, `Order.deliveryPartner` | `model/Order.java` | Enforces memory visibility; ensures HTTP handler thread sees updates made by background worker thread immediately. |
| **Atomic Reference** | `DataCatalogService` | `service/DataCatalogService.java` | `AtomicReference<List<Restaurant>>` enables lock-free atomic swapping of entire catalog during background refresh. |
| **Generics** | `Repository<T extends Identifiable>` | `service/Repository.java` | Type-safe in-memory generic repository with bounding constraint (`extends Identifiable`). |
| **File I/O Persistence** | `PersistenceService`, `DataCatalogService` | `service/PersistenceService.java` | Reads/writes user data and catalog cache to disk using custom parsing (`java.nio.file`, `java.io`). |
| **Streams & Lambdas** | `RestaurantService`, `MoodScorer` | `service/RestaurantService.java`, `MoodScorer.java` | Modern functional operations (`filter`, `map`, `sorted`, `collect`) with method references. |

---

## 🎯 PART 2: High-Yield Viva Questions & Answers

### 1. Abstract Class vs Interface
**Q: Why is `FoodItem` an abstract class while `PaymentProcessor` is an interface?**  
> **A:**  
> - `FoodItem` models an **"is-a" stateful relationship**: all food items share concrete state (id, name, basePrice, cuisine, description, imageUrl, and auto-incrementing idCounter). Since interfaces cannot have mutable instance fields, an abstract class is required.  
> - `PaymentProcessor` models a **behavioral capability ("can-do")**: processing payments doesn't require sharing food state. Any class can implement `PaymentProcessor` regardless of where it sits in the class hierarchy.

---

### 2. Strategy Pattern & Algorithm Trade-offs
**Q: How does the "Feed Me" feature demonstrate the Strategy Design Pattern? What are the trade-offs between `KnapsackStrategy` and `GreedyStrategy`?**  
> **A:**  
> - **Strategy Pattern:** `MealPlanner` acts as the context, holding a reference to the `MealPlanStrategy` interface. At runtime, the caller can swap between `KnapsackStrategy` and `GreedyStrategy` without modifying the planner or the HTTP handler.  
> - **Trade-offs:**  
>   - **`KnapsackStrategy` (0/1 Dynamic Programming):** Computes mathematically optimal total value/satisfaction within the budget constraint. Time Complexity is $O(N \cdot W)$ and Space Complexity is $O(N \cdot W)$. However, it does not guarantee variety (it might pick two high-value desserts if they yield the maximum score).  
>   - **`GreedyStrategy` (Heuristic):** Runs in $O(N \log N)$ by sorting. It guarantees meal balance by enforcing structural buckets (mains + breads + beverage) and picking the best within each bucket.

---

### 3. Concurrency, Multithreading & Memory Visibility
**Q: What is the purpose of `volatile` on `Order.status`, and how does `OrderProgressTask` operate?**  
> **A:**  
> - `OrderProgressTask` implements `Runnable` and is executed by a separate background `Thread` (`worker.setDaemon(true)`). It advances the order status through `PLACED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`.  
> - Because modern CPUs cache variables in L1/L2 caches, a thread reading `status` (the HTTP request thread handling `GET /orders`) might read a stale value. Declaring `private volatile OrderStatus status;` guarantees **happens-before visibility**, forcing all reads and writes directly to main memory.

---

### 4. Financial Precision & Invariant Maintenance
**Q: In `BillSplitter`, why didn't you just divide the total by N? What problem does `BillSplitter` solve?**  
> **A:**  
> - Standard floating-point division causes **odd-cent rounding drift**. For example, splitting ₹100.00 among 3 people: $100 / 3 = 33.3333...$ Rounded to 2 decimals, each person pays ₹33.33. The sum is $33.33 \times 3 = 99.99$, losing ₹0.01!  
> - `BillSplitter` maintains an essential financial invariant: $\sum \text{Shares} \equiv \text{Total Amount}$. It converts amounts to integer cents ($10000$ cents), computes base share ($3333$ cents) and remainder cents ($10000 \pmod 3 = 1$ cent), allocating the extra cent to the first person ($₹33.34 + ₹33.33 + ₹33.33 = ₹100.00$).

---

### 5. Custom Exceptions & Error Handling
**Q: Why create custom exceptions like `EmptyCartException` and `OrderCancellationException` instead of using generic `RuntimeException`?**  
> **A:**  
> - **Domain Specificity & Expressiveness:** Generic exceptions like `IllegalArgumentException` don't convey domain business rules. `OrderCancellationException` captures *why* an order could not be cancelled (e.g. "Order #5002 cannot be cancelled — it is already being prepared or delivered").  
> - **Targeted HTTP Mapping:** `BaseHandler` can catch domain-specific exceptions and map them to appropriate HTTP status codes (e.g., 400 Bad Request, 404 Not Found) with structured JSON messages rather than leaking raw stack traces to clients.

---

### 6. AtomicReference & Non-Blocking Catalog Swapping
**Q: How does `DataCatalogService` update live OpenStreetMap data without locking or crashing active users?**  
> **A:**  
> - `DataCatalogService` uses `AtomicReference<List<Restaurant>> activeCatalog`.  
> - When the server starts, it immediately loads the cached or sample catalog so endpoints are live with **zero startup latency**.  
> - A background daemon thread (`CompletableFuture.runAsync`) queries the Overpass and TheMealDB APIs, parses fresh data, builds a new `List<Restaurant>`, and atomically swaps the reference via `activeCatalog.set(freshList)`.  
> - Readers accessing `activeCatalog.get()` experience **zero lock contention and zero latency overhead**.
