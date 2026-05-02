import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getInventoryProducts, updateInventoryStock } from '../../api/api';

const InventoryDashboardScreen = ({ navigation }) => {
    const { token } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadInventory = useCallback(async () => {
        if (!token) return;
        try {
            setError(null);
            const response = await getInventoryProducts(token);
            setProducts(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Inventory load error:', err);
            setError(err.response?.data?.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    const onRefresh = () => {
        setRefreshing(true);
        loadInventory();
    };

    const handleStockOut = (product) => {
        Alert.alert(
            'Stock Out Product',
            'Mark this product as out of stock?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Stock Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateInventoryStock(product._id || product.id, { mode: 'set', quantity: 0 }, token);
                            Alert.alert('Success', 'Product marked as out of stock');
                            loadInventory();
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.message || 'Could not update stock');
                        }
                    },
                },
            ]
        );
    };

    const statusInfo = (quantity) => {
        if (quantity === 0) return { label: 'Out of Stock', color: '#dc3545', icon: 'close-circle' };
        if (quantity <= 5) return { label: 'Low Stock', color: '#f97316', icon: 'alert-circle' };
        return { label: 'In Stock', color: '#10b981', icon: 'checkmark-circle' };
    };

    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.stockQuantity <= 5 && p.stockQuantity > 0).length;
    const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.screenTitle}>Inventory Dashboard</Text>
                    <Text style={styles.screenSubtitle}>Manage stock levels for admin</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
                }
            >
                <View style={styles.summaryGrid}>
                    <View style={[styles.summaryCard, { borderTopColor: '#007bff' }]}>
                        <Text style={styles.summaryLabel}>Total Products</Text>
                        <Text style={styles.summaryValue}>{totalProducts}</Text>
                    </View>
                    <View style={[styles.summaryCard, { borderTopColor: '#f97316' }]}>
                        <Text style={styles.summaryLabel}>Low Stock</Text>
                        <Text style={styles.summaryValue}>{lowStockCount}</Text>
                    </View>
                    <View style={[styles.summaryCard, { borderTopColor: '#dc3545' }]}>
                        <Text style={styles.summaryLabel}>Out of Stock</Text>
                        <Text style={styles.summaryValue}>{outOfStockCount}</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#007bff" />
                        <Text style={styles.loaderText}>Loading inventory...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={48} color="#dc3545" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : products.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={48} color="#94a3b8" />
                        <Text style={styles.emptyText}>No inventory products found</Text>
                    </View>
                ) : (
                    products.map((product) => {
                        const status = statusInfo(product.stockQuantity || 0);
                        return (
                            <View key={product._id || product.id} style={styles.productCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.productName}>{product.name || 'Unnamed product'}</Text>
                                    <View style={[styles.statusPill, { backgroundColor: `${status.color}20` }]}> 
                                        <Ionicons name={status.icon} size={16} color={status.color} />
                                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Price</Text>
                                    <Text style={styles.detailValue}>Rs. {Number(product.price || 0).toLocaleString()}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Stock Qty</Text>
                                    <Text style={styles.detailValue}>{product.stockQuantity ?? 0}</Text>
                                </View>

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.updateBtn]}
                                        onPress={() => navigation.navigate('UpdateStock', { productId: product._id || product.id })}
                                    >
                                        <Text style={styles.actionText}>{product.stockQuantity === 0 ? 'Add Stock' : 'Update Stock'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.deleteBtn]}
                                        onPress={() => handleStockOut(product)}
                                    >
                                        <Text style={styles.actionText}>Stock Out</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 24,
        paddingBottom: 14,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0f172a',
    },
    screenSubtitle: {
        marginTop: 4,
        fontSize: 14,
        color: '#64748b',
    },
    content: {
        padding: 18,
        paddingBottom: 26,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 4,
        borderTopWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#475569',
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0f172a',
    },
    loaderContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    loaderText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
    },
    errorContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    errorText: {
        marginTop: 12,
        color: '#dc3545',
        fontSize: 14,
        textAlign: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        marginTop: 12,
        color: '#94a3b8',
        fontSize: 14,
    },
    productCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    productName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginRight: 10,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '600',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    updateBtn: {
        backgroundColor: '#2563eb',
        marginRight: 10,
    },
    deleteBtn: {
        backgroundColor: '#ef4444',
    },
    actionText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default InventoryDashboardScreen;
