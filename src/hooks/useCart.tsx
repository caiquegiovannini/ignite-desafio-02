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
      const productHasStock = stockProduct.amount > 0;
      const productIsAlreadyInCart = cart.find(product => product.id === productId);

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
      }

      updateProductStock(productId, stockProduct.amount - 1);

      setCart([
        ...updatedCart,
      ]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockProduct: Stock = await getProductStock(productId);
      const productHasStock = stockProduct.amount > 0;

      if (!productHasStock) {
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

      updateProductStock(productId, stockProduct.amount - 1);
      setCart([
        ...updatedCart,
      ]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

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
