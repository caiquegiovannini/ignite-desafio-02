import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { getProduct, getProductStock, updateProductStock } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(('@RocketShoes:cart'));

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let updatedCart: Product[];
      const stockProduct: Stock = await getProductStock(productId);
      const productHasStock = stockProduct.amount > 1;
      const productIsAlreadyInCart = Boolean(cart.find(product => product.id === productId));
      
      if (!productHasStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productIsAlreadyInCart) {
        updatedCart = cart.map(product => product.id === productId
          ? ({
            ...product,
            amount: product.amount + 1,
          })
          : product
        );
      } else {
        const addedProduct = await getProduct(productId);
        updatedCart = [
          ...cart,
          {
            ...addedProduct,
            amount: 1,
          },
        ];
      };

      setCart([
        ...updatedCart,
      ]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

      await updateProductStock(productId, stockProduct.amount - 1);

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const productToRemove = cart.filter(product => product.id === productId)[0];
      const cartWithoutProduct = cart.filter(product => product.id !== productId);
      // const stockProduct = await getProductStock(productId);
      
      if (productToRemove) {
        setCart([
          ...cartWithoutProduct,
        ]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartWithoutProduct));
        
      }
      await updateProductStock(productId, +productToRemove.amount);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockProduct: Stock = await getProductStock(productId);
      const productHasStock = stockProduct.amount >= amount;
      const productToUpdate = cart.filter(product => product.id === productId)[0];
      const isIncrease = amount > productToUpdate.amount;
      
      if (amount <= 0) {
        return;
      }
      
      if (isIncrease && !productHasStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = cart.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            amount,
          }
        }

        return product;
      });

      setCart([
        ...updatedCart,
      ]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

      if (isIncrease) {
        await updateProductStock(productId, stockProduct.amount - amount);
      } else {
        await updateProductStock(productId, stockProduct.amount + amount);
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
