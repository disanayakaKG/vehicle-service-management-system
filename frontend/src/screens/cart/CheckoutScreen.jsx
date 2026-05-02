import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { createOrder } from '../../api/orderApi';
import { AuthContext } from '../../context/AuthContext';

const CheckoutScreen = ({ navigation }) => {
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { token, user } = useContext(AuthContext);
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
    const [loading, setLoading] = useState(false);

    // Auto-fill customer info if user is logged in
    useEffect(() => {
        if (user) {
            setCustomerName(user.name || '');
            setCustomerEmail(user.email || '');
            setCustomerPhone(user.phone || '');
        }
    }, [user]);

    const orderItems = cartItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        subtotal: (item.price || 0) * item.quantity,
    }));

    const orderData = {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items: orderItems,
        totalAmount: getCartTotal(),
        paymentMethod,
    };

    const handlePlaceOrder = async () => {
        // Check if user is authenticated
        if (!token || !user) {
            Alert.alert('Authentication required', 'Please login to place an order.');
            navigation.navigate('Login');
            return;
        }

        if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
            Alert.alert('Missing information', 'Please fill in all checkout fields.');
            return;
        }

        if (!cartItems.length) {
            Alert.alert('Your cart is empty', 'Add items to cart before checking out.');
            return;
        }

        if (paymentMethod === 'Cash on Delivery') {
            try {
                setLoading(true);
                console.log('Placing cash on delivery order:', orderData);
                console.log('Token available:', !!token);
                
                const orderResponse = await createOrder({
                    ...orderData,
                    paymentStatus: 'Pending',
                    orderStatus: 'Pending',
                }, token);
                
                console.log('Order created successfully:', orderResponse);
                clearCart();
                Alert.alert(
                    'Order placed successfully', 
                    'Your order has been placed and will be delivered soon.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('OrderHistory')
                        }
                    ]
                );
            } catch (error) {
                console.error('Cash on delivery order error:', error);
                Alert.alert('Checkout failed', error?.response?.data?.message || error?.message || 'Failed to place order');
            } finally {
                setLoading(false);
            }
        } else {
            navigation.navigate('Payment', {
                checkoutData: {
                    ...orderData,
                    paymentStatus: 'Pending',
                    orderStatus: 'Pending',
                },
            });
        }
    };

    if (!cartItems.length) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Add products to proceed with checkout.</Text>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.actionButtonText}>Continue Shopping</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerCard}>
                <View style={styles.headerIconContainer}>
                    <Ionicons name="card-outline" size={24} color="#2563eb" />
                </View>
                <Text style={styles.title}>Checkout</Text>
                <Text style={styles.headerSubtitle}>{cartItems.length} item{cartItems.length === 1 ? '' : 's'} in order</Text>
            </View>

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="person-outline" size={18} color="#2563eb" style={styles.sectionIcon} />
                        <Text style={styles.sectionTitle}>Customer Information</Text>
                    </View>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={customerName}
                    onChangeText={setCustomerName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    keyboardType="email-address"
                    value={customerEmail}
                    onChangeText={setCustomerEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    keyboardType="phone-pad"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                />
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Shipping Address"
                    value={shippingAddress}
                    onChangeText={setShippingAddress}
                    multiline
                    numberOfLines={3}
                />
            </View>

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="card-outline" size={18} color="#2563eb" style={styles.sectionIcon} />
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                    </View>
                </View>
                {['Cash on Delivery', 'PayHere Sandbox'].map((method) => (
                    <TouchableOpacity
                        key={method}
                        style={[
                            styles.paymentOption,
                            paymentMethod === method && styles.paymentOptionSelected,
                        ]}
                        onPress={() => setPaymentMethod(method)}
                    >
                        <Text
                            style={[
                                styles.paymentOptionText,
                                paymentMethod === method && styles.paymentOptionTextSelected,
                            ]}
                        >
                            {method}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="receipt-outline" size={18} color="#2563eb" style={styles.sectionIcon} />
                        <Text style={styles.sectionTitle}>Order Summary</Text>
                    </View>
                    <Text style={styles.sectionMeta}>Total: Rs. {getCartTotal().toFixed(2)}</Text>
                </View>
                {orderItems.map((item) => (
                    <View key={item.productId} style={styles.summaryItem}>
                        <View style={styles.summaryItemRow}>
                            <Text style={styles.summaryName}>{item.productName}</Text>
                            <Text style={styles.summaryPrice}>Rs. {item.price?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <View style={styles.summaryItemRow}> 
                            <Text style={styles.summaryText}>Qty {item.quantity}</Text>
                            <Text style={styles.summaryText}>Rs. {item.subtotal.toFixed(2)}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handlePlaceOrder} disabled={loading}>
                <Text style={styles.actionButtonText}>{paymentMethod === 'PayHere Sandbox' ? 'Continue to Payment' : 'Place Order'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#eff6ff',
        paddingBottom: 32,
    },
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#475569',
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
    },
    headerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 14,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionIcon: {
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    sectionMeta: {
        fontSize: 13,
        color: '#64748b',
    },
    input: {
        borderWidth: 1,
        borderColor: '#dbeafe',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        backgroundColor: '#f8fbff',
        color: '#0f172a',
    },
    multilineInput: {
        minHeight: 90,
        textAlignVertical: 'top',
    },
    paymentOption: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 18,
        marginBottom: 10,
        backgroundColor: '#f8fafc',
        elevation: 1,
    },
    paymentOptionSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#dbeafe',
    },
    paymentOptionText: {
        fontSize: 14,
        color: '#334155',
    },
    paymentOptionTextSelected: {
        color: '#1d4ed8',
        fontWeight: '700',
    },
    summaryItem: {
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    summaryItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    summaryName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
        marginRight: 8,
    },
    summaryPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },
    summaryText: {
        fontSize: 13,
        color: '#64748b',
    },
    actionButton: {
        backgroundColor: '#2563eb',
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#eff6ff',
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
    },
    emptyTitle: {
        fontSize: 22,
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

export default CheckoutScreen;
