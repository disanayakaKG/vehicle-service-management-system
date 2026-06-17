import React, { useState, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyOrders, cancelOrder, updateOrderDetails } from '../../api/orderApi';
import { AuthContext } from '../../context/AuthContext';

const OrderHistoryScreen = ({ navigation }) => {
    const { token } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editAddress, setEditAddress] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            const loadOrders = async () => {
                try {
                    setLoading(true);
                    const data = await getMyOrders(token);
                    if (active) {
                        setOrders(data);
                        setError(null);
                    }
                } catch (err) {
                    if (active) setError(err?.message || 'Unable to fetch orders');
                } finally {
                    if (active) setLoading(false);
                }
            };

            loadOrders();

            return () => { active = false; };
        }, [token])
    );

    const handleUpdateDetails = async () => {
        if (!editAddress.trim() || !editPhone.trim()) {
            Alert.alert('Error', 'Address and Phone number cannot be empty.');
            return;
        }
        try {
            setIsUpdating(true);
            await updateOrderDetails(selectedOrderId, { shippingAddress: editAddress, customerPhone: editPhone }, token);
            Alert.alert('Success', 'Delivery details updated successfully.');
            setIsEditModalVisible(false);
            const data = await getMyOrders(token);
            setOrders(data);
        } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to update delivery details.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelOrder = (orderId) => {
        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order? This action cannot be undone.',
            [
                { text: 'No', style: 'cancel' },
                { 
                    text: 'Yes, Cancel', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsCancelling(true);
                            await cancelOrder(orderId, token);
                            Alert.alert('Success', 'Order cancelled successfully.');
                            const data = await getMyOrders(token);
                            setOrders(data);
                        } catch (err) {
                            Alert.alert('Error', err?.message || 'Failed to cancel order.');
                        } finally {
                            setIsCancelling(false);
                        }
                    }
                }
            ]
        );
    };

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

                {(item.orderStatus === 'Pending' || item.orderStatus === 'Confirmed') && (
                    <View style={styles.orderActionButtons}>
                        <TouchableOpacity 
                            style={styles.orderEditBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                setSelectedOrderId(item._id);
                                setEditAddress(item.shippingAddress || '');
                                setEditPhone(item.customerPhone || '');
                                setIsEditModalVisible(true);
                            }}
                        >
                            <Ionicons name="pencil" size={16} color="#2563eb" />
                            <Text style={styles.orderEditBtnText}>Edit Info</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.orderCancelBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleCancelOrder(item._id);
                            }}
                        >
                            <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                            <Text style={styles.orderCancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
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

            {/* Edit Details Modal */}
            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => !isUpdating && setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Delivery Info</Text>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)} disabled={isUpdating}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Delivery Address</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editAddress}
                            onChangeText={setEditAddress}
                            placeholder="Enter delivery address"
                            multiline
                            numberOfLines={3}
                            editable={!isUpdating}
                        />

                        <Text style={styles.inputLabel}>Contact Number</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editPhone}
                            onChangeText={setEditPhone}
                            placeholder="Enter contact number"
                            keyboardType="phone-pad"
                            editable={!isUpdating}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalCancelBtn} 
                                onPress={() => setIsEditModalVisible(false)}
                                disabled={isUpdating}
                            >
                                <Text style={styles.modalCancelBtnText}>Discard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.modalSaveBtn} 
                                onPress={handleUpdateDetails}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    orderActionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    orderEditBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: '#eff6ff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    orderEditBtnText: {
        color: '#2563eb',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    orderCancelBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: '#fef2f2',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    orderCancelBtnText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#0f172a',
        marginBottom: 16,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    modalCancelBtnText: {
        color: '#475569',
        fontWeight: '600',
        fontSize: 15,
    },
    modalSaveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#2563eb',
        alignItems: 'center',
    },
    modalSaveBtnText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 15,
    },
});

export default OrderHistoryScreen;
