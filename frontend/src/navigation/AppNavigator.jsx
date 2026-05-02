import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
                    {user && user.role === 'admin' ? (
                        // Admin Screens
                        <>
                            <Stack.Screen name="AdminDashboardDetails" component={AdminDashboardDetailsScreen} />
                            <Stack.Screen name="AdminOrderManagement" component={AdminOrderManagementScreen} />
                        </>
                    ) : (
                        // No additional screens
                        <></>
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
