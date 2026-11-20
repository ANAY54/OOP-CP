# ⏱️ ZESTO — 5-Minute Live Viva Presentation Script

> **Time Target:** 5 Minutes  
> **Audience:** Professor / Viva Examiner  
> **Key Goal:** Prove rigorous Java OOP design, pure JDK implementation, and impressive product finish.

---

### ⏱️ MINUTE 0:00 – 1:00 | The Introduction & Pure Java Rule
*“Good morning, Professor. Today I am presenting **Zesto**, a full-stack food delivery application engineered for our Java OOP course.*

*Before opening the UI, I want to emphasize our core architectural principle:*
*Every single business rule, mathematical algorithm, and data model lives exclusively in **pure Java** running on **JDK 17+**.*
- *We used **zero external libraries**—no Maven, no Gradle, no Spring, no Gson.*
- *Our server uses the JDK built-in `com.sun.net.httpserver.HttpServer`.*
- *JSON parsing and serialization was built from scratch in our own `JsonParser` and `JsonWriter`.*
- *The React Native Expo frontend is strictly a thin presentation client.*

*Let me prove this by running our automated test runner and viva console demo directly in the terminal.”*

---

### ⏱️ MINUTE 1:00 – 2:00 | Terminal Viva Proofs (`ConsoleDemo` & `DemoTestRunner`)
1. **Run `com.zesto.DemoTestRunner`:**
   ```powershell
   java -cp out com.zesto.DemoTestRunner
   ```
   *“Here is our pure Java test runner with 7 green test suites covering:*
   - *Financial arithmetic and tax invariant in our immutable `Bill` value object.*
   - *Haversine spherical distance math in `DistanceCalculator`.*
   - *Dynamic delivery fees and ETAs in `PricingPolicy`.*
   - *Offline catalog bootstrapping in `DataCatalogService`.*
   - *Strategy pattern dynamic programming in `MealPlanner`.*
   - *And odd-cent remainder distribution in `BillSplitter`.*

2. **Run `com.zesto.ConsoleDemo`:**
   ```powershell
   java -cp out com.zesto.ConsoleDemo
   ```
   *“And here is our `ConsoleDemo`, illustrating 25 core OOP concepts including:*
   - *Inheritance with `User`, `Customer`, and `DeliveryPartner`.*
   - *Abstract class and interface polymorphism with `FoodItem` and `PaymentProcessor`.*
   - *Factory method and static nested classes like `Order.OrderLine`.*
   - *Custom unchecked exception hierarchies like `OrderCancellationException`.*
   - *And thread synchronization in `DeliveryPartnerService`.”*

---

### ⏱️ MINUTE 2:00 – 3:00 | The App & Real Pune Data Layer
*(Point to the Android Emulator or Web Browser running Zesto)*

*“Now let's examine the application. We designed **Zesto Night**, an ink-black and zest-lime dark interface.*

*Notice the data:*
1. *Restaurant names and coordinates are real locations in Pune sourced from **OpenStreetMap** (e.g. Shaniwar Wada, Koregaon Park, FC Road).*
2. *Dish photography, verified ingredients, and instructions are integrated from **TheMealDB**.*
3. *Our `DataCatalogService` caches this data to disk in `backend/data/catalog.json` with a 24-hour expiration window. If Wi-Fi is disabled right now, the entire server boots immediately from the offline fallback.”*

---

### ⏱️ MINUTE 3:00 – 4:00 | Signature Features: "Feed Me" & "Split Bill"
1. **Show "Feed Me" Smart Planner:**
   - Tap **"Feed Me — Smart Planner"** on Home screen.
   - Set Budget to ₹500, Diners: 2, Diet: Veg.
   - Tap **"Generate Optimal Feast ⚡"**.
   *“Notice what happened here: the request was sent to our Java `MealPlanner`. Using our `KnapsackStrategy` dynamic programming engine, Java solved the 0/1 knapsack problem to pick the highest satisfaction meal combination from a single Pune kitchen without exceeding ₹500.*
   - Tap **"Add All To Cart & Checkout 🛒"**.

2. **Show "Order it or Cook it" Recipe Engine:**
   - Open any restaurant menu.
   - Tap **"👨‍🍳 Recipe"** on *Paneer Butter Masala*.
   *“Students often want to cook at home rather than order out. Our `DishHandler` returns verified measured ingredients and cooking steps, with a direct link to watch the YouTube recipe.”*

3. **Show "Split the Bill":**
   - Open Cart, view the bill breakdown, and tap **"Split Bill with Friends"**.
   - Select 3 friends.
   *“Here is our `BillSplitter` in action: Notice how odd cents are distributed so that the sum of each friend's share equals the total bill down to the exact paisa.”*

---

### ⏱️ MINUTE 4:00 – 5:00 | Multithreaded Orders & Live Rider Simulation
1. **Place the Order:**
   - Tap **"Place Order"**.
   - Show the Order Success screen and navigate to **Orders**.
2. **Explain Background Multithreading:**
   *“When the order was placed, Java's `OrderService` assigned a delivery partner from a synchronized pool and spawned an `OrderProgressTask` as a background daemon thread.*
   *The field `Order.status` is marked `volatile` to guarantee immediate memory visibility across CPU cores as the order transitions from Placed -> Preparing -> On the Way -> Delivered.”*
3. **Show Live Rider GPS Tracking:**
   - Tap **"Live Rider GPS Tracking"**.
   - Show the moving GPS marker, live coordinates, and ETA.
   *“`RiderSimulator` in pure Java uses geospatial linear interpolation between the restaurant coordinates and customer coordinates to simulate the delivery partner's live journey.”*
4. **Show Profile & Achievements:**
   - Open Profile tab.
   - Point out the **Achievements & Streaks** section.
   *“Finally, our `AchievementService` evaluates the customer's order history using polymorphic rule implementations like `FirstOrderAchievement` and `VegWarriorAchievement`.*

*Thank you, Professor. I am ready to answer your questions.”*
