package com.zesto.service;

import java.util.ArrayList;
import java.util.List;
import com.zesto.model.Beverage;
import com.zesto.model.Cuisine;
import com.zesto.model.FoodItem;
import com.zesto.model.NonVegItem;
import com.zesto.model.Restaurant;
import com.zesto.model.VegItem;

/**
 * OOP CONCEPTS DEMONSTRATED:
 *   - Interface Implementation (implements RestaurantProvider, MenuProvider)
 *   - Guaranteed Fallback Strategy (provides offline-first, reliable fallback data)
 *   - Polymorphism (instantiates VegItem, NonVegItem, Beverage and returns as List<FoodItem>)
 *   - Encapsulation (helper factory methods hide construction details)
 *
 * Provides accurate, famous Pune restaurants (FC Road, Camp, Koregaon Park, Deccan, Sadashiv Peth).
 */
public class SampleRestaurantProvider implements RestaurantProvider, MenuProvider {

    @Override
    public String getProviderName() {
        return "SamplePuneIconicProvider";
    }

    @Override
    public List<FoodItem> fetchMenuFor(Restaurant restaurant) {
        return new ArrayList<>(restaurant.getMenu());
    }

    private static void veg(Restaurant r, String name, double price, String desc, String img) {
        r.addItem(new VegItem(name, price, r.getCuisine(), false, desc, img));
    }

    private static void jain(Restaurant r, String name, double price, String desc, String img) {
        r.addItem(new VegItem(name, price, r.getCuisine(), true, desc, img));
    }

    private static void nonVeg(Restaurant r, String name, double price, int spice, String desc, String img) {
        r.addItem(new NonVegItem(name, price, r.getCuisine(), spice, desc, img));
    }

    private static void drink(Restaurant r, String name, double price, int sizeMl, boolean cold, String desc, String img) {
        r.addItem(new Beverage(name, price, sizeMl, cold, desc, img));
    }

    @Override
    public List<Restaurant> fetchRestaurants() {
        List<Restaurant> list = new ArrayList<>();

        // 1. Vaishali — FC Road
        Restaurant r1 = new Restaurant("Vaishali", Cuisine.SOUTH_INDIAN, 4.8, 22,
                "FC Road, Deccan Gymkhana, Pune", 18.5222, 73.8415, 350, 4800, "Pune's #1 Legend");
        r1.setPureVeg(true);
        r1.setImageUrl("https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80");
        veg(r1, "Mysore Masala Dosa", 120, "Crispy golden crepe with spicy red chutney and spiced potato mash",
                "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg");
        veg(r1, "Special SPDP", 110, "Sev Potato Dahi Puri loaded with chilled yoghurt and tangy chutney",
                "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80");
        jain(r1, "Steamed Idli Sambar", 80, "Pillowy rice cakes served with aromatic lentil stew and coconut chutney",
                "https://www.themealdb.com/images/media/meals/utxwwv1468314545.jpg");
        veg(r1, "Crispy Medu Vada", 90, "Golden fried lentil fritters with crispy crust and fluffy center",
                "https://www.themealdb.com/images/media/meals/1529445434.jpg");
        veg(r1, "Onion Uttapam", 115, "Thick savoury pancake topped with caramelized red onions and green chilies",
                "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80");
        veg(r1, "Upma with Pure Ghee", 80, "Roasted semolina tempered with mustard seeds, curry leaves, and cashews",
                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80");
        drink(r1, "South Indian Filter Coffee", 60, 180, false, "Frothy, strong chicory coffee served in traditional dabarah",
                "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80");
        list.add(r1);

        // 2. Cafe Goodluck — Deccan
        Restaurant r2 = new Restaurant("Cafe Goodluck", Cuisine.FAST_FOOD, 4.7, 20,
                "FC Road, Deccan Gymkhana, Pune", 18.5175, 73.8413, 380, 5200, "Since 1935");
        r2.setImageUrl("https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80");
        veg(r2, "Bun Maska & Irani Chai", 85, "Soft bun generously spread with homemade Amul butter paired with Irani tea",
                "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80");
        nonVeg(r2, "Chicken Keema Pav", 210, 2, "Minced chicken braised with onions, tomatoes and secret Irani spices",
                "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80");
        nonVeg(r2, "Mutton Keema Ghotala", 260, 3, "Spicy minced mutton cooked with scrambled farm egg and butter pav",
                "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80");
        veg(r2, "Irani Caramel Custard", 95, "Silky steamed egg and milk pudding drenched in golden caramel syrup",
                "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80");
        veg(r2, "Cheese Omelette Pav", 130, "Double-egg fluffy omelette oozing with molten melted cheese",
                "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800&auto=format&fit=crop&q=80");
        nonVeg(r2, "Goodluck Chicken Biryani", 270, 2, "Fragrant long-grain basmati layered with tender chicken pieces",
                "https://www.themealdb.com/images/media/meals/xr0n4r1576788363.jpg");
        drink(r2, "Special Irani Chai", 45, 150, false, "Slow-brewed condensed milk Irani tea with aromatic mawa notes",
                "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80");
        list.add(r2);

        // 3. German Bakery — Koregaon Park
        Restaurant r3 = new Restaurant("German Bakery", Cuisine.ITALIAN, 4.6, 28,
                "North Main Road, Koregaon Park, Pune", 18.5378, 73.8966, 750, 3600, "Iconic KP Spot");
        r3.setImageUrl("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80");
        veg(r3, "German Apple Crumble", 190, "Baked spiced apples under buttery cinnamon streusel, served warm",
                "https://www.themealdb.com/images/media/meals/xvsurr1511719182.jpg");
        veg(r3, "Red Velvet Pastry", 180, "Vibrant cocoa sponge layered with rich cream cheese frosting",
                "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800&auto=format&fit=crop&q=80");
        veg(r3, "Woodfired Margherita Pizza", 360, "San Marzano tomatoes, fresh buffalo mozzarella and garden basil",
                "https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg");
        nonVeg(r3, "Penne Alfredo with Chicken", 380, 1, "Al dente penne in velvety parmesan cream sauce with grilled herb chicken",
                "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&auto=format&fit=crop&q=80");
        veg(r3, "Blueberry Cheesecake Slice", 210, "New York style baked cream cheesecake topped with wild blueberry compote",
                "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80");
        nonVeg(r3, "German Bakery Keema Pav", 240, 2, "Savory chicken keema paired with toasted butter pav",
                "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80");
        drink(r3, "Signature Iced Mocha", 160, 350, true, "Double espresso shot blended with Belgian dark chocolate and milk",
                "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80");
        list.add(r3);

        // 4. Kayani Bakery — Camp
        Restaurant r4 = new Restaurant("Kayani Bakery", Cuisine.DESSERTS, 4.9, 25,
                "East Street, Camp, Pune", 18.5133, 73.8797, 300, 6400, "World Famous");
        r4.setPureVeg(true);
        r4.setImageUrl("https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80");
        veg(r4, "Shrewsbury Biscuits (500g)", 240, "World-renowned buttery melt-in-mouth Puneri biscuits",
                "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop&q=80");
        veg(r4, "Parsi Mawa Cake", 180, "Rich cardamom-infused butter cake made with caramelized mawa",
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80");
        veg(r4, "Brazil Nut Cookies", 200, "Crunchy cookies studded with toasted premium nuts",
                "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&auto=format&fit=crop&q=80");
        veg(r4, "Fresh Cream Vanilla Rolls", 60, "Crispy puff pastry horns filled with sweet vanilla dairy cream",
                "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80");
        veg(r4, "Chocolate Walnut Cake", 220, "Dense dark chocolate sponge packed with crunchy roasted walnuts",
                "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80");
        list.add(r4);

        // 5. George Restaurant — Camp
        Restaurant r5 = new Restaurant("George Restaurant", Cuisine.NORTH_INDIAN, 4.6, 30,
                "East Street, Camp, Pune", 18.5144, 73.8789, 650, 3900, "Mughlai Royalty");
        r5.setImageUrl("https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80");
        nonVeg(r5, "Chicken Dum Biryani", 310, 2, "Aromatic basmati rice cooked on dum with marinated chicken cuts",
                "https://www.themealdb.com/images/media/meals/xr0n4r1576788363.jpg");
        nonVeg(r5, "Butter Chicken", 350, 1, "Tender tandoor-roasted chicken simmered in silky tomato cashew makhani",
                "https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg");
        nonVeg(r5, "Mutton Rogan Josh", 390, 3, "Slow-cooked Kashmiri mutton curry flavored with alkanet root and fennel",
                "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80");
        veg(r5, "Dal Makhani", 210, "Black lentils and kidney beans slow simmered overnight with farm butter",
                "https://www.themealdb.com/images/media/meals/1529446352.jpg");
        veg(r5, "Paneer Tikka Masala", 260, "Charcoal-grilled cottage cheese cubes in spiced onion tomato gravy",
                "https://www.themealdb.com/images/media/meals/qptpvt1487339892.jpg");
        veg(r5, "Butter Garlic Naan", 70, "Fluffy clay-oven baked bread brushed with garlic butter",
                "https://www.themealdb.com/images/media/meals/wxywrq1468235067.jpg");
        drink(r5, "Gulab Jamun with Rabdi", 120, 200, false, "Golden milk dumplings served warm with reduced saffron rabdi",
                "https://www.themealdb.com/images/media/meals/adxcbq1619787919.jpg");
        list.add(r5);

        // 6. Blue Nile — Bund Garden
        Restaurant r6 = new Restaurant("Blue Nile", Cuisine.NORTH_INDIAN, 4.7, 28,
                "Bund Garden Road, Agarkar Nagar, Pune", 18.5238, 73.8798, 700, 4200, "Biryani Legend");
        r6.setImageUrl("https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80");
        nonVeg(r6, "Irani Mutton Dum Biryani", 390, 2, "Legendary Persian spiced basmati rice with fall-off-the-bone mutton",
                "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80");
        nonVeg(r6, "Persian Chelo Kebab", 380, 1, "Succulent minced meat skewers served with buttered rice and grilled tomatoes",
                "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80");
        nonVeg(r6, "Tandoori Chicken Half", 280, 2, "Whole chicken marinated in mustard oil, yoghurt and Kashmiri chili",
                "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800&auto=format&fit=crop&q=80");
        veg(r6, "Paneer Butter Masala", 260, "Soft paneer in velvet cream gravy",
                "https://www.themealdb.com/images/media/meals/qptpvt1487339892.jpg");
        drink(r6, "Sweet Kesar Lassi", 80, 300, true, "Rich yogurt smoothie crowned with saffron strands and malai",
                "https://images.unsplash.com/photo-1571006687898-3bf40d348a04?w=800&auto=format&fit=crop&q=80");
        list.add(r6);

        // 7. Marz-O-Rin — Camp
        Restaurant r7 = new Restaurant("Marz-O-Rin", Cuisine.FAST_FOOD, 4.8, 24,
                "MG Road, Camp, Pune", 18.5167, 73.8776, 280, 5600, "Since 1965");
        r7.setImageUrl("https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80");
        nonVeg(r7, "Shredded Chicken Sandwich", 95, 1, "Marz-O-Rin's iconic sandwich with tender mayo chicken on brown bread",
                "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80");
        veg(r7, "Chutney Cheese Sandwich", 75, "Pune's favorite spicy coriander mint chutney and cheddar sandwich",
                "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80");
        veg(r7, "Baked Macaroni & Cheese", 130, "Comforting elbow pasta baked with creamy bechamel and melted cheese",
                "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop&q=80");
        drink(r7, "Thick Cold Coffee", 80, 350, true, "Classic retro cold coffee served ice cold with chocolate drizzle",
                "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80");
        veg(r7, "Rich Plum Cake Slice", 65, "Traditional recipe loaded with rum-soaked raisins and candied peels",
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80");
        list.add(r7);

        // 8. Sujata Mastani — Sadashiv Peth
        Restaurant r8 = new Restaurant("Sujata Mastani", Cuisine.DESSERTS, 4.9, 18,
                "Sadashiv Peth, Tilak Road, Pune", 18.5118, 73.8528, 240, 7100, "Pune's Signature Creation");
        r8.setPureVeg(true);
        r8.setImageUrl("https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=80");
        drink(r8, "Alphonso Mango Mastani", 130, 350, true, "Thick mango shake topped with Alphonso ice cream, tutty fruity & almonds",
                "https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop&q=80");
        drink(r8, "Kesar Pista Mastani", 140, 350, true, "Royal saffron milk shake crowned with rich pistachio ice cream",
                "https://images.unsplash.com/photo-1571006687898-3bf40d348a04?w=800&auto=format&fit=crop&q=80");
        drink(r8, "Dry Fruit Royal Mastani", 160, 350, true, "Loaded with cashews, almonds, raisins, and double ice cream scoop",
                "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=80");
        drink(r8, "Rose Gulkand Mastani", 120, 350, true, "Cooling rose milkshake with sweet gulkand and vanilla ice cream",
                "https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80");
        list.add(r8);

        // 9. Katakirr Misal — Erandwane
        Restaurant r9 = new Restaurant("Katakirr Misal", Cuisine.FAST_FOOD, 4.7, 20,
                "Karve Road, Erandwane, Pune", 18.5065, 73.8329, 220, 5800, "Puneri Misal King");
        r9.setPureVeg(true);
        r9.setImageUrl("https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80");
        veg(r9, "Kolhapuri Tikhat Misal Pav", 110, "Fiery spicy red gravy misal with crunchy farsan, sprouted moth and pav",
                "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80");
        veg(r9, "Medium Puneri Misal Pav", 110, "Classic balanced spice Puneri misal served with fresh lemon and chopped onion",
                "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80");
        drink(r9, "Spiced Mattha Buttermilk", 35, 250, true, "Refreshing digestive churned curd seasoned with ginger, cumin and green chili",
                "https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80");
        veg(r9, "Warm Gulab Jamun (2 pcs)", 60, "Classic sweet dumplings to soothe the spicy misal palate",
                "https://www.themealdb.com/images/media/meals/adxcbq1619787919.jpg");
        list.add(r9);

        // 10. Burger - Camp
        Restaurant r10 = new Restaurant("Burger - Camp", Cuisine.FAST_FOOD, 4.8, 22,
                "East Street, Camp, Pune", 18.5126, 73.8791, 320, 6200, "Cult Favorite");
        r10.setImageUrl("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80");
        nonVeg(r10, "The King Burger", 180, 2, "Massive crispy fried chicken patty with coleslaw and secret mustard sauce",
                "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80");
        nonVeg(r10, "Mini Chicken Burger", 120, 1, "Pune's favorite pocket-sized chicken burger in toasted sesame bun",
                "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80");
        veg(r10, "Jumbo Veg Cheese Burger", 130, "Spiced potato corn patty loaded with melted cheese slice and lettuce",
                "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&auto=format&fit=crop&q=80");
        veg(r10, "Crumb-Fried French Fries", 80, "Golden crispy potato batons tossed with peri peri salt",
                "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80");
        drink(r10, "Chocolate Milkshake", 85, 350, true, "Thick chocolate dairy milkshake",
                "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80");
        list.add(r10);

        // 11. Chitale Bandhu Mithaiwale — Bajirao Road
        Restaurant r11 = new Restaurant("Chitale Bandhu", Cuisine.DESSERTS, 4.9, 20,
                "Bajirao Road, Sadashiv Peth, Pune", 18.5123, 73.8535, 300, 6800, "Pune Heritage Icon");
        r11.setPureVeg(true);
        r11.setImageUrl("https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop&q=80");
        veg(r11, "Puneri Bakarwadi (500g)", 190, "Crispy fried dough spiral stuffed with sweet, tangy and spicy coconut poppy seed masala",
                "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop&q=80");
        veg(r11, "Amba Barfi (250g)", 240, "Two-layered royal sweet made with pure Alphonso mango pulp and condensed milk mawa",
                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80");
        veg(r11, "Kaju Katli (250g)", 320, "Diamond-shaped cashew fudge finished with delicate edible silver leaf",
                "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop&q=80");
        drink(r11, "Kesar Shrikhand (500g)", 150, 500, true, "Traditional strained yogurt sweet flavored with green cardamom and saffron",
                "https://images.unsplash.com/photo-1571006687898-3bf40d348a04?w=800&auto=format&fit=crop&q=80");
        list.add(r11);

        // 12. Shabree — FC Road
        Restaurant r12 = new Restaurant("Shabree", Cuisine.MULTI_CUISINE, 4.7, 30,
                "FC Road, Deccan Gymkhana, Pune", 18.5230, 73.8410, 750, 4100, "Authentic Maharashtrian");
        r12.setPureVeg(true);
        r12.setImageUrl("https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80");
        veg(r12, "Shabree Executive Maharashtrian Thali", 380, "Complete thali with Puran Poli, Pitla, Bhakri, Aamti, Koshimbir and Basundi",
                "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80");
        veg(r12, "Puran Poli with Pure Ghee", 110, "Sweet flatbread stuffed with spiced jaggery and chana dal served with hot ghee",
                "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80");
        veg(r12, "Pitla Bhakri with Thecha", 190, "Gram flour curry paired with hot jowar bhakri and fiery green chili thecha",
                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80");
        drink(r12, "Chilled Solkadhi", 60, 200, true, "Pink digestive drink made of coconut milk, kokum and crushed garlic",
                "https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80");
        list.add(r12);

        // 13. Malaka Spice — Koregaon Park
        Restaurant r13 = new Restaurant("Malaka Spice", Cuisine.CHINESE, 4.8, 35,
                "Lane 5, Koregaon Park, Pune", 18.5397, 73.8988, 950, 3400, "Pan-Asian Fine Dine");
        r13.setImageUrl("https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop&q=80");
        nonVeg(r13, "Thai Green Chicken Curry", 420, 2, "Authentic galangal, lemongrass and coconut curry served with jasmine rice",
                "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&auto=format&fit=crop&q=80");
        veg(r13, "Vietnamese Crispy Spring Rolls", 290, "Crispy rice paper parcels stuffed with glass noodles and Asian mushrooms",
                "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80");
        nonVeg(r13, "Nasi Goreng Kampung", 390, 2, "Indonesian fried rice with chicken satay skewers and fried sunny egg",
                "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80");
        drink(r13, "Lemongrass Iced Tea", 110, 350, true, "Brewed black tea infused with fresh garden lemongrass and lime",
                "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80");
        list.add(r13);

        // 14. Terttulia — Koregaon Park
        Restaurant r14 = new Restaurant("Terttulia", Cuisine.ITALIAN, 4.6, 35,
                "Road 5, Koregaon Park, Pune", 18.5372, 73.8954, 900, 2900, "Bistro & Pizzeria");
        r14.setImageUrl("https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80");
        veg(r14, "Truffle Mushroom Woodfired Pizza", 460, "Shiitake and button mushrooms, fontina cheese, truffle oil drizzle",
                "https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg");
        nonVeg(r14, "BBQ Smoked Chicken Pizza", 490, 2, "Hickory smoked chicken, caramelized onions and fresh mozzarella",
                "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80");
        veg(r14, "Creamy Burrata Salad", 340, "Pugliese burrata cheese with heirloom tomatoes, basil pesto and balsamic glaze",
                "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80");
        drink(r14, "Virgin Berry Mojito", 150, 350, true, "Muddled mixed berries, fresh mint, lime and sparkling soda",
                "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80");
        list.add(r14);

        // 15. Durvankur Dining Hall — Sadashiv Peth
        Restaurant r15 = new Restaurant("Durvankur Dining Hall", Cuisine.MULTI_CUISINE, 4.8, 25,
                "Tilak Road, Sadashiv Peth, Pune", 18.5098, 73.8502, 550, 4700, "Unlimited Thali Icon");
        r15.setPureVeg(true);
        r15.setImageUrl("https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80");
        veg(r15, "Durvankur Traditional Feast Thali", 260, "Famous unlimited Maharashtrian vegetarian feast with sweets",
                "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80");
        veg(r15, "Dal Khichdi Tadka with Ghee", 180, "Soulful comfort rice and lentils tempered with garlic and cumin ghee",
                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80");
        veg(r15, "Ukdiche Modak (2 pcs)", 120, "Steamed rice flour dumplings stuffed with fresh coconut, jaggery and cardamom",
                "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop&q=80");
        drink(r15, "Masala Chaas", 40, 250, true, "Chilled spiced buttermilk with roasted cumin",
                "https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80");
        list.add(r15);

        // 16. Cream Craver — FC Road
        Restaurant r16 = new Restaurant("Cream Craver", Cuisine.FAST_FOOD, 4.6, 22,
                "FC Road, Deccan Gymkhana, Pune", 18.5215, 73.8420, 420, 3800, "Butter Pav Bhaji Best");
        r16.setPureVeg(true);
        r16.setImageUrl("https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80");
        veg(r16, "Special Amul Butter Pav Bhaji", 180, "Slow-mashed spiced vegetable curry topped with a slab of melting butter",
                "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80");
        veg(r16, "Cheese Pav Bhaji", 210, "Signature pav bhaji smothered with shredded mozzarella and cheddar",
                "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80");
        veg(r16, "Punjabi Chole Bhature", 210, "Spicy chickpea curry paired with giant fluffy puffed bhaturas",
                "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80");
        drink(r16, "Royal Dry Fruit Falooda", 150, 350, true, "Rose syrup, sabja seeds, vermicelli, rich vanilla ice cream, and pistachios",
                "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=80");
        list.add(r16);

        return list;
    }
}
