import { createContext, useContext, useState, useCallback, ReactNode, FC } from 'react';
import { Game } from './gameData';

export interface CartItem {
  game: Game;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (game: Game) => void;
  removeItem: (gameId: string) => void;
  updateQuantity: (gameId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

// Cart context for global state
const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((game: Game) => {
    setItems(prev => {
      const existing = prev.find(i => i.game.id === game.id);
      if (existing) return prev.map(i => i.game.id === game.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { game, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((gameId: string) => {
    setItems(prev => prev.filter(i => i.game.id !== gameId));
  }, []);

  const updateQuantity = useCallback((gameId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.game.id !== gameId));
    } else {
      setItems(prev => prev.map(i => i.game.id === gameId ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.game.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
