# 🍋 Zesto — Gourmet Food Delivery & Culinary Companion

> **College Java OOP Viva Showcase Project (2026)**  
> **Backend:** Pure Java (JDK 17+, zero external libraries, zero frameworks)  
> **Frontend:** React Native (Expo, "Zesto Night" Dark Design System)

---

## 📋 Executive Overview

**Zesto** (meaning *citrus zest*) is a full-stack food delivery and culinary discovery application engineered specifically to demonstrate **Object-Oriented Programming (OOP) mastery in pure Java**. 

Unlike standard clone apps, Zesto features a **strictly thin UI layer**—all business logic, mathematical computations, algorithms, pricing, distance equations, and gamification rules reside solely within **pure Java classes** built on standard JDK APIs (`com.sun.net.httpserver`, `java.net.http.HttpClient`, `java.nio.file`, `java.util.concurrent`).

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                            ZESTO NIGHT (React Native Expo)                        |
|   • Sora Bold Typography • Lime-Zest (#B8F23B) Accent • Ink Black (#0B0D10)      |
|   • Android Emulator (10.0.2.2:8080) & Web Browser (localhost:8080) Supported     |
+-----------------------------------------------------------------------------------+
                                        |  REST HTTP / JSON
                                        v
+-----------------------------------------------------------------------------------+
|                        PURE JAVA BACKEND (JDK 17+, Port 8080)                     |
|  com.sun.net.httpserver.HttpServer  • Custom JsonParser & JsonWriter (No Gson)    |
+-----------------------------------------------------------------------------------+
| MODEL LAYER               | SERVICE LAYER               | ALGORITHMIC ENGINES     |
| • User / Customer         | • RestaurantService         | • MealPlanner (Strategy)|
| • DeliveryPartner         | • DataCatalogService        |   - Knapsack 0/1 DP     |
| • FoodItem (Abstract)     | • OrderService              |   - Greedy Heuristic    |
|   - VegItem               | • ReviewService             | • DistanceCalculator    |
|   - NonVegItem            | • OfferService              |   (Haversine Spherical) |
|   - Beverage              | • CustomerService           | • PricingPolicy         |
| • Order (Static nested)   | • AchievementService        | • BillSplitter          |
| • Bill (Value Object)     | • PersistenceService        |   (Odd-cent invariant)  |
| • PaymentProcessor (Intf) | • RiderSimulator            | • MoodScorer            |
+-----------------------------------------------------------------------------------+
                                        |
                 +----------------------+----------------------+
                 | (Startup warm-up)                           |
                 v                                             v
      OpenStreetMap (Overpass API)                   TheMealDB Culinary API
   © OpenStreetMap contributors                     Real photos, recipes, measures
```

---

## 🎯 6 Signature Features (All Driven by Java OOP)

### 1. 🍱 "Feed Me" Smart Budget Meal Planner
- **Java OOP Concepts:** Strategy Pattern (`MealPlanStrategy`), Polymorphism, Dynamic Programming (`KnapsackStrategy`), Greedy Algorithm (`GreedyStrategy`).
- **How it works:** The user enters their budget, number of diners, diet preference (Veg/Non-Veg/Jain), and maximum spice tolerance. The Java Knapsack algorithm treats budget as capacity and food item prices as weights, selecting the mathematically optimal combination from a single Pune restaurant.
- **Endpoint:** `POST /meal-plan`

### 2. 👨‍🍳 "Order it or Cook it" Recipe Engine
- **Java OOP Concepts:** External API encapsulation, Caching, Fault-tolerant fallbacks, Custom Exception (`ExternalApiException`).
- **How it works:** Users can either order dishes or cook them at home. The app fetches chef recipes verified from TheMealDB API, presenting exact measured ingredients, step-by-step cooking methods, and a YouTube video tutorial.
- **Endpoint:** `GET /dishes/{id}/recipe`

### 3. 👥 Split the Bill (Odd-Cent Precision Invariant)
- **Java OOP Concepts:** Invariant maintenance, Financial precision, Encapsulation.
- **How it works:** Dividing ₹100 among 3 people naively produces ₹33.33 × 3 = ₹99.99 (losing ₹0.01). `BillSplitter` calculates remainder cents and distributes them so that **$\sum \text{Shares} \equiv \text{Total}$ exactly**.
- **Endpoint:** `POST /bill-split`

### 4. 🍲 Mood Matcher Recommendation Engine
- **Java OOP Concepts:** Streams & Lambdas, Custom Comparator, Multi-criteria scoring.
- **How it works:** Scores and ranks dishes based on five emotional cravings: Comfort, Spicy, Light, Sweet, and Quick.
- **Endpoint:** `GET /mood-dishes?mood=...`

### 5. 🏆 Achievements & Streaks Gamification
- **Java OOP Concepts:** Interface Segregation, Polymorphism, Open/Closed Principle.
- **How it works:** `AchievementService` evaluates customer order history against rules: `FirstOrderAchievement` (First Feast), `VegWarriorAchievement` (3 pure veg orders), `SpiceMasterAchievement` (fiery dishes), `NightOwlAchievement`, and `BigSpenderAchievement`.
- **Endpoint:** `GET /achievements?email=...`

### 6. 🛵 Simulated Real-Time GPS Rider Tracking
- **Java OOP Concepts:** Linear interpolation math, Daemon multithreading, State Pattern (`OrderStatus`).
- **How it works:** `RiderSimulator` interpolates real-time GPS coordinates between the restaurant and customer coordinates based on order status and elapsed seconds.
- **Endpoint:** `GET /orders/{id}/rider`

---

## 🛠️ Complete Java OOP Concepts Matrix

| OOP Concept | Java Class / Interface | Explanation for Viva |
|:---|:---|:---|
| **Inheritance** | `Customer extends User`, `DeliveryPartner extends User`, `VegItem extends FoodItem` | Code reuse and "is-a" relationship modeling |
| **Polymorphism** | `PaymentProcessor`, `MealPlanStrategy`, `Achievement` | Dynamic method dispatch at runtime based on concrete implementation |
| **Abstraction** | `abstract class FoodItem`, `interface RestaurantProvider` | Hides implementation details and enforces uniform interface contracts |
| **Encapsulation** | `Bill`, `Order`, `Customer` | Private fields with validated getters and immutability guards |
| **Strategy Pattern** | `MealPlanner` with `KnapsackStrategy` & `GreedyStrategy` | Interchangeable algorithmic meal planning behaviors |
| **Factory Method** | `PaymentProcessorFactory.forMode(mode)` | Decouples payment processor creation from usage |
| **Static Nested Class** | `Order.OrderLine` | Logically binds receipt line items to orders without outer instance overhead |
| **Builder Pattern** | `Review.Builder` | Clean construction of complex review objects |
| **Comparable Interface** | `FoodItem implements Comparable<FoodItem>` | Natural ordering of dishes by price for sorting algorithms |
| **Custom Exceptions** | `ZestoException`, `EmptyCartException`, `InvalidCouponException`, `OrderCancellationException` | Domain-specific error handling with hierarchy |
| **Multithreading** | `OrderProgressTask`, `DataCatalogService` async thread | Background order status transitions & non-blocking cache warm-up |
| **Synchronization** | `DeliveryPartnerService.assignAvailable()`, `synchronized` | Thread-safe delivery fleet pool management |
| **Volatile** | `Order.status`, `Order.deliveryPartner` | Guarantees memory visibility across worker and HTTP threads |
| **Atomic Reference** | `AtomicReference<List<Restaurant>>` | Lock-free, zero-contention atomic swapping of the active restaurant catalog |
| **File I/O Persistence** | `PersistenceService`, `DataCatalogService` | Serializes and reloads state to disk using custom JSON engine |
| **Generics** | `Repository<T extends Identifiable>` | Type-safe in-memory entity storage |
| **Streams & Lambdas** | `RestaurantService.search()`, `MoodScorer`, `BillSplitter` | Modern functional data filtering, mapping, and sorting |

---

## 🚀 How to Run the Complete Project

### 1. Run Pure Java Backend

```powershell
# Open terminal in backend/src/main/java
cd d:\zesto\backend\src\main\java

# Compile cleanly
javac -encoding UTF-8 -d out (Get-ChildItem -Recurse -Filter *.java | ForEach-Object FullName)

# Option A: Start the HTTP Server on Port 8080
java -cp out com.zesto.Main

# Option B: Run 25-Concept Console Viva Demo
java -cp out com.zesto.ConsoleDemo

# Option C: Run 7-Suite Pure Java Unit Test Runner
java -cp out com.zesto.DemoTestRunner
```

### 2. Run the React Native "Zesto Night" App

```powershell
# Open terminal in zesto-app
cd d:\zesto\zesto-app

# Run on Android Emulator (e.g. Pixel 6 running emulator-5554)
npx expo start --android

# Run in Web Browser (Chrome / Edge)
npx expo start --web
```

---

## 🌐 Complete API Reference

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/restaurants` | List all restaurants (supports `?q=` and `?cuisine=`) |
| `GET` | `/restaurants/{id}` | Get full restaurant details and complete menu |
| `GET` | `/items?q=` | Search dishes across all restaurants |
| `GET` | `/dishes/{id}/recipe` | Fetch chef recipe (ingredients, instructions, YouTube) |
| `POST` | `/meal-plan` | Smart meal planner (Knapsack DP / Greedy) |
| `POST` | `/bill-split` | Odd-cent precise bill splitter |
| `GET` | `/mood-dishes?mood=` | Mood-matched dish recommendations |
| `GET` | `/achievements?email=` | Gamification badges and streak progress |
| `GET` | `/orders/{id}/rider` | Simulated live GPS coordinates and rider ETA |
| `GET` | `/offers` | Available coupon codes and discount tiers |
| `POST` | `/login` | Customer authentication and registration |
| `GET/POST`| `/profile` | View profile or update delivery address |
| `POST` | `/orders/preview` | Preview bill with tax, discount & dynamic distance fee |
| `POST` | `/orders` | Place order and trigger live background tracking |
| `GET` | `/orders?email=` | Order history for customer |
| `POST` | `/orders/cancel` | Cancel an order before preparation starts |
| `GET` | `/reviews?restaurantId=`| Customer star ratings and text reviews |
| `POST` | `/reviews` | Submit a customer rating and review |

---

## 📜 Attributions & Credits

- **OpenStreetMap:** Pune restaurant names, cuisines, and coordinates are derived from OpenStreetMap data (© OpenStreetMap contributors).
- **TheMealDB:** Culinary photography, ingredients, and recipe instructions are powered by TheMealDB API.
- **Simulated Demo Data:** Prices, customer ratings, review counts, delivery driver dispatching, and live GPS movements are mathematically simulated for college viva demonstration purposes.
