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

import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
    const { logout, user } = useContext(AuthContext);
    const { products } = useContext(ProductContext);

    const [menuVisible, setMenuVisible] = useState(false);
    const [stats, setStats] = useState({
        totalProducts: 0,
        ordersToday: 0,
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
                const response = await getDashboardOverview();
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
    }, [user?.role]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    const menuItems = [
        { title: 'Order and Delivery', icon: 'truck', screen: 'Placeholder', param: 'Order and Delivery' },
        { title: 'Feedback and Warranty', icon: 'shield-checkmark', screen: 'Placeholder', param: 'Feedback and Warranty' },
        { title: 'Supplier Management', icon: 'business', screen: 'Placeholder', param: 'Supplier Management' },
        { title: 'Spare Parts / Product', icon: 'cube', screen: user?.role === 'admin' ? 'ProductManagement' : 'ProductList', param: null },

        { title: 'Service and Booking', icon: 'calendar', screen: 'Placeholder', param: 'Service and Booking' },
        { title: 'Stocks and Inventory', icon: 'layers', screen: 'Placeholder', param: 'Stocks and Inventory' },
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

    const StatCard = ({ title, value, icon, color }) => (
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                <MaterialIcons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </View>
    );

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
                            icon="inventory"
                            color="#007bff"
                        />

                        <StatCard
                            title="Orders Today"
                            value={stats.ordersToday}
                            icon="shopping-cart"
                            color="#28a745"
                        />
                        <StatCard
                            title="Revenue"
                            value={`Rs. ${stats.revenue.toLocaleString()}`}
                            icon="attach-money"
                            color="#ffc107"
                        />
                        <StatCard
                            title="Low Stock"
                            value={stats.lowStock}
                            icon="warning"
                            color="#dc3545"
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
        backgroundColor: '#f4f7fe',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: '#fff',
    },
    profileBtn: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    welcome: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1b2559',
    },
    role: {
        fontSize: 16,
        color: '#007bff',
        marginTop: 4,
        fontWeight: '600',
    },
    loaderContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        color: '#666',
    },
    errorContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
    },
    errorText: {
        color: '#dc3545',
        marginTop: 10,
        fontSize: 16,
        textAlign: 'center',
    },
    retryBtn: {
        marginTop: 15,
        backgroundColor: '#007bff',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 10,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    statCard: {
        backgroundColor: '#fff',
        width: '48%',
        padding: 15,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1b2559',
    },
    statTitle: {
        fontSize: 12,
        color: '#a3aed0',
        fontWeight: '600',
    },
    heroContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    heroCircle: {
        width: 80,
        height: 80,
        backgroundColor: '#f4f7fe',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    heroInfo: {
        flex: 1,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1b2559',
        marginBottom: 4,
    },
    heroText: {
        fontSize: 13,
        color: '#707eae',
        lineHeight: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 100,
        paddingRight: 20,
    },
    menuContainer: {
        backgroundColor: '#fff',
        width: 250,
        borderRadius: 15,
        padding: 15,
        elevation: 10,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1b2559',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    logoutMenuItem: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 15,
    },
    menuIcon: {
        width: 30,
    },
    menuItemText: {
        fontSize: 15,
        color: '#444',
        fontWeight: '500',
    },
    logoutMenuText: {
        color: '#dc3545',
        fontWeight: 'bold',
    },
    customerWelcome: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        marginVertical: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    customerWelcomeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1b2559',
        marginTop: 15,
        marginBottom: 8,
    },
    customerWelcomeText: {
        fontSize: 14,
        color: '#707eae',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default HomeScreen;
