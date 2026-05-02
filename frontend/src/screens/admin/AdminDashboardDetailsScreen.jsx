import React, { useContext, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getDashboardDetails } from '../../api/api';

const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString();
};

const AdminDashboardDetailsScreen = ({ route, navigation }) => {
    const { token } = useContext(AuthContext);
    const { type, title } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getDashboardDetails(type, token);
                setItems(response.data?.data || []);
            } catch (err) {
                setError(err?.response?.data?.message || 'Failed to load details');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [type, token]);

    const totalRevenue = useMemo(() => {
        if (type !== 'revenue') return 0;
        return items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
    }, [items, type]);

    const renderItem = ({ item }) => {
        if (type === 'orders' || type === 'revenue') {
            return (
                <View style={styles.card}>
                    <Text style={styles.primary}>Order ID: {item._id}</Text>
                    <Text style={styles.secondary}>Customer: {item.customerName || item.customerEmail || 'N/A'}</Text>
                    <Text style={styles.secondary}>Total Price: Rs. {Number(item.totalAmount || 0).toFixed(2)}</Text>
                    <Text style={styles.secondary}>Date: {formatDate(item.createdAt || item.orderDate)}</Text>
                    <Text style={styles.secondary}>Status: {item.orderStatus || 'N/A'}</Text>
                </View>
            );
        }

        return (
            <View style={styles.card}>
                <Text style={styles.primary}>{item.name || item.productId || 'Unnamed Product'}</Text>
                <Text style={styles.secondary}>Product ID: {item.productId || item._id}</Text>
                <Text style={styles.secondary}>Stock: {item.stockQuantity ?? item.stocks ?? 0}</Text>
                <Text style={styles.secondary}>Price: Rs. {Number(item.finalPrice ?? item.price ?? 0).toFixed(2)}</Text>
                <Text style={styles.secondary}>Created: {formatDate(item.createdAt)}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.title}>{title || 'Details'}</Text>
            </View>

            {type === 'revenue' && !loading && !error && (
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Revenue</Text>
                    <Text style={styles.summaryValue}>Rs. {totalRevenue.toLocaleString()}</Text>
                </View>
            )}

            
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item, index) => item._id || `${type}-${index}`}
                    renderItem={renderItem}
                    ListEmptyComponent={<Text style={styles.emptyText}>No data found.</Text>}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backButton: { marginRight: 10, padding: 4 },
    title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
    listContent: { paddingBottom: 20 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
    primary: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
    secondary: { fontSize: 13, color: '#475569', marginBottom: 2 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: {
        color: '#dc2626',
        fontSize: 16,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    actionButtonContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    actionButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyText: { textAlign: 'center', color: '#64748b', marginTop: 20 },
    summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
    summaryLabel: { fontSize: 14, color: '#64748b' },
    summaryValue: { fontSize: 24, fontWeight: '800', color: '#1d4ed8', marginTop: 4 }
});

export default AdminDashboardDetailsScreen;
