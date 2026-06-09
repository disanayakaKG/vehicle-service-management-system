import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import Loading from '../components/Loading';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import ProductListScreen from '../screens/products/ProductListScreen';
import ProductDetailsScreen from '../screens/products/ProductDetailsScreen';
import AddProductScreen from '../screens/products/AddProductScreen';
import EditProductScreen from '../screens/products/EditProductScreen';
import ProductManagementScreen from '../screens/products/ProductManagementScreen';
import InventoryDashboardScreen from '../screens/inventory/InventoryDashboardScreen';
import UpdateStockScreen from '../screens/inventory/UpdateStockScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import PaymentScreen from '../screens/cart/PaymentScreen';
import OrderHistoryScreen from '../screens/orders/OrderHistoryScreen';
import DeliveryTrackingScreen from '../screens/orders/DeliveryTrackingScreen';
import ServiceBookingScreen from '../screens/services/ServiceBookingScreen';
import ServiceManagementScreen from '../screens/services/ServiceManagementScreen';
import EditBookingScreen from '../screens/services/EditBookingScreen';
import AdminDashboardDetailsScreen from '../screens/admin/AdminDashboardDetailsScreen';
import AdminOrderManagementScreen from '../screens/admin/AdminOrderManagementScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'ServicesTab') {
                        iconName = focused ? 'construct' : 'construct-outline';
                    } else if (route.name === 'CartTab') {
                        iconName = focused ? 'cart' : 'cart-outline';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={24} color={color} />;
                },
                tabBarActiveTintColor: '#ef4444',
                tabBarInactiveTintColor: '#64748b',
                tabBarStyle: {
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    backgroundColor: '#ffffff',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                }
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
            <Tab.Screen name="ServicesTab" component={ServiceBookingScreen} options={{ tabBarLabel: 'Services' }} />
            <Tab.Screen name="CartTab" component={CartScreen} options={{ tabBarLabel: 'Cart' }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <Loading />;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                // Authenticated Screens
                <>
                    <Stack.Screen name="Main" component={MainTabNavigator} />
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="Placeholder" component={PlaceholderScreen} />
                    <Stack.Screen name="ProductList" component={ProductListScreen} />
                    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
                    <Stack.Screen name="AddProduct" component={AddProductScreen} />
                    <Stack.Screen name="EditProduct" component={EditProductScreen} />
                    <Stack.Screen name="ProductManagement" component={ProductManagementScreen} />
                    <Stack.Screen name="InventoryDashboard" component={InventoryDashboardScreen} />
                    <Stack.Screen name="UpdateStock" component={UpdateStockScreen} />
                    <Stack.Screen name="Cart" component={CartScreen} />
                    <Stack.Screen name="Checkout" component={CheckoutScreen} />
                    <Stack.Screen name="Payment" component={PaymentScreen} />
                    <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
                    <Stack.Screen name="DeliveryTracking" component={DeliveryTrackingScreen} />
                    <Stack.Screen name="Services" component={ServiceBookingScreen} />
                    <Stack.Screen name="ServiceManagement" component={ServiceManagementScreen} />
                    <Stack.Screen name="EditBooking" component={EditBookingScreen} />
                    {user && user.role === 'admin' && (
                        // Admin Screens
                        <>
                            <Stack.Screen name="AdminDashboardDetails" component={AdminDashboardDetailsScreen} />
                            <Stack.Screen name="AdminOrderManagement" component={AdminOrderManagementScreen} />
                        </>
                    )}
                </>
            ) : (
                // Unauthenticated Screens
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
