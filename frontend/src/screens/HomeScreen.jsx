import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TouchableWithoutFeedback,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { ProductContext } from '../context/ProductContext';
import { getDashboardOverview } from '../api/api';
import CustomerDashboardScreen from './CustomerDashboardScreen';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
    const { logout, user, token } = useContext(AuthContext);
    const { products } = useContext(ProductContext);

    const [menuVisible, setMenuVisible] = useState(false);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        revenue: 0,
        lowStock: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            // Only fetch dashboard overview for admins
            if (user?.role === 'admin') {
                const response = await getDashboardOverview(token);
                if (response.data.success) {
                    setStats(response.data.data);
                }
            }
        } catch (err) {
            console.error('Error fetching dashboard:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.role, token]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    const menuItems = [
        { title: 'Spare Parts / Product', icon: 'cube', screen: user?.role === 'admin' ? 'ProductManagement' : 'ProductList', param: null },
        { title: 'Service and Booking', icon: 'calendar', screen: user?.role === 'admin' ? 'ServiceManagement' : 'Services', param: null },
        { title: 'Stocks and Inventory', icon: 'layers', screen: user?.role === 'admin' ? 'InventoryDashboard' : 'Placeholder', param: user?.role === 'admin' ? null : 'Stocks and Inventory' },
        { title: 'Logout', icon: 'log-out', screen: 'Logout', param: null },
    ];

    const handleMenuPress = (item) => {
        setMenuVisible(false);
        if (item.title === 'Logout') {
            logout();
        } else if (item.param) {
            navigation.navigate('Placeholder', { title: item.param });
        } else {
            navigation.navigate(item.screen);
        }
    };

    const StatCard = ({ title, value, icon, color, detailType }) => (
        <TouchableOpacity
            style={[styles.statCard, { borderTopColor: color }]}
            onPress={() => navigation.navigate('AdminDashboardDetails', { type: detailType, title })}
        >
            <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
                <Text style={styles.statTitle} numberOfLines={1}>{title}</Text>
            </View>
        </TouchableOpacity>
    );

    if (user?.role === "customer") {
        return <CustomerDashboardScreen navigation={navigation} />;
    }

    return (
        <View style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Ionicons name="person-circle" size={40} color="#007bff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuBtn}
                    onPress={() => setMenuVisible(true)}
                >
                    <Ionicons name="menu" size={28} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.welcome}>Hello, {user?.name || 'Amal'}</Text>
                    <Text style={styles.role}>Role: {user?.role || 'Admin'}</Text>
                </View>

                {loading && !refreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#007bff" />
                        <Text style={styles.loaderText}>Loading dashboard overview...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={48} color="#dc3545" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboardData}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : user?.role === 'admin' ? (
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Total Products"
                            value={products.length}
                            icon="cube-outline"
                            color="#3b82f6"
                            detailType="products"
                        />

                        <StatCard
                            title="Total Orders"
                            value={stats.totalOrders}
                            icon="cart-outline"
                            color="#16a34a"
                            detailType="orders"
                        />
                        <StatCard
                            title="Revenue"
                            value={`Rs. ${stats.revenue.toLocaleString()}`}
                            icon="cash-outline"
                            color="#f59e0b"
                            detailType="revenue"
                        />
                        <StatCard
                            title="Low Stock"
                            value={stats.lowStock}
                            icon="warning-outline"
                            color="#dc2626"
                            detailType="low-stock"
                        />
                    </View>
                ) : (
                    <View style={styles.customerWelcome}>
                        <MaterialIcons name="shopping-bag" size={60} color="#007bff" />
                        <Text style={styles.customerWelcomeTitle}>Welcome, {user?.name || 'Customer'}!</Text>
                        <Text style={styles.customerWelcomeText}>Browse and purchase spare parts from our catalog.</Text>
                    </View>
                )}

                {/* Info Card */}
                <View style={styles.heroContainer}>
                    <View style={styles.heroCircle}>
                        <Ionicons name="analytics" size={60} color="#007bff" />
                    </View>
                    <View style={styles.heroInfo}>
                        <Text style={styles.heroTitle}>System Status: Live</Text>
                        <Text style={styles.heroText}>Detailed insights and management options are available in the menu.</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Menu Modal */}
            <Modal
                transparent={true}
                visible={menuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.menuContainer}>
                                <View style={styles.menuHeader}>
                                    <Text style={styles.menuTitle}>Quick Menu</Text>
                                    <TouchableOpacity onPress={() => setMenuVisible(false)}>
                                        <Ionicons name="close" size={24} color="#333" />
                                    </TouchableOpacity>
                                </View>
                                {menuItems.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.menuItem,
                                            item.title === 'Logout' && styles.logoutMenuItem
                                        ]}
                                        onPress={() => handleMenuPress(item)}
                                    >
                                        <Ionicons
                                            name={item.icon}
                                            size={22}
                                            color={item.title === 'Logout' ? '#dc3545' : '#007bff'}
                                            style={styles.menuIcon}
                                        />
                                        <Text style={[
                                            styles.menuItemText,
                                            item.title === 'Logout' && styles.logoutMenuText
                                        ]}>
                                            {item.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 52,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    profileBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.9,
    },
    menuBtn: {
        width: 42,
        height: 42,
        backgroundColor: '#f0f4f9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#1b2559',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 30,
    },
    header: {
        marginBottom: 28,
        paddingBottom: 8,
    },
    welcome: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    role: {
        fontSize: 14,
        color: '#0066cc',
        marginTop: 6,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    loaderContainer: {
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500',
    },
    errorContainer: {
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#dc3545',
    },
    errorText: {
        color: '#dc3545',
        marginTop: 12,
        fontSize: 15,
        textAlign: 'center',
        fontWeight: '500',
    },
    retryBtn: {
        marginTop: 18,
        backgroundColor: '#0066cc',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#0066cc',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: '#ffffff',
        width: '48%',
        minHeight: 140,
        padding: 20,
        borderRadius: 18,
        flexDirection: 'column',
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        borderTopWidth: 3,
        marginBottom: 16,
    },
    statContent: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    statIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        lineHeight: 30,
    },
    statTitle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 6,
        letterSpacing: 0.2,
    },
    heroContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#0066cc',
    },
    heroCircle: {
        width: 88,
        height: 88,
        backgroundColor: '#eef4ff',
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        elevation: 1,
        shadowColor: '#0066cc',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    heroInfo: {
        flex: 1,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 6,
        letterSpacing: -0.2,
    },
    heroText: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
        fontWeight: '400',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 100,
        paddingRight: 16,
    },
    menuContainer: {
        backgroundColor: '#ffffff',
        width: 260,
        borderRadius: 18,
        padding: 16,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 12,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        paddingHorizontal: 12,
        marginVertical: 2,
    },
    logoutMenuItem: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 12,
        backgroundColor: '#fff5f5',
    },
    menuIcon: {
        width: 30,
    },
    menuItemText: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
        letterSpacing: 0.1,
    },
    logoutMenuText: {
        color: '#dc3545',
        fontWeight: '600',
    },
    customerWelcome: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        marginVertical: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    customerWelcomeTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0f172a',
        marginTop: 16,
        marginBottom: 8,
        letterSpacing: -0.2,
    },
    customerWelcomeText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '400',
    },
});

export default HomeScreen;
