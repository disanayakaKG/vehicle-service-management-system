import React, { useContext, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getOrderById } from '../../api/orderApi';

const DeliveryTrackingScreen = ({ route, navigation }) => {
    const { token } = useContext(AuthContext);
    const { orderId } = route.params || {};
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadOrderDetails();
    }, [orderId, token]);

    const loadOrderDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const orderData = await getOrderById(orderId, token);
            console.log('Order data received:', orderData);
            console.log('Delivery status:', orderData?.deliveryStatus);
            
            if (!orderData) {
                throw new Error('Order data not found in response');
            }
            
            setOrder(orderData);
        } catch (err) {
            console.error('Error loading order details:', err);
            setError(err?.response?.data?.message || err.message || 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIndex = (status) => {
        console.log('Getting status index for:', status);
        if (!status) {
            console.log('No status provided, returning 0');
            return 0;
        }
        
        const statusFlow = [
            'Order Placed',
            'Order Confirmed', 
            'Processing',
            'Shipped',
            'Out for Delivery',
            'Delivered'
        ];
        
        // Handle different status formats
        const normalizedStatus = String(status).toLowerCase().trim();
        console.log('Normalized status:', normalizedStatus);
        
        // Map various status formats to our flow
        const statusMappings = {
            'order placed': 'Order Placed',
            'placed': 'Order Placed',
            'order confirmed': 'Order Confirmed',
            'confirmed': 'Order Confirmed',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'out for delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'delivered': 'Delivered'
        };
        
        const mappedStatus = statusMappings[normalizedStatus] || status;
        const index = statusFlow.indexOf(mappedStatus);
        console.log('Mapped status:', mappedStatus, 'Index:', index);
        
        // If status not found in flow, try to find closest match
        if (index === -1) {
            console.log('Status not found in flow, trying closest match');
            if (normalizedStatus.includes('delivered')) return statusFlow.length - 1;
            if (normalizedStatus.includes('shipped')) return statusFlow.indexOf('Shipped');
            if (normalizedStatus.includes('processing')) return statusFlow.indexOf('Processing');
            if (normalizedStatus.includes('confirm')) return statusFlow.indexOf('Order Confirmed');
            return 0; // Default to first status
        }
        
        return index;
    };

    const getStatusIcon = (status, isActive, isCompleted) => {
        if (isCompleted) {
            return <Ionicons name="checkmark-circle" size={24} color="#10b981" />;
        } else if (isActive) {
            return <Ionicons name="time" size={24} color="#2563eb" />;
        } else {
            return <Ionicons name="ellipse" size={24} color="#d1d5db" />;
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadOrderDetails}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Order not found</Text>
            </View>
        );
    }

    const currentStatusIndex = getStatusIndex(order?.deliveryStatus);
    console.log('Current status index:', currentStatusIndex);
    const statusFlow = [
        { key: 'Order Placed', label: 'Order Placed', description: 'Your order has been received' },
        { key: 'Order Confirmed', label: 'Order Confirmed', description: 'Your order has been confirmed and is being processed' },
        { key: 'Processing', label: 'Processing', description: 'Your order is being prepared for shipment' },
        { key: 'Shipped', label: 'Shipped', description: 'Your order has been shipped' },
        { key: 'Out for Delivery', label: 'Out for Delivery', description: 'Your order is on the way' },
        { key: 'Delivered', label: 'Delivered', description: 'Your order has been delivered' }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.title}>Delivery Tracking</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Order Summary Card */}
                <View style={styles.orderSummaryCard}>
                    <Text style={styles.orderId}>Order #{order._id.slice(-8)}</Text>
                    <Text style={styles.orderDate}>Placed on {formatDate(order.createdAt)}</Text>
                    <Text style={styles.totalAmount}>Total: Rs. {order.totalAmount.toFixed(2)}</Text>
                </View>

                {/* Delivery Status Timeline */}
                <View style={styles.timelineCard}>
                    <Text style={styles.timelineTitle}>Delivery Status</Text>
                    
                    {statusFlow.map((status, index) => {
                        const isCompleted = index < currentStatusIndex;
                        const isActive = index === currentStatusIndex;
                        
                        return (
                            <View key={status.key} style={styles.timelineItem}>
                                <View style={styles.timelineMarker}>
                                    {getStatusIcon(status.key, isActive, isCompleted)}
                                    {index < statusFlow.length - 1 && (
                                        <View style={[
                                            styles.timelineLine,
                                            { backgroundColor: isCompleted ? '#10b981' : '#d1d5db' }
                                        ]} />
                                    )}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={[
                                        styles.timelineLabel,
                                        { 
                                            color: isCompleted ? '#10b981' : isActive ? '#2563eb' : '#6b7280',
                                            fontWeight: isActive ? '700' : isCompleted ? '600' : '400'
                                        }
                                    ]}>
                                        {status.label}
                                    </Text>
                                    <Text style={styles.timelineDescription}>
                                        {status.description}
                                    </Text>
                                    {isActive && (
                                        <Text style={styles.activeStatus}>Current Status</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Delivery Details */}
                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Delivery Details</Text>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Delivery Address:</Text>
                        <Text style={styles.detailValue}>{order.shippingAddress}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Method:</Text>
                        <Text style={styles.detailValue}>{order.paymentMethod}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Status:</Text>
                        <Text style={[
                            styles.detailValue,
                            { color: order.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b' }
                        ]}>
                            {order.paymentStatus}
                        </Text>
                    </View>

                    {order.trackingNumber && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Tracking Number:</Text>
                            <Text style={styles.detailValue}>{order.trackingNumber}</Text>
                        </View>
                    )}

                    {order.estimatedDeliveryDate && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Estimated Delivery:</Text>
                            <Text style={styles.detailValue}>
                                {formatDate(order.estimatedDeliveryDate)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Order Status:</Text>
                        <Text style={[
                            styles.detailValue,
                            { 
                                color: order.orderStatus === 'Delivered' ? '#10b981' : 
                                       order.orderStatus === 'Cancelled' ? '#ef4444' : '#2563eb'
                            }
                        ]}>
                            {order.orderStatus}
                        </Text>
                    </View>
                </View>

                {/* Order Items */}
                <View style={styles.itemsCard}>
                    <Text style={styles.itemsTitle}>Order Items</Text>
                    {order.items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.productName}</Text>
                                <Text style={styles.itemDetails}>Qty: {item.quantity} × Rs. {item.price}</Text>
                            </View>
                            <Text style={styles.itemSubtotal}>
                                Rs. {item.subtotal.toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    backButton: { marginRight: 10, padding: 4 },
    title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
    content: { flex: 1, padding: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#dc2626', fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryButton: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    // Order Summary
    orderSummaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
    orderId: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    orderDate: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
    totalAmount: { fontSize: 16, fontWeight: '600', color: '#2563eb' },

    // Timeline
    timelineCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
    timelineTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
    timelineItem: { flexDirection: 'row', marginBottom: 20 },
    timelineMarker: { alignItems: 'center', marginRight: 16 },
    timelineLine: { width: 2, flex: 1, marginTop: 4 },
    timelineContent: { flex: 1 },
    timelineLabel: { fontSize: 16, marginBottom: 4 },
    timelineDescription: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
    activeStatus: { fontSize: 12, color: '#2563eb', fontWeight: '600' },

    // Details
    detailsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
    detailsTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
    detailRow: { marginBottom: 12 },
    detailLabel: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
    detailValue: { fontSize: 15, color: '#0f172a', fontWeight: '500' },

    // Items
    itemsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
    itemsTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
    itemDetails: { fontSize: 13, color: '#6b7280' },
    itemSubtotal: { fontSize: 15, fontWeight: '600', color: '#0f172a' }
});

export default DeliveryTrackingScreen;
