import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyOrders } from '../../api/orderApi';
import { AuthContext } from '../../context/AuthContext';

const OrderHistoryScreen = ({ navigation }) => {
    const { token } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    
    useEffect(() => {
        const loadOrders = async () => {
            try {
                const data = await getMyOrders(token);
                setOrders(data);
            } catch (err) {
                setError(err?.message || 'Unable to fetch orders');
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, [token]);

    const getBadge = (status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized.includes('paid')) {
            return { label: 'Paid', style: styles.badgePaid };
        }
        if (normalized.includes('cancel')) {
            return { label: 'Cancelled', style: styles.badgeCancelled };
        }
        return { label: 'Pending', style: styles.badgePending };
    };

    const getDeliveryStatusBadge = (status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized.includes('delivered')) {
            return { label: 'Delivered', style: styles.badgeDelivered };
        }
        if (normalized.includes('shipped') || normalized.includes('out for delivery')) {
            return { label: 'In Transit', style: styles.badgeInTransit };
        }
        if (normalized.includes('processing')) {
            return { label: 'Processing', style: styles.badgeProcessing };
        }
        return { label: 'Order Placed', style: styles.badgePlaced };
    };

    const renderOrder = ({ item }) => {
        const orderDate = item.orderDate ? new Date(item.orderDate).toLocaleDateString() : 'Unknown';
        const paymentBadge = getBadge(item.paymentStatus);
        const orderBadge = getBadge(item.orderStatus);
        const deliveryBadge = getDeliveryStatusBadge(item.deliveryStatus);

        return (
            <TouchableOpacity 
                style={styles.orderCard}
                onPress={() => navigation.navigate('DeliveryTracking', { orderId: item._id })}
            >
                <View style={styles.orderRow}> 
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderName}>Order #{item._id?.slice(-8) || 'Unknown'}</Text>
                        <Text style={styles.orderDate}>{orderDate}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </View>
                
                <View style={styles.badgeRow}>
                    <View style={[styles.badge, paymentBadge.style]}>
                        <Text style={styles.badgeText}>{paymentBadge.label}</Text>
                    </View>
                    <View style={[styles.badge, orderBadge.style]}>
                        <Text style={styles.badgeText}>{orderBadge.label}</Text>
                    </View>
                    <View style={[styles.badge, deliveryBadge.style]}>
                        <Text style={styles.badgeText}>{deliveryBadge.label}</Text>
                    </View>
                </View>
                
                <View style={styles.orderDetails}>
                    <Text style={styles.orderText}>Total amount</Text>
                    <Text style={styles.orderTotal}>Rs. {(item.totalAmount ?? 0).toFixed(2)}</Text>
                </View>
                
                <View style={styles.itemsPreview}>
                    <Text style={styles.itemsLabel}>Items: {item.items?.length || 0}</Text>
                    <Text style={styles.trackingInfo}>
                        {item.trackingNumber ? `Tracking: ${item.trackingNumber}` : 'Tap to track'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3b82f6" />
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
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.title}>Order History</Text>
            </View>
            <FlatList
                data={orders}
                keyExtractor={(item) => item._id || item.id || item.orderId || String(item.createdAt)}
                renderItem={renderOrder}
                contentContainerStyle={orders.length ? styles.listContent : styles.emptyContainer}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🛒</Text>
                        <Text style={styles.emptyTitle}>No orders yet</Text>
                        <Text style={styles.emptyText}>Your placed orders will appear here as soon as they are created.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e2e8f0',
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
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        marginRight: 12,
    },
    orderDate: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    badge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        alignSelf: 'flex-start',
        marginRight: 8,
        marginBottom: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
    badgePaid: {
        backgroundColor: '#16a34a',
    },
    badgePending: {
        backgroundColor: '#f97316',
    },
    badgeCancelled: {
        backgroundColor: '#dc2626',
    },
    badgeDelivered: {
        backgroundColor: '#16a34a',
    },
    badgeInTransit: {
        backgroundColor: '#2563eb',
    },
    badgeProcessing: {
        backgroundColor: '#f97316',
    },
    badgePlaced: {
        backgroundColor: '#6b7280',
    },
    orderInfo: {
        flex: 1,
    },
    orderDetails: {
        marginBottom: 8,
    },
    itemsPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    itemsLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    trackingInfo: {
        fontSize: 12,
        color: '#2563eb',
        fontWeight: '500',
    },
    orderText: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 6,
    },
    orderTotal: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1d4ed8',
    },
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
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

export default OrderHistoryScreen;
