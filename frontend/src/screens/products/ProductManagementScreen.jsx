import React, { useContext, useState, useMemo } from 'react';
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
    Alert,
    TextInput,
    Modal,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductContext } from '../../context/ProductContext';
import { API_BASE_URL } from '../../api/api';

const VEHICLE_TYPE_OPTIONS = ['All', 'Car', 'Van', 'Truck', 'Bus', 'Motorcycle'];

const CATEGORY_OPTIONS = [
    'All',
    'Engine Parts',
    'Brake Parts',
    'Electrical Parts',
    'Body Parts',
    'Filters',
    'Tyres',
    'Batteries',
    'Spare Parts',
];

const SORT_OPTIONS = ['Default', 'Price: Low to High', 'Price: High to Low'];

const calculateDiscountedPrice = (price, discount) => {
    const p = parseFloat(price) || 0;
    const d = parseFloat(discount) || 0;
    return p - (p * d / 100);
};

const SelectInput = React.memo(({ value, onValueChange, options, placeholder, title, style }) => {
    const [visible, setVisible] = useState(false);

    const handleSelect = (option) => {
        onValueChange(option);
        setVisible(false);
    };

    return (
        <View style={[styles.selectInputContainer, style]}>
            <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.selectText, !value && styles.placeholderText]} numberOfLines={1}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title || placeholder || 'Select Option'}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={22} color="#1B2559" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalOptions} showsVerticalScrollIndicator={false}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.modalOption,
                                        value === option && styles.modalSelectedOption,
                                    ]}
                                    onPress={() => handleSelect(option)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.modalOptionText,
                                            value === option && styles.modalSelectedOptionText,
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                    {value === option ? (
                                        <Ionicons name="checkmark" size={18} color="#007BFF" />
                                    ) : null}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
});

const resolveImageUri = (image) => {
    if (!image) return null;
    if (typeof image !== 'string') return null;
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads')) return `${API_BASE_URL}${image}`;
    if (image.startsWith('uploads')) return `${API_BASE_URL}/${image}`;
    if (image.startsWith('file')) return image;
    return `${API_BASE_URL}/uploads/${image}`;
};

const ProductImage = ({ uri }) => {
    const [hasError, setHasError] = useState(false);
    const imageUri = resolveImageUri(uri);

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
            onError={() => setHasError(true)}
        />
    );
};

const HeaderSection = React.memo(({
    navigation,
    productsCount,
    displayedCount,
    searchQuery,
    setSearchQuery,
    selectedVehicleType,
    setSelectedVehicleType,
    selectedCategory,
    setSelectedCategory,
    selectedSort,
    setSelectedSort,
}) => {
    return (
        <View style={styles.contentHeader}>
            <View style={styles.summaryCard}>
                <View style={styles.summaryInfo}>
                    <Text style={styles.summaryTitle}>Product Management</Text>
                    <Text style={styles.summarySubtitle}>Manage spare parts and product records</Text>
                    <View style={styles.statsRow}>
                        <Ionicons name="cube-outline" size={16} color="#4A5568" />
                        <Text style={styles.statsText}>Total Products: {productsCount}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.addProductBtn}
                    onPress={() => navigation.navigate('AddProduct')}
                >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.addProductText}>Add New Product</Text>
                </TouchableOpacity>

                <View style={styles.searchBarContainer}>
                    <Ionicons name="search" size={18} color="#A3AED0" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, ID, category, or vehicle type..."
                        placeholderTextColor="#A3AED0"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCorrect={false}
                        autoCapitalize="none"
                        blurOnSubmit={false}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#A3AED0" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            <View style={styles.filtersCard}>
                <Text style={styles.filtersTitle}>Filters</Text>

                <View style={styles.filterRow}>
                    <View style={styles.filterColumn}>
                        <Text style={styles.filterLabel}>Vehicle Type</Text>
                        <SelectInput
                            value={selectedVehicleType}
                            onValueChange={setSelectedVehicleType}
                            options={VEHICLE_TYPE_OPTIONS}
                            placeholder="Select vehicle type"
                            title="Vehicle Type"
                        />
                    </View>

                    <View style={[styles.filterColumn, styles.filterColumnLast]}>
                        <Text style={styles.filterLabel}>Category</Text>
                        <SelectInput
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                            options={CATEGORY_OPTIONS}
                            placeholder="Select category"
                            title="Category"
                        />
                    </View>
                </View>

                <View style={styles.fullWidthFilter}>
                    <Text style={styles.filterLabel}>Sort</Text>
                    <SelectInput
                        value={selectedSort}
                        onValueChange={setSelectedSort}
                        options={SORT_OPTIONS}
                        placeholder="Select sort order"
                        title="Sort"
                    />
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Existing Products</Text>
                <Text style={styles.sectionSubtitle}>
                    {displayedCount} of {productsCount} products
                </Text>
            </View>
        </View>
    );
});

const ProductManagementScreen = ({ navigation }) => {
    const { products, deleteProduct } = useContext(ProductContext);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVehicleType, setSelectedVehicleType] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedSort, setSelectedSort] = useState('Default');

    const displayedProducts = useMemo(() => {
        let filtered = Array.isArray(products) ? [...products] : [];

        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();

            filtered = filtered.filter((product) => {
                const name = String(product.name || '').toLowerCase();
                const productId = String(product.productId || '').toLowerCase();
                const category = String(product.category || '').toLowerCase();
                const vehicleType = String(product.vehicleType || '').toLowerCase();

                return (
                    name.includes(query) ||
                    productId.includes(query) ||
                    category.includes(query) ||
                    vehicleType.includes(query)
                );
            });
        }

        if (selectedVehicleType !== 'All') {
            filtered = filtered.filter((product) => product.vehicleType === selectedVehicleType);
        }

        if (selectedCategory !== 'All') {
            filtered = filtered.filter((product) => product.category === selectedCategory);
        }

        if (selectedSort === 'Price: Low to High') {
            filtered.sort((a, b) => {
                const priceA = Number(a.finalPrice ?? calculateDiscountedPrice(a.price, a.discount) ?? 0);
                const priceB = Number(b.finalPrice ?? calculateDiscountedPrice(b.price, b.discount) ?? 0);
                return priceA - priceB;
            });
        }

        if (selectedSort === 'Price: High to Low') {
            filtered.sort((a, b) => {
                const priceA = Number(a.finalPrice ?? calculateDiscountedPrice(a.price, a.discount) ?? 0);
                const priceB = Number(b.finalPrice ?? calculateDiscountedPrice(b.price, b.discount) ?? 0);
                return priceB - priceA;
            });
        }

        return filtered;
    }, [products, searchQuery, selectedVehicleType, selectedCategory, selectedSort]);

    const handleEdit = (product) => {
        navigation.navigate('EditProduct', { product });
    };

    const deleteProductAsync = async (product) => {
        const realId = product._id || product.id;
        const result = await deleteProduct(realId);

        if (!result?.success) {
            Alert.alert('Error', result?.message || 'Failed to delete product');
        }
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
                    onPress: () => deleteProductAsync(product),
                },
            ]
        );
    };

    const renderProductItem = ({ item, index }) => {
        const discountedPrice = calculateDiscountedPrice(item.price, item.discount);
        const hasDiscount = parseFloat(item.discount) > 0;

        return (
            <TouchableOpacity
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
                activeOpacity={0.7}
            >
                <View style={styles.cardTopRow}>
                    <View style={styles.leftColumn}>
                        <View style={styles.serialNoContainer}>
                            <Text style={styles.serialNoText}>No: {(index + 1).toString().padStart(2, '0')}</Text>
                        </View>
                        <ProductImage uri={item.image} />
                    </View>

                    <View style={styles.detailsContainer}>
                        <Text style={styles.productIdText}>ID: {item.productId}</Text>
                        <Text style={styles.productNameText} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={styles.brandTypeText}>
                            {item.brand} | {item.vehicleType}
                        </Text>
                    </View>

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            onPress={() => handleEdit(item)}
                            style={styles.iconBtn}
                        >
                            <Ionicons name="create-outline" size={20} color="#0A84FF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDelete(item)}
                            style={styles.iconBtn}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottomDivider} />

                <View style={styles.priceRow}>
                    <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>Price</Text>
                        <Text style={styles.priceValue}>Rs.{parseInt(item.price || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.priceItemCenter}>
                        <Text style={styles.priceLabel}>Discount</Text>
                        <Text style={[styles.discountValue, hasDiscount && styles.hasDiscount]}>
                            {hasDiscount ? `${item.discount}%` : '0%'}
                        </Text>
                    </View>
                    <View style={styles.priceItemRight}>
                        <Text style={styles.priceLabel}>Final</Text>
                        <Text style={styles.finalValue}>Rs.{parseInt(discountedPrice || 0).toLocaleString()}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#1B2559" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Product Management</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.container}>
                <FlatList
                    data={displayedProducts}
                    keyExtractor={(item, index) => String(item._id || item.id || item.productId || index)}
                    renderItem={renderProductItem}
                    ListHeaderComponent={
                        <HeaderSection
                            navigation={navigation}
                            productsCount={products.length}
                            displayedCount={displayedProducts.length}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            selectedVehicleType={selectedVehicleType}
                            setSelectedVehicleType={setSelectedVehicleType}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            selectedSort={selectedSort}
                            setSelectedSort={setSelectedSort}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={60} color="#CBD5E0" />
                            <Text style={styles.emptyText}>
                                {products.length === 0 ? 'No products found' : 'No matching products found'}
                            </Text>
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
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    navHeader: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E8ECF5',
        elevation: 0,
        shadowColor: 'transparent',
    },
    backBtn: {
        padding: 8,
    },
    navTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#172554',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
        borderRadius: 24,
        padding: 22,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E8ECF5',
        elevation: 3,
        shadowColor: '#172554',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
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
        backgroundColor: '#0A84FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 18,
        elevation: 2,
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
    },
    addProductText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 8,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        paddingHorizontal: 14,
        marginTop: 18,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E8ECF5',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 5,
        fontSize: 14,
        color: '#1B2559',
    },
    filtersCard: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#E8ECF5',
        elevation: 1,
        shadowColor: '#172554',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
    },
    filtersTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1B2559',
        marginBottom: 12,
    },
    filterRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    filterColumn: {
        flex: 1,
        marginRight: 10,
    },
    filterColumnLast: {
        marginRight: 0,
    },
    fullWidthFilter: {
        width: '100%',
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 6,
    },
    selectInputContainer: {
        marginBottom: 0,
    },
    selectInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E8ECF5',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        minHeight: 44,
    },
    selectText: {
        fontSize: 13,
        color: '#1B2559',
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    placeholderText: {
        color: '#A3AED0',
        fontWeight: '400',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        width: '100%',
        maxHeight: '70%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1B2559',
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalOptions: {
        maxHeight: 360,
    },
    modalOption: {
        paddingVertical: 13,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalSelectedOption: {
        backgroundColor: '#F4F7FE',
    },
    modalOptionText: {
        fontSize: 15,
        color: '#1B2559',
    },
    modalSelectedOptionText: {
        color: '#007BFF',
        fontWeight: 'bold',
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
        borderRadius: 20,
        padding: 14,
        marginBottom: 14,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E6ECF5',
        elevation: 2,
        shadowColor: '#172554',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 18,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    leftColumn: {
        alignItems: 'flex-start',
        marginRight: 12,
    },
    serialNoContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        marginBottom: 8,
    },
    serialNoText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1E2A5A',
    },
    thumbnail: {
        width: 72,
        height: 72,
        borderRadius: 14,
        backgroundColor: '#F7FAFC',
    },
    placeholderBox: {
        width: 72,
        height: 72,
        borderRadius: 14,
        backgroundColor: '#EDF2F7',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8ECF5',
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
        marginRight: 12,
    },
    productIdText: {
        fontSize: 11,
        color: '#6B7C9A',
        fontWeight: '600',
        marginBottom: 4,
    },
    productNameText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#172554',
        lineHeight: 22,
        marginBottom: 6,
    },
    brandTypeText: {
        fontSize: 12,
        color: '#5F6D8F',
        fontWeight: '500',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginLeft: 4,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#F5F8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    bottomDivider: {
        height: 1,
        backgroundColor: '#EEF2F7',
        marginVertical: 12,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceItem: {
        flex: 1,
    },
    priceItemCenter: {
        flex: 1,
        alignItems: 'center',
    },
    priceItemRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: 12,
        color: '#6B7C9A',
        fontWeight: '600',
        marginBottom: 2,
    },
    priceValue: {
        color: '#172554',
        fontWeight: '700',
        fontSize: 14,
    },
    discountValue: {
        color: '#FF3B30',
        fontWeight: '700',
        fontSize: 14,
    },
    hasDiscount: {
        color: '#FF3B30',
    },
    finalValue: {
        color: '#28A745',
        fontWeight: '700',
        fontSize: 14,
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