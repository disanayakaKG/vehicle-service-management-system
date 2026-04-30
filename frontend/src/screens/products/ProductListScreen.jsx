import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
    View, Text, StyleSheet, FlatList, 
    TouchableOpacity, RefreshControl 
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { ProductContext } from '../../context/ProductContext';
import ProductCard from '../../components/ProductCard';
import Loading from '../../components/Loading';

const ProductListScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const { products, fetchProducts } = useContext(ProductContext);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (products.length > 0) {
            setLoading(false);
        }
    }, [products]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchProducts();
        setRefreshing(false);
    }, [fetchProducts]);

    if (loading && !refreshing) return <Loading />;

    const renderHeader = () => (
        <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>All Products</Text>
            {user?.role === 'admin' && (
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddProduct')}
                >
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <ProductCard 
                        product={item} 
                        onPress={() => navigation.navigate('ProductDetails', { id: item._id })}
                    />
                )}
                ListHeaderComponent={renderHeader}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listContent: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1b2559',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    addButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 2,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
});

export default ProductListScreen;
