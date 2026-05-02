import React, { createContext, useContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const getProductId = (product) => product._id || product.id || product.productId;
    const getProductName = (product) => product.name || product.productName || product.title || '';
    const getProductImage = (product) => product.image || product.img || '';
    const getProductPrice = (product) => {
        if (product.finalPrice !== undefined && product.finalPrice !== null) return product.finalPrice;
        if (product.price !== undefined && product.price !== null) return product.price;
        return 0;
    };

    const addToCart = (product) => {
        const productId = getProductId(product);
        if (!productId) return;

        setCartItems((prevItems) => {
            const existingIndex = prevItems.findIndex((item) => item.productId === productId);
            if (existingIndex >= 0) {
                const updatedItems = [...prevItems];
                updatedItems[existingIndex].quantity += 1;
                return updatedItems;
            }

            const newItem = {
                productId,
                productName: getProductName(product),
                image: getProductImage(product),
                price: getProductPrice(product),
                quantity: 1,
            };

            return [...prevItems, newItem];
        });
    };

    const buyNow = (product) => {
        const productId = getProductId(product);
        if (!productId) return;

        const newItem = {
            productId,
            productName: getProductName(product),
            image: getProductImage(product),
            price: getProductPrice(product),
            quantity: 1,
        };

        setCartItems([newItem]);
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
    };

    const increaseQuantity = (productId) => {
        setCartItems((prevItems) => prevItems.map((item) => {
            if (item.productId !== productId) return item;
            return {
                ...item,
                quantity: item.quantity + 1,
            };
        }));
    };

    const decreaseQuantity = (productId) => {
        setCartItems((prevItems) => prevItems.map((item) => {
            if (item.productId !== productId) return item;
            return {
                ...item,
                quantity: Math.max(1, item.quantity - 1),
            };
        }));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
    };

    const getCartItemCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                buyNow,
                removeFromCart,
                increaseQuantity,
                decreaseQuantity,
                clearCart,
                getCartTotal,
                getCartItemCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
