import React, { useContext, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    Image, 
    TouchableOpacity, 
    SafeAreaView,
    StatusBar,
    Platform,
    Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductContext } from '../../context/ProductContext';
import { API_BASE_URL } from '../../api/api';

// Safe helper to resolve full image URL for display
const resolveImageUri = (image) => {
    if (!image) return null;
    if (typeof image !== 'string') return null;
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads')) return `${API_BASE_URL}${image}`;
    if (image.startsWith('uploads')) return `${API_BASE_URL}/${image}`;
    if (image.startsWith('file')) return image;
    return `${API_BASE_URL}/uploads/${image}`;
};

// Helper Component for Image with Placeholder fallback
const ProductImage = ({ uri }) => {
    const [hasError, setHasError] = useState(false);

    const imageUri = resolveImageUri(uri);
    console.log("ProductManagement product.image:", uri);
    console.log("ProductManagement resolved imageUri:", imageUri);

    if (!imageUri || hasError) {
        return (
            <View style={styles.placeholderBox}>
                <Ionicons name="image-outline" size={20} color="#CBD5E0" />
            </View>
        );
    }

    return (
        <Image 
            source={{ uri: imageUri }} 
            style={styles.thumbnail}
            onError={(e) => {
                console.log("ProductManagement image load error:", e.nativeEvent.error, imageUri);
                setHasError(true);
            }}
        />
    );
};

const ProductManagementScreen = ({ navigation }) => {
    const { products, deleteProduct } = useContext(ProductContext);

    const handleEdit = (product) => {
        navigation.navigate('EditProduct', { product });
    };

    const handleDelete = (product) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => deleteProductAsync(product)
                }
            ]
        );
    };

    const deleteProductAsync = async (product) => {
        const realId = product._id || product.id;
        const result = await deleteProduct(realId);
        if (!result?.success) {
            Alert.alert('Error', result?.message || 'Failed to delete product');
        }
    };

    const calculateDiscountedPrice = (price, discount) => {
        const p = parseFloat(price) || 0;
        const d = parseFloat(discount) || 0;
        return p - (p * d / 100);
    };

    const renderHeader = () => (
        <View style={styles.contentHeader}>
            {/* Action Summary Card */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryInfo}>
                    <Text style={styles.summaryTitle}>Product Management</Text>
                    <Text style={styles.summarySubtitle}>Manage spare parts and product records</Text>
                    <View style={styles.statsRow}>
                        <Ionicons name="cube-outline" size={16} color="#4A5568" />
                        <Text style={styles.statsText}>Total Products: {products.length}</Text>
                    </View>
                </View>
                <TouchableOpacity 
                    style={styles.addProductBtn}
                    onPress={() => navigation.navigate('AddProduct')}
                >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.addProductText}>Add New Product</Text>
                </TouchableOpacity>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Existing Products</Text>
                <Text style={styles.sectionSubtitle}>View, edit, and delete product records</Text>
            </View>
        </View>
    );

    const renderProductItem = ({ item, index }) => {
        const discountedPrice = calculateDiscountedPrice(item.price, item.discount);
        const hasDiscount = parseFloat(item.discount) > 0;
        const serialNo = (index + 1).toString().padStart(2, '0');

        return (
            <TouchableOpacity 
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
                activeOpacity={0.7}
            >
                {/* Top Row: No, Image, Details, Actions */}
                <View style={styles.cardTopRow}>
                    <View style={styles.serialNoContainer}>
                        <Text style={styles.serialNoText}>No: {serialNo}</Text>
                    </View>
                    
                    <ProductImage uri={item.image} />
                    
                    <View style={styles.detailsContainer}>
                        <Text style={styles.productIdText}>ID: {item.productId}</Text>
                        <Text style={styles.productNameText} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.brandTypeText}>{item.brand} | {item.vehicleType}</Text>
                    </View>

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity 
                            onPress={() => handleEdit(item)} 
                            style={styles.iconBtn}
                        >
                            <Ionicons name="create-outline" size={20} color="#007BFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => handleDelete(item)} 
                            style={styles.iconBtn}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Row: Simple Price Row */}
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Price: <Text style={styles.priceValue}>Rs.{parseInt(item.price).toLocaleString()}</Text></Text>
                    <Text style={styles.priceLabel}>Discount: <Text style={[styles.discountValue, hasDiscount && styles.hasDiscount]}>
                        {hasDiscount ? `${item.discount}%` : '0%'}
                    </Text></Text>
                    <Text style={styles.priceLabel}>Final: <Text style={styles.finalValue}>Rs.{parseInt(discountedPrice).toLocaleString()}</Text></Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Top Navigation Header */}
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#1B2559" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Product Management</Text>
                <View style={{ width: 28 }} /> 
            </View>

            <View style={styles.container}>
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProductItem}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={60} color="#CBD5E0" />
                            <Text style={styles.emptyText}>No products found</Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    navHeader: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    backBtn: {
        padding: 5,
    },
    navTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1B2559',
    },
    container: {
        flex: 1,
        backgroundColor: '#F4F7FE',
    },
    listContent: {
        padding: 15,
        paddingBottom: 40,
    },
    contentHeader: {
        marginBottom: 5,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    summaryInfo: {
        marginBottom: 15,
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1B2559',
        marginBottom: 5,
    },
    summarySubtitle: {
        fontSize: 14,
        color: '#707EAE',
        marginBottom: 10,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsText: {
        fontSize: 14,
        color: '#4A5568',
        fontWeight: '600',
        marginLeft: 5,
    },
    addProductBtn: {
        backgroundColor: '#007BFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 2,
    },
    addProductText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 8,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1B2559',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#707EAE',
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    serialNoContainer: {
        marginRight: 8,
        backgroundColor: '#F4F7FE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    serialNoText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#707EAE',
    },
    thumbnail: {
        width: 55,
        height: 55,
        borderRadius: 10,
        backgroundColor: '#F7FAFC',
    },
    placeholderBox: {
        width: 55,
        height: 55,
        borderRadius: 10,
        backgroundColor: '#EDF2F7',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    detailsContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    productIdText: {
        fontSize: 10,
        color: '#A3AED0',
        fontWeight: 'bold',
    },
    productNameText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1B2559',
        marginVertical: 1,
    },
    brandTypeText: {
        fontSize: 11,
        color: '#707EAE',
        fontWeight: '500',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        padding: 4,
        marginLeft: 4,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F4F7FE',
        paddingTop: 8,
    },
    priceLabel: {
        fontSize: 11,
        color: '#A3AED0',
        fontWeight: '600',
    },
    priceValue: {
        color: '#1B2559',
        fontWeight: 'bold',
    },
    discountValue: {
        color: '#A3AED0',
        fontWeight: 'bold',
    },
    hasDiscount: {
        color: '#FF3B30',
    },
    finalValue: {
        color: '#28A745',
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
    },
    emptyText: {
        marginTop: 10,
        color: '#A3AED0',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default ProductManagementScreen;
