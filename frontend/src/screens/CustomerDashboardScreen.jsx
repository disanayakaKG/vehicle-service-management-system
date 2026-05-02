import React, { useCallback, useContext, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ProductContext } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../api/api';

const resolveImageUri = (image) => {
  if (!image || typeof image !== 'string') return null;
  if (image.startsWith('http')) return image;
  if (image.startsWith('/uploads')) return `${API_BASE_URL}${image}`;
  if (image.startsWith('uploads')) return `${API_BASE_URL}/${image}`;
  if (image.startsWith('file')) return image;
  return `${API_BASE_URL}/uploads/${image}`;
};

const CustomerDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { products, fetchProducts } = useContext(ProductContext);
  const { addToCart, buyNow, getCartItemCount } = useCart();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadProducts = async () => {
        try {
          setLoading(true);
          if (fetchProducts) {
            await fetchProducts();
          }
        } catch (error) {
          console.log('Customer dashboard product fetch error:', error);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      loadProducts();

      return () => {
        active = false;
      };
    }, [])
  );

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductPress = (product) => {
    const productId = product._id || product.id;
    if (productId) {
      navigation.navigate('ProductDetails', { id: productId });
    }
  };

  const handleAddCart = (product) => {
    addToCart(product);
    navigation.navigate('Cart');
  };

  const handleBuyNow = (product) => {
    buyNow(product);
    navigation.navigate('Cart');
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} style={styles.container}>
      <View style={styles.headerCard}>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileInitial}>{user?.name ? user.name.charAt(0).toUpperCase() : 'C'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>
          Welcome, <Text style={styles.headerName}>{user?.name || 'Customer'}</Text>
        </Text>
        <TouchableOpacity style={styles.headerCartButton} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.headerCartButtonText}>
            Cart{getCartItemCount() ? ` (${getCartItemCount()})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.shortcutBar}>
        <TouchableOpacity style={styles.shortcutButton} onPress={() => {}}>
          <View style={styles.shortcutIconContainer}>
            <Ionicons name="home-outline" size={20} color="#2563eb" />
          </View>
          <Text style={styles.shortcutLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shortcutButton} onPress={() => navigation.navigate('Cart')}>
          <View style={styles.shortcutIconContainer}>
            <Ionicons name="cart-outline" size={20} color="#2563eb" />
          </View>
          <Text style={styles.shortcutLabel}>Cart{getCartItemCount() ? ` (${getCartItemCount()})` : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shortcutButton} onPress={() => navigation.navigate('OrderHistory')}>
          <View style={styles.shortcutIconContainer}>
            <Ionicons name="receipt-outline" size={20} color="#2563eb" />
          </View>
          <Text style={styles.shortcutLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shortcutButton} onPress={() => navigation.navigate('Services')}>
          <View style={styles.shortcutIconContainer}>
            <Ionicons name="calendar-outline" size={20} color="#2563eb" />
          </View>
          <Text style={styles.shortcutLabel}>Services</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search spare parts..."
          placeholderTextColor="#8da8d6"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <Text style={styles.sectionHeading}>Products</Text>

      {loading ? (
        <Text style={styles.statusText}>Loading products...</Text>
      ) : filteredProducts.length === 0 ? (
        <Text style={styles.statusText}>No products available</Text>
      ) : (
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => {
            const imageUri = resolveImageUri(product.image);
            const productId = product._id || product.id;
            return (
              <TouchableOpacity
                key={productId}
                style={styles.productCard}
                onPress={() => handleProductPress(product)}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>Rs. {product.finalPrice ?? product.price ?? '0'}</Text>
                    {product.price && product.finalPrice && product.price !== product.finalPrice && (
                      <Text style={styles.originalPrice}>Rs. {product.price}</Text>
                    )}
                  </View>
                  {product.rating != null && <Text style={styles.productRating}>⭐ {product.rating}</Text>}
                  {product.stocks != null && <Text style={styles.productStock}>{product.stocks} available</Text>}
                </View>
                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.cartButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      handleAddCart(product);
                    }}
                  >
                    <Text style={styles.cartButtonText}>Add Cart</Text>
                  </Pressable>
                  <Pressable
                    style={styles.buyNowButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      handleBuyNow(product);
                    }}
                  >
                    <Text style={styles.buyNowButtonText}>Buy Now</Text>
                  </Pressable>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf4ff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerText: {
    fontSize: 16,
    color: '#4b6cb7',
    fontWeight: '500',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchCard: {
    backgroundColor: '#f2f8ff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#d7e7ff',
  },
  searchInput: {
    fontSize: 16,
    color: '#1f3a70',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#12263a',
    marginBottom: 12,
  },
  statusText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f2f8ff',
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#f2f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#64748b',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#12263a',
    marginBottom: 6,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  productRating: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 6,
  },
  cartButton: {
    flex: 1,
    backgroundColor: '#e8f1ff',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  cartButtonText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  headerCartButton: {
    marginLeft: 'auto',
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCartButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buyNowButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  shortcutBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#edf4ff',
    marginVertical: 16,
    elevation: 2,
  },
  shortcutButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  shortcutIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutLabel: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default CustomerDashboardScreen;