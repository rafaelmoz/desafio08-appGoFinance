import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const product = await AsyncStorage.getItem('@GoMarketplace:products');
      if (product) {
        setProducts([...JSON.parse(product)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const existProduct = products.find(item => item.id === product.id);

      if (!existProduct) {
        const newProduct = { ...product, quantity: 1 };
        setProducts([...products, newProduct]);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      } else {
        setProducts(state =>
          state.map(item => {
            if (item.id === product.id) {
              return { ...item, quantity: item.quantity + 1 };
            }
            return { ...item, quantity: 1 };
          }),
        );
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(state =>
        state.map(product => {
          if (product.id === id) {
            return { ...product, quantity: product.quantity + 1 };
          }
          return { ...product };
        }),
      );
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const indexExistProduct = products.findIndex(item => item.id === id);

      if (indexExistProduct >= 0) {
        if (products[indexExistProduct].quantity === 1) {
          const newCart = products.filter(product => product.id !== id);

          setProducts(newCart);

          // await AsyncStorage.setItem(
          //  '@GoMarketplace:products',
          //  JSON.stringify(newCart),
          // );
        } else {
          const newCart = products.map(product => {
            if (product.id === id && product.quantity > 0) {
              return { ...product, quantity: product.quantity - 1 };
            }
            return { ...product };
          });
          setProducts(newCart);
          // await AsyncStorage.setItem(
          //  '@GoMarketplace:products',
          //  JSON.stringify(newCart),
          // );
        }
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
