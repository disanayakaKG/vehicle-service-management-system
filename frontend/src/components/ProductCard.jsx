import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
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

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
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
    image: {
        width: 120,
        height: 120,
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
});

export default ProductCard;
