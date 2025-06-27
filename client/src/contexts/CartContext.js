// client/src/contexts/CartContext.js - FIXED VERSION
import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";

const CartContext = createContext();

const ACTIONS = {
  ADD: "ADD",
  REMOVE: "REMOVE",
  UPDATE: "UPDATE",
  CLEAR: "CLEAR",
  LOAD: "LOAD",
};

const initialState = {
  items: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD: {
      const { item, quantity = 1 } = action.payload;
      console.log('🔄 Reducer ADD_ITEM:', item.name, 'quantity:', quantity); // Debug log
      
      const existing = state.items.find((i) => i.id === item._id);
      if (existing) {
        console.log('🔄 Updating existing item quantity'); // Debug log
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === item._id ? { ...i, quantity: i.quantity + quantity } : i
          ),
        };
      }
      
      console.log('🔄 Adding new item to cart'); // Debug log
      return {
        ...state,
        items: [
          ...state.items,
          {
            id: item._id,
            name: item.name,
            price: item.price,
            image: item.image,
            type: item.type,
            breed: item.breed,
            quantity,
          },
        ],
      };
    }

    case ACTIONS.REMOVE:
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload.id),
      };

    case ACTIONS.UPDATE:
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };

    case ACTIONS.CLEAR:
      return { ...state, items: [] };

    case ACTIONS.LOAD:
      return { ...state, items: action.payload.items };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const lastAddedRef = useRef({ itemId: null, timestamp: 0 }); // Prevent duplicates

  useEffect(() => {
    const stored = localStorage.getItem("furbabies_cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        dispatch({ type: ACTIONS.LOAD, payload: { items: parsed.items || [] } });
      } catch (err) {
        console.error("Failed to parse stored cart:", err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("furbabies_cart", JSON.stringify(state));
  }, [state]);

  const addToCart = (item, quantity = 1) => {
    console.log('🛒 addToCart called with:', item.name, 'quantity:', quantity); // Debug log
    
    const now = Date.now();
    const itemId = item._id || item.id;
    
    // If same item was added within 500ms, ignore (duplicate prevention)
    if (lastAddedRef.current.itemId === itemId && 
        now - lastAddedRef.current.timestamp < 500) {
      console.log('🛒 Duplicate add detected within 500ms, ignoring'); // Debug log
      return;
    }
    
    // Update the last added reference
    lastAddedRef.current = { itemId, timestamp: now };
    
    console.log('🛒 Dispatching ADD action'); // Debug log
    dispatch({ type: ACTIONS.ADD, payload: { item, quantity } });
  };

  const removeFromCart = (id) =>
    dispatch({ type: ACTIONS.REMOVE, payload: { id } });

  const updateQuantity = (id, quantity) =>
    dispatch({ type: ACTIONS.UPDATE, payload: { id, quantity } });

  const clearCart = () => dispatch({ type: ACTIONS.CLEAR });

  const cartCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};