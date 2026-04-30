import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { 
    getProducts, 
    createProduct as createProductApi, 
    updateProduct as updateProductAPI, 
    deleteProduct as deleteProductApi 
} from '../api/api';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const { token, user } = useContext(AuthContext);
    // Fetch products from backend
    const fetchProducts = async () => {
        if (!token) return;
        try {
            const response = await getProducts();
            // Map backend products to frontend format
            const frontendProducts = response.data.map(product => ({
                ...product,
                id: product._id, // Add id for compatibility
                vehicleBrand: product.vehicleName, // vehicleName -> vehicleBrand
                stocks: product.stockQuantity, // stockQuantity -> stocks
            }));
            setProducts(frontendProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    // Fetch products when token is available (on login/app start)
    useEffect(() => {
        if (token) {
            fetchProducts();
        } else {
            setProducts([]); // Clear products on logout
        }
    }, [token]);

    const addProduct = async (productData) => {
        if (!token) return;
        
        try {
            // Map frontend fields to backend fields
            const formData = new FormData();
            formData.append('productId', productData.productId);
            formData.append('name', productData.name);
            formData.append('brand', productData.brand);
            formData.append('vehicleType', productData.vehicleType);
            const vehicleName = productData.vehicleBrand || productData.vehicleType || '';
            if (vehicleName) {
                formData.append('vehicleName', vehicleName); // vehicleBrand -> vehicleName
            }
            formData.append('category', productData.category || 'Spare Parts'); // Add category
            formData.append('price', productData.price.toString());
            formData.append('discount', productData.discount.toString());
            formData.append('stockQuantity', productData.stocks.toString()); // stocks -> stockQuantity
            formData.append('description', productData.description);
            
            // Add image if provided - use URL string or local file upload when necessary
            if (productData.image) {
                let imageUri = null;
                if (typeof productData.image === 'string') {
                    imageUri = productData.image;
                } else if (productData.image.uri) {
                    imageUri = productData.image.uri;
                }

                if (imageUri) {
                    if (imageUri.startsWith('file')) {
                        const filename = imageUri.split('/').pop();
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : `image/jpeg`;
                        formData.append('image', {
                            uri: imageUri,
                            name: filename,
                            type,
                        });
                    } else {
                        formData.append('image', imageUri);
                    }
                }
            }

            const response = await createProductApi(formData, token);
            const newProduct = response.data;
            
            // Map backend fields back to frontend fields for consistency
            const frontendProduct = {
                ...newProduct,
                id: newProduct._id, // Add id for compatibility
                vehicleBrand: newProduct.vehicleName, // vehicleName -> vehicleBrand
                stocks: newProduct.stockQuantity, // stockQuantity -> stocks
            };
            
            setProducts(prev => [...prev, frontendProduct]);
            return { success: true };
        } catch (error) {
            console.error('Error adding product:', error);
            return { success: false, message: error.response?.data?.message || 'Failed to add product' };
        }
    };

    const updateProduct = async (id, updatedProductData) => {
        if (!token) return;
        
        try {
            const realId = id; // id might be _id or id
            
            // Map frontend fields to backend fields
            const formData = new FormData();
            formData.append('productId', updatedProductData.productId);
            formData.append('name', updatedProductData.name);
            formData.append('brand', updatedProductData.brand);
            formData.append('vehicleType', updatedProductData.vehicleType);
            const vehicleName = updatedProductData.vehicleBrand || updatedProductData.vehicleType || '';
            if (vehicleName) {
                formData.append('vehicleName', vehicleName); // vehicleBrand -> vehicleName
            }
            formData.append('category', updatedProductData.category || 'Spare Parts'); // Add category
            formData.append('price', updatedProductData.price.toString());
            formData.append('discount', updatedProductData.discount.toString());
            formData.append('stockQuantity', updatedProductData.stocks.toString()); // stocks -> stockQuantity
            formData.append('description', updatedProductData.description);
            
            // Add image if provided - use URL string or local file upload when necessary
            if (updatedProductData.image) {
                let imageUri = null;
                if (typeof updatedProductData.image === 'string') {
                    imageUri = updatedProductData.image;
                } else if (updatedProductData.image.uri) {
                    imageUri = updatedProductData.image.uri;
                }
                
                if (imageUri) {
                    if (imageUri.startsWith('file')) {
                        const filename = imageUri.split('/').pop();
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : `image/jpeg`;
                        formData.append('image', {
                            uri: imageUri,
                            name: filename,
                            type,
                        });
                    } else {
                        formData.append('image', imageUri);
                    }
                }
            }

            const response = await updateProductAPI(realId, formData, token);
            const updatedProduct = response.data;
            
            // Map backend fields back to frontend fields
            const frontendProduct = {
                ...updatedProduct,
                id: updatedProduct._id,
                vehicleBrand: updatedProduct.vehicleName,
                stocks: updatedProduct.stockQuantity,
            };
            
            setProducts(prev => prev.map(p => p._id === realId || p.id === realId ? frontendProduct : p));
            return { success: true };
        } catch (error) {
            console.error('Error updating product:', error);
            return { success: false, message: error.response?.data?.message || 'Failed to update product' };
        }
    };

    const deleteProduct = async (productId) => {
        if (!token) return;
        
        try {
            const realId = productId?._id || productId?.id || productId;
            console.log("Deleting product id:", realId);
            await deleteProductApi(realId, token);
            setProducts(prev => prev.filter(p => (p._id || p.id) !== realId));
            return { success: true };
        } catch (error) {
            console.error('Error deleting product:', error);
            return { success: false, message: error.response?.data?.message || 'Failed to delete product' };
        }
    };

    const getProductCount = () => products.length;

    return (
        <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, getProductCount, fetchProducts }}>
            {children}
        </ProductContext.Provider>
    );
};
