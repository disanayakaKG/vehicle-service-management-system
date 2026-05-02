import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getAllOrdersAdmin, updateOrderStatus, refundOrder } from '../../api/orderApi';

const AdminOrderManagementScreen = ({ navigation }) => {
    const { token } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadOrders();
    }, [token]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllOrdersAdmin(token);
            setOrders(response.data || []);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDeliveryStatus = (orderId, currentStatus) => {
        Alert.alert(
            'Update Delivery Status',
            'This feature will allow you to manually update delivery status.',
            [
                {
                    text: 'Order Placed',
                    onPress: () => updateStatus(orderId, 'Order Placed')
                },
                {
                    text: 'Order Confirmed',
                    onPress: () => updateStatus(orderId, 'Order Confirmed')
                },
                {
                    text: 'Processing',
                    onPress: () => updateStatus(orderId, 'Processing')
                },
                {
                    text: 'Shipped',
                    onPress: () => updateStatus(orderId, 'Shipped')
                },
                {
                    text: 'Out for Delivery',
                    onPress: () => updateStatus(orderId, 'Out for Delivery')
                },
                {
                    text: 'Delivered',
                    onPress: () => updateStatus(orderId, 'Delivered')
                }
            ],
            { cancelable: true }
        );
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus, token);
            Alert.alert('Success', `Delivery status updated to ${newStatus}`);
            loadOrders(); // Refresh orders
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update status');
        }
    };

    const handleRefundOrder = (orderId, orderStatus) => {
        if (orderStatus !== 'Delivered') {
            Alert.alert('Error', 'Only delivered orders can be refunded');
            return;
        }

        Alert.alert(
            'Confirm Refund',
            'Are you sure you want to process a refund for this order?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Refund',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await refundOrder(orderId, token);
                            Alert.alert('Success', 'Refund processed successfully');
                            loadOrders(); // Refresh orders
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Failed to process refund');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized.includes('delivered')) return '#10b981';
        if (normalized.includes('shipped') || normalized.includes('out for delivery')) return '#2563eb';
        if (normalized.includes('processing')) return '#f59e0b';
        if (normalized.includes('confirm')) return '#3b82f6';
        return '#6b7280';
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    const renderOrder = ({ item }) => {
        const statusColor = getStatusColor(item.deliveryStatus);
        const canRefund = item.deliveryStatus === 'Delivered' && item.orderStatus !== 'Refunded';

        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderId}>Order #{item._id?.slice(-8) || 'Unknown'}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.createdAt || item.orderDate)}</Text>
                    </View>
                    <View style={styles.statusBadge} style={{ backgroundColor: statusColor }}>
                        <Text style={styles.statusText}>{item.deliveryStatus || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Customer:</Text>
                        <Text style={styles.detailValue}>{item.customerName || item.customerEmail || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Amount:</Text>
                        <Text style={styles.detailValue}>Rs. {(item.totalAmount ?? 0).toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Status:</Text>
                        <Text style={[styles.detailValue, { color: item.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b' }]}>
                            {item.paymentStatus || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Items:</Text>
                        <Text style={styles.detailValue}>{item.items?.length || 0}</Text>
                    </View>

                    {item.trackingNumber && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Tracking Number:</Text>
                            <Text style={styles.detailValue}>{item.trackingNumber}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => handleUpdateDeliveryStatus(item._id, item.deliveryStatus)}
                    >
                        <Ionicons name="location" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Update Status</Text>
                    </TouchableOpacity>

                    {canRefund && (
                        <TouchableOpacity
                            style={styles.refundButton}
                            onPress={() => handleRefundOrder(item._id, item.orderStatus)}
                        >
                            <Ionicons name="refresh" size={16} color="#fff" />
                            <Text style={styles.buttonText}>Process Refund</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
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
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.title}>Order Management</Text>
            </View>

            <ScrollView style={styles.content}>
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item._id || item.id || String(item.createdAt)}
                    renderItem={renderOrder}
                    contentContainerStyle={orders.length ? styles.listContent : styles.emptyContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📦</Text>
                            <Text style={styles.emptyTitle}>No orders found</Text>
                            <Text style={styles.emptyText}>Orders will appear here once customers start placing them.</Text>
                        </View>
                    }
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
    },
    content: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 16,
    },
    orderCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#0f172a',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    orderInfo: {
        flex: 1,
    },
    orderId: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 14,
        color: '#64748b',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
    orderDetails: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '600',
        flex: 2,
        textAlign: 'right',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    trackButton: {
        backgroundColor: '#2563eb',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    refundButton: {
        backgroundColor: '#ef4444',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    emptyText: {
        color: '#64748b',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 16,
        textAlign: 'center',
        marginHorizontal: 16,
    },
});

export default AdminOrderManagementScreen;
