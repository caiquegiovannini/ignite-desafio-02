import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333',
});

export const getAllProducts = async () => (await api.get('/products')).data;
export const getProduct = async (productId: number) => (await api.get(`/products/${productId}`)).data;

export const getProductStock = async (productId: number) => (await api.get(`/stock/${productId}`)).data;
export const updateProductStock = async (productId: number, productAmount: number) => await api.put(`/stock/${productId}`, {
  id: productId,
  amount: productAmount,
});
