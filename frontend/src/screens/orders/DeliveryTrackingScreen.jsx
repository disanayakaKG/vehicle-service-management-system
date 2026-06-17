import React, { useContext, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    TouchableOpacity,
    Modal,
    TextInput,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getOrderById, cancelOrder, updateOrderDetails } from '../../api/orderApi';

const DeliveryTrackingScreen = ({ route, navigation }) => {
    const { token } = useContext(AuthContext);
    const { orderId } = route.params || {};
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editAddress, setEditAddress] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

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
            setEditAddress(orderData.shippingAddress || '');
            setEditPhone(orderData.customerPhone || '');
        } catch (err) {
            console.error('Error loading order details:', err);
            setError(err?.response?.data?.message || err.message || 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDetails = async () => {
        if (!editAddress.trim() || !editPhone.trim()) {
            Alert.alert('Error', 'Address and Phone number cannot be empty.');
            return;
        }
        try {
            setIsUpdating(true);
            await updateOrderDetails(orderId, { shippingAddress: editAddress, customerPhone: editPhone }, token);
            Alert.alert('Success', 'Delivery details updated successfully.');
            setIsEditModalVisible(false);
            loadOrderDetails();
        } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to update delivery details.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelOrder = () => {
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
                            loadOrderDetails();
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

    const canModifyOrder = order.orderStatus === 'Pending' || order.orderStatus === 'Confirmed';

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
                        <Text style={styles.detailLabel}>Contact Number:</Text>
                        <Text style={styles.detailValue}>{order.customerPhone}</Text>
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

                    {canModifyOrder && (
                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity 
                                style={styles.editButton} 
                                onPress={() => setIsEditModalVisible(true)}
                                disabled={isCancelling}
                            >
                                <Ionicons name="pencil" size={18} color="#2563eb" />
                                <Text style={styles.editButtonText}>Edit Details</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.cancelButton} 
                                onPress={handleCancelOrder}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <ActivityIndicator size="small" color="#ef4444" />
                                ) : (
                                    <>
                                        <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                                        <Text style={styles.cancelButtonText}>Cancel Order</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
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
    itemSubtotal: { fontSize: 15, fontWeight: '600', color: '#0f172a' },

    // Action Buttons
    actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 12 },
    editButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
    editButtonText: { color: '#2563eb', fontWeight: '600', fontSize: 14, marginLeft: 6 },
    cancelButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
    cancelButtonText: { color: '#ef4444', fontWeight: '600', fontSize: 14, marginLeft: 6 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
    modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 15, color: '#0f172a', marginBottom: 16, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
    modalCancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 15 },
    modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center' },
    modalSaveBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 15 }
});

export default DeliveryTrackingScreen;
