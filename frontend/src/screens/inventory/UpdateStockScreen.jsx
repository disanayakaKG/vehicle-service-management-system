import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getProductById, updateInventoryStock } from '../../api/api';

const UpdateStockScreen = ({ route, navigation }) => {
    const { productId } = route.params;
    const { token } = useContext(AuthContext);
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [mode, setMode] = useState('set');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const loadProduct = async () => {
            if (!productId) {
                Alert.alert('Error', 'Product ID not provided');
                navigation.goBack();
                return;
            }
            try {
                const response = await getProductById(productId);
                setProduct(response.data);
            } catch (err) {
                console.error('Error loading product:', err);
                Alert.alert('Error', 'Could not load product details');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
    }, [productId, navigation]);

    const handleUpdate = async () => {
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            Alert.alert('Error', 'Please enter a valid quantity greater than 0');
            return;
        }

        setUpdating(true);
        try {
            await updateInventoryStock(productId, { mode, quantity: qty }, token);
            Alert.alert('Success', 'Stock updated successfully');
            navigation.goBack();
        } catch (err) {
            console.error('Update error:', err);
            Alert.alert('Error', err.response?.data?.message || 'Failed to update stock');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loaderText}>Loading product...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!product) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
                    <Text style={styles.errorText}>Product not found</Text>
                    <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.backIconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Update Stock</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.productCard}>
                    <Text style={styles.productName}>{product.name || 'Unnamed Product'}</Text>
                    <Text style={styles.productId}>ID: {product.productId || productId}</Text>
                    <Text style={styles.currentStock}>Current Stock: {product.stockQuantity ?? 0}</Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Update Mode</Text>
                    <View style={styles.modeContainer}>
                        {['set', 'add', 'reduce'].map((m) => (
                            <TouchableOpacity
                                key={m}
                                style={[styles.modeBtn, mode === m && styles.modeBtnSelected]}
                                onPress={() => setMode(m)}
                            >
                                <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextSelected]}>
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Quantity</Text>
                    <TextInput
                        style={styles.quantityInput}
                        placeholder="Enter quantity"
                        keyboardType="numeric"
                        value={quantity}
                        onChangeText={setQuantity}
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.cancelBtn]}
                            onPress={handleCancel}
                            disabled={updating}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.updateBtn, updating && styles.disabledBtn]}
                            onPress={handleUpdate}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.updateBtnText}>Update Stock</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 24,
        paddingBottom: 14,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backIconBtn: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
    },
    content: {
        padding: 18,
        paddingBottom: 26,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        color: '#dc3545',
        fontSize: 16,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    backBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    productCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    productName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    productId: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
    },
    currentStock: {
        fontSize: 14,
        color: '#475569',
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 12,
    },
    modeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 12,
        marginHorizontal: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    modeBtnSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    modeBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    modeBtnTextSelected: {
        color: '#ffffff',
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f8fafc',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    cancelBtn: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cancelBtnText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 16,
    },
    updateBtn: {
        backgroundColor: '#007bff',
    },
    updateBtnText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    disabledBtn: {
        backgroundColor: '#94a3b8',
    },
});

export default UpdateStockScreen;