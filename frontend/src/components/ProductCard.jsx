import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../api/api';

const resolveImageUri = (image) => {
  if (!image) return null;
  if (typeof image !== 'string') return null;
  if (image.startsWith('http')) return image;
  if (image.startsWith('/uploads')) return `${API_BASE_URL}${image}`;
  if (image.startsWith('uploads')) return `${API_BASE_URL}/${image}`;
  if (image.startsWith('file')) return image;
  return `${API_BASE_URL}/uploads/${image}`;
};

const ProductCard = ({ product, onPress }) => {
    const imageUri = resolveImageUri(product?.image);
    console.log("ProductCard product.image:", product?.image);
    console.log("ProductCard resolved imageUri:", imageUri);

    const isOutOfStock = (product.stockQuantity || 0) === 0;
    const isLowStock = (product.stockQuantity || 0) > 0 && (product.stockQuantity || 0) <= 5;

    const getStockStatus = () => {
        if (isOutOfStock) return { text: 'Out of Stock', color: '#ef4444', icon: 'close-circle' };
        if (isLowStock) return { text: `Only ${product.stockQuantity} left`, color: '#f59e0b', icon: 'alert-circle' };
        return { text: 'In Stock', color: '#10b981', icon: 'checkmark-circle' };
    };

    const stockStatus = getStockStatus();

    return (
        <TouchableOpacity style={[styles.card, isOutOfStock && styles.outOfStockCard]} onPress={onPress}>
            <View style={styles.imageContainer}>
                <Image
                    source={imageUri ? { uri: imageUri } : null}
                    style={styles.image}
                    resizeMode="cover"
                    onError={(e) => console.log("ProductCard image load error:", e.nativeEvent.error, imageUri)}
                />
                {!imageUri && (
                    <View style={[styles.image, styles.placeholder]}>
                        <Text>No Image</Text>
                    </View>
                )}
                {isOutOfStock && (
                    <View style={styles.outOfStockOverlay}>
                        <Text style={styles.outOfStockOverlayText}>Out of Stock</Text>
                    </View>
                )}
            </View>
            
            <View style={styles.info}>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.productId}>ID: {product.productId}</Text>
                <Text style={styles.details}>{product.brand} | {product.vehicleType}</Text>
                
                <View style={styles.priceContainer}>
                    <Text style={styles.finalPrice}>Rs. {product.finalPrice}</Text>
                    {product.discount > 0 && (
                        <Text style={styles.originalPrice}>Rs. {product.price}</Text>
                    )}
                </View>

                {product.discount > 0 && (
                    <Text style={styles.discount}>{product.discount}% OFF</Text>
                )}

                <View style={styles.stockContainer}>
                    <Ionicons name={stockStatus.icon} size={14} color={stockStatus.color} />
                    <Text style={[styles.stockText, { color: stockStatus.color }]}>{stockStatus.text}</Text>
                </View>

                <Text style={styles.rating}>⭐ {product.rating}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginVertical: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    outOfStockCard: {
        opacity: 0.7,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: 120,
        height: 120,
    },
    outOfStockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockOverlayText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    placeholder: {
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        padding: 10,
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    productId: {
        fontSize: 12,
        color: '#666',
    },
    details: {
        fontSize: 14,
        color: '#888',
        marginVertical: 2,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    finalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#28a745',
    },
    originalPrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    discount: {
        fontSize: 12,
        color: '#dc3545',
        fontWeight: 'bold',
    },
    rating: {
        fontSize: 14,
        marginTop: 5,
    },
    stockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    stockText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
});

export default ProductCard;
