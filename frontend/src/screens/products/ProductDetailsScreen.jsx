import React, { useContext, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Image, 
    Alert, 
    TouchableOpacity, 
    SafeAreaView,
    StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductContext } from '../../context/ProductContext';
import CustomButton from '../../components/CustomButton';

const API_BASE_URL = "http://10.156.182.146:5000";

// Safe helper to resolve full image URL for display
const resolveImageUri = (image) => {
    console.log("RESOLVED IMAGE URI:", image);
    if (!image) return null;
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads')) return `${API_BASE_URL}${image}`;
    if (image.startsWith('uploads')) return `${API_BASE_URL}/${image}`;
    if (image.startsWith('file')) return image;
    return `${API_BASE_URL}/uploads/${image}`;
};

const ProductDetailsScreen = ({ route, navigation }) => {
    const { productId } = route.params;
    const { products, deleteProduct } = useContext(ProductContext);
    
    // Find product in context
    const product = products.find(p => p.id === productId);

    const [imgError, setImgError] = useState(false);

    if (!product) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Product Details</Text>
                </View>
                <View style={styles.notFoundContainer}>
                    <Ionicons name="alert-circle-outline" size={80} color="#CBD5E0" />
                    <Text style={styles.notFoundText}>Product not found</Text>
                    <TouchableOpacity 
                        style={styles.backHomeBtn} 
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backHomeText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const discountedPrice = product.price - (product.price * product.discount / 100);
    const hasDiscount = product.discount > 0;

    const handleDelete = () => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => deleteProductAsync()
                }
            ]
        );
    };

    const deleteProductAsync = async () => {
        const realId = product._id || product.id;
        const result = await deleteProduct(realId);
        if (result?.success) {
            Alert.alert('Success', 'Product deleted successfully');
            navigation.navigate('ProductManagement');
        } else {
            Alert.alert('Error', result?.message || 'Failed to delete product');
        }
    };

    const DetailRow = ({ label, value, isHighlight = false }) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, isHighlight && styles.highlightValue]}>
                {value}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageContainer}>
                    {(!product.image || imgError) ? (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={80} color="#CBD5E0" />
                        </View>
                    ) : (
                        <Image 
                            source={{ uri: resolveImageUri(product.image) }} 
                            style={styles.image} 
                            resizeMode="cover"
                            onError={() => setImgError(true)}
                        />
                    )}
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.brandSubtitle}>{product.brand} | {product.vehicleType}</Text>
                    
                    <View style={styles.divider} />

                    <View style={styles.detailsGrid}>
                        <DetailRow label="Product ID" value={product.productId} />
                        <DetailRow label="Product Brand" value={product.brand} />
                        <DetailRow label="Vehicle Type" value={product.vehicleType} />
                        <DetailRow label="Compatible Vehicle" value={product.vehicleBrand || 'N/A'} />
                        
                        <View style={styles.dividerSmall} />
                        
                        <DetailRow 
                            label="Original Price" 
                            value={`Rs. ${parseInt(product.price).toLocaleString()}`} 
                        />
                        <DetailRow 
                            label="Discount (%)" 
                            value={hasDiscount ? `${product.discount}%` : '0%'} 
                            isHighlight={hasDiscount}
                        />
                        <DetailRow 
                            label="Final Price" 
                            value={`Rs. ${parseInt(discountedPrice).toLocaleString()}`} 
                            isHighlight={true}
                        />
                        
                        <View style={styles.dividerSmall} />
                        
                        <DetailRow label="In Stock" value={`${product.stocks} units`} />
                        <DetailRow 
                            label="Warranty" 
                            value={product.warrantyMonths === 0 ? "No Warranty" : `${product.warrantyMonths} months`} 
                        />
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                        {product.description || 'No description provided for this product.'}
                    </Text>
                </View>

                <View style={styles.actionContainer}>
                    <CustomButton 
                        title="Edit Product" 
                        onPress={() => navigation.navigate('EditProduct', { product })} 
                        style={styles.editBtn}
                    />
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        <Text style={styles.deleteButtonText}>Delete Product</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
    },
    backBtn: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1B2559',
    },
    container: {
        flex: 1,
        backgroundColor: '#F4F7FE',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageContainer: {
        width: '100%',
        height: 250,
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EDF2F7',
    },
    infoCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: -30,
        borderRadius: 20,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1B2559',
        marginBottom: 5,
    },
    brandSubtitle: {
        fontSize: 16,
        color: '#707EAE',
        fontWeight: '500',
        marginBottom: 15,
    },
    divider: {
        height: 1,
        backgroundColor: '#EDF2F7',
        marginVertical: 15,
    },
    dividerSmall: {
        height: 1,
        backgroundColor: '#F7FAFC',
        marginVertical: 10,
        width: '100%',
    },
    detailsGrid: {
        width: '100%',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    detailLabel: {
        fontSize: 14,
        color: '#A3AED0',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        color: '#1B2559',
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'right',
        paddingLeft: 20,
    },
    highlightValue: {
        color: '#007BFF',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1B2559',
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 15,
        color: '#4A5568',
        lineHeight: 22,
    },
    actionContainer: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    editBtn: {
        marginBottom: 10,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    notFoundContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    notFoundText: {
        fontSize: 18,
        color: '#707EAE',
        marginTop: 20,
        marginBottom: 20,
    },
    backHomeBtn: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    backHomeText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});

export default ProductDetailsScreen;
