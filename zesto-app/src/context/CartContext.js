import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert } from 'react-native';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [restaurant, setRestaurant] = useState(null);
  const [lines, setLines] = useState({}); // itemId -> { item, quantity }

  const addItem = useCallback(
    (rest, item) => {
      const put = (reset) => {
        setRestaurant({ id: rest.id, name: rest.name });
        setLines((prev) => {
          const base = reset ? {} : prev;
          const current = base[item.id];
          return {
            ...base,
            [item.id]: { item, quantity: current ? current.quantity + 1 : 1 },
          };
        });
      };

      const otherRestaurant =
        restaurant && restaurant.id !== rest.id && Object.keys(lines).length > 0;

      if (otherRestaurant) {
        Alert.alert(
          'Start a new cart?',
          `Your cart has items from ${restaurant.name}. Clear it and add this item from ${rest.name} instead?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes, start new', style: 'destructive', onPress: () => put(true) },
          ]
        );
      } else {
        put(false);
      }
    },
    [restaurant, lines]
  );

  const removeItem = useCallback((itemId) => {
    setLines((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const next = { ...prev };
      if (current.quantity <= 1) {
        delete next[itemId];
      } else {
        next[itemId] = { ...current, quantity: current.quantity - 1 };
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRestaurant(null);
    setLines({});
  }, []);

  const value = useMemo(() => {
    const list = Object.values(lines);
    return {
      restaurant,
      lines: list,
      count: list.reduce((n, l) => n + l.quantity, 0),
      subtotal: list.reduce((sum, l) => sum + l.item.price * l.quantity, 0),
      quantityOf: (itemId) => (lines[itemId] ? lines[itemId].quantity : 0),
      addItem,
      removeItem,
      clear,
    };
  }, [restaurant, lines, addItem, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);