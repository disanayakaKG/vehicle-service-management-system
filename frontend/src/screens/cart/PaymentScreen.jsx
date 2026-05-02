import React, { useMemo, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { CommonActions, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { createOrder } from '../../api/orderApi';
import { useCart } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { createPayHereSession } from '../../api/api';

const PaymentScreen = ({ navigation }) => {
    const route = useRoute();
    const { checkoutData } = route.params || {};
    const { clearCart } = useCart();
    const { token } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState(null);
    const [orderPlaced, setOrderPlaced] = useState(false);

    const orderId = useMemo(() => `ORD-${Date.now()}`, []);

    const buildPayHereAutoSubmitHtml = (checkoutUrl, payload) => {
        const hiddenInputs = Object.entries(payload)
            .map(([key, value]) => `<input type="hidden" name="${key}" value="${String(value).replace(/"/g, '&quot;')}" />`)
            .join('');

        return `
            <!doctype html>
            <html>
              <body>
                <form id="payhere-form" method="post" action="${checkoutUrl}">
                  ${hiddenInputs}
                </form>
                <script>
                  document.getElementById('payhere-form').submit();
                </script>
              </body>
            </html>
        `;
    };

    const handlePayment = async () => {
        if (!checkoutData || !checkoutData.items?.length) {
            Alert.alert('Payment error', 'Checkout data is missing or cart is empty.');
            return;
        }

        try {
            setLoading(true);
            const response = await createPayHereSession({
                orderId,
                amount: Number(checkoutData?.totalAmount || 0),
                customerName: checkoutData?.customerName,
                customerEmail: checkoutData?.customerEmail,
                customerPhone: checkoutData?.customerPhone,
                shippingAddress: checkoutData?.shippingAddress
            }, token);
            setSession(response.data);
        } catch (error) {
            Alert.alert('Payment failed', error?.response?.data?.message || error?.message || 'Unable to start PayHere payment.');
        } finally {
            setLoading(false);
        }
    };

    const handleWebNavigation = async (navState) => {
        const url = navState?.url || '';

        if (!url || orderPlaced) return;

        if (url.includes('payhere-cancel')) {
            Alert.alert('Payment cancelled', 'You cancelled the PayHere sandbox payment.');
            return;
        }

        if (url.includes('payhere-return')) {
            try {
                setOrderPlaced(true);
                await createOrder({
                    ...checkoutData,
                    paymentMethod: 'PayHere Sandbox',
                    paymentStatus: 'Paid',
                    orderStatus: 'Pending',
                }, token);
                clearCart();
                Alert.alert('Success', 'Payment successful and order placed', [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Home' }],
                                })
                            );
                        }
                    }
                ]);
            } catch (error) {
                setOrderPlaced(false);
                Alert.alert('Order failed', error?.message || 'Payment completed but order save failed.');
            }
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerCard}>
                <Text style={styles.title}>PayHere Sandbox</Text>
                <Text style={styles.note}>You will be redirected to PayHere sandbox checkout.</Text>
            </View>

            <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <Text style={styles.totalAmount}>Rs. {(checkoutData?.totalAmount ?? 0).toFixed(2)}</Text>
                <Text style={styles.summaryText}>Order ID: {orderId}</Text>
                <Text style={styles.summaryText}>Items: {checkoutData?.items?.length ?? 0}</Text>
                
                <View style={styles.itemsList}>
                    {checkoutData?.items?.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemDetails}>x{item.quantity} - Rs. {(item.price * item.quantity).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {!session ? (
                <TouchableOpacity style={styles.button} onPress={handlePayment} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? 'Preparing...' : 'Pay with PayHere'}</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.webviewContainer}>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: buildPayHereAutoSubmitHtml(session.checkoutUrl, session.payload) }}
                        onNavigationStateChange={handleWebNavigation}
                        startInLoadingState
                    />
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#eef2ff',
    },
    headerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 22,
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
    },
    note: {
        fontSize: 14,
        lineHeight: 20,
        color: '#475569',
    },
    summaryBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 22,
        marginBottom: 26,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        color: '#1e293b',
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1d4ed8',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 4,
    },
    button: {
        backgroundColor: '#2563eb',
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    webviewContainer: {
        height: 520,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    itemsList: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
    },
    itemDetails: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'right',
    },
});

export default PaymentScreen;
