import { create } from 'zustand';
import { Game } from './gameData';

interface CartItem {
  game: Game;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (game: Game) => void;
  removeItem: (gameId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

// Simple store using closure
let listeners: (() => void)[] = [];
let cartItems: CartItem[] = [];

function notify() {
  listeners.forEach(l => l());
}

export function useCart(): CartStore {
  const [, setTick] = (await import('react')).useState(0);

  // We'll use a simpler approach
  return {
    items: cartItems,
    addItem: (game: Game) => {
      const existing = cartItems.find(i => i.game.id === game.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cartItems = [...cartItems, { game, quantity: 1 }];
      }
      notify();
    },
    removeItem: (gameId: string) => {
      cartItems = cartItems.filter(i => i.game.id !== gameId);
      notify();
    },
    clearCart: () => {
      cartItems = [];
      notify();
    },
    getTotal: () => cartItems.reduce((sum, i) => sum + i.game.price * i.quantity, 0),
    getItemCount: () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
  };
}
