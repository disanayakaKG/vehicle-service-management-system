import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Animated, Pressable } from 'react-native';
import { useCart } from '../../context/CartContext';
import { API_BASE_URL } from '../../api/api';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const resolveImageUri = (image) => {
    if (!image || typeof image !== 'string') return null;
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads')) return `${API_BASE_URL}${image}`;
    if (image.startsWith('uploads')) return `${API_BASE_URL}/${image}`;
    return `${API_BASE_URL}/uploads/${image}`;
};

const CartScreen = ({ navigation }) => {
    const {
        cartItems,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,
    } = useCart();

    const renderCartItem = ({ item }) => {
        const subtotal = (item.price || 0) * item.quantity;

        return (
            <View style={styles.itemContainer}>
                {resolveImageUri(item.image) ? (
                    <Image source={{ uri: resolveImageUri(item.image) }} style={styles.itemImage} />
                ) : (
                    <View style={styles.imagePlaceholder} />
                )}
                <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.productName || 'Unnamed product'}</Text>
                    <Text style={styles.itemText}>Price: ${item.price?.toFixed(2) || '0.00'}</Text>
                    <Text style={styles.itemText}>Quantity: {item.quantity}</Text>
                    <Text style={styles.itemText}>Subtotal: ${subtotal.toFixed(2)}</Text>
                    <View style={styles.quantityRow}>
                        <Pressable onPress={() => decreaseQuantity(item.productId)}>
                            {({ pressed }) => (
                                <Animated.View style={[styles.quantityButton, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
                                    <Text style={styles.quantityButtonText}>-</Text>
                                </Animated.View>
                            )}
                        </Pressable>
                        <Pressable onPress={() => increaseQuantity(item.productId)}>
                            {({ pressed }) => (
                                <Animated.View style={[styles.quantityButton, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
                                    <Text style={styles.quantityButtonText}>+</Text>
                                </Animated.View>
                            )}
                        </Pressable>
                        <Pressable onPress={() => removeFromCart(item.productId)}>
                            {({ pressed }) => (
                                <Animated.View style={[styles.removeButton, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                                    <Text style={styles.removeButtonText}>Remove</Text>
                                </Animated.View>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    };

    if (!cartItems.length) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>🛍️</Text>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Add items to your cart to place an order.</Text>
                    <Pressable onPress={() => navigation.goBack()} style={{ width: '100%' }}>
                        {({ pressed }) => (
                            <Animated.View style={[styles.primaryButton, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                                <Text style={styles.primaryButtonText}>Continue Shopping</Text>
                            </Animated.View>
                        )}
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <View>
                    <Text style={styles.headerTitle}>My Cart</Text>
                    <Text style={styles.headerSubtitle}>{cartItems.length} item{cartItems.length === 1 ? '' : 's'}</Text>
                </View>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>Rs. {getCartTotal().toFixed(2)}</Text>
                </View>
            </View>
            <FlatList
                data={cartItems}
                keyExtractor={(item) => item.productId}
                renderItem={renderCartItem}
                contentContainerStyle={styles.listContent}
            />
            <View style={styles.footerCard}>
                <View style={styles.summaryRow}>
                    <View>
                        <Text style={styles.footerLabel}>Subtotal</Text>
                        <Text style={styles.footerValue}>Rs. {getCartTotal().toFixed(2)}</Text>
                    </View>
                    <View>
                        <Text style={styles.footerLabel}>Total</Text>
                        <Text style={styles.footerValueBold}>Rs. {getCartTotal().toFixed(2)}</Text>
                    </View>
                </View>
                <View style={styles.footerButtons}>
                    <Pressable style={{ flex: 1, marginRight: 10 }} onPress={() => navigation.goBack()}>
                        {({ pressed }) => (
                            <Animated.View style={[styles.secondaryButton, { marginRight: 0, transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                                <Text style={styles.secondaryButtonText}>Continue</Text>
                            </Animated.View>
                        )}
                    </Pressable>
                    <Pressable style={{ flex: 1 }} onPress={clearCart}>
                        {({ pressed }) => (
                            <Animated.View style={[styles.clearButton, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                                <Text style={styles.clearButtonText}>Clear Cart</Text>
                            </Animated.View>
                        )}
                    </Pressable>
                </View>
                <Pressable onPress={() => navigation.navigate('Checkout')}>
                    {({ pressed }) => (
                        <Animated.View style={[styles.primaryButton, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                            <Text style={styles.primaryButtonText}>Checkout</Text>
                        </Animated.View>
                    )}
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 180,
        paddingTop: 8,
    },
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
        elevation: 3,
        shadowColor: '#1f2937',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
    },
    itemImage: {
        width: 100,
        height: 100,
        borderRadius: 16,
        marginRight: 14,
    },
    imagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 16,
        marginRight: 14,
        backgroundColor: '#f1f5f9',
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
        color: '#0f172a',
    },
    itemText: {
        fontSize: 14,
        color: '#475569',
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        flexWrap: 'wrap',
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    quantityButtonText: {
        color: '#EF4444',
        fontSize: 18,
        fontWeight: '700',
    },
    removeButton: {
        marginTop: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ef4444',
        alignSelf: 'flex-start',
    },
    removeButtonText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '700',
    },
    footerCard: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 16,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 18,
        elevation: 8,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    footerLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
    },
    footerValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    footerValueBold: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    footerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    primaryButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#fca5a5',
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 14,
    },
    clearButton: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#fca5a5',
        paddingVertical: 12,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 14,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 18,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    headerBadge: {
        backgroundColor: '#fee2e2',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    headerBadgeText: {
        color: '#EF4444',
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8fafc',
    },
    emptyCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 20,
    },
});

export default CartScreen;
