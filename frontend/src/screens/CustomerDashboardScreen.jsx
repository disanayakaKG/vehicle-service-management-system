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
  Pressable,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  const { addToCart, getCartItemCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const filteredProducts = products.filter((product) => {
    return product.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadProducts = async () => {
        try {
          if (fetchProducts) await fetchProducts();
        } catch (error) {
          console.log('Customer dashboard product fetch error:', error);
        }
      };
      loadProducts();
      return () => { active = false; };
    }, [])
  );

  const handleProductPress = (product) => {
    const productId = product._id || product.id;
    if (productId) navigation.navigate('ProductDetails', { id: productId });
  };

  return (
    <View style={styles.container}>
      {/* Vibrant Red Header */}
      <View style={styles.redHeader}>
        <SafeAreaView>
          <View style={styles.headerTopRow}>
            <Text style={styles.welcomeText}>Welcome to CarParts.</Text>
            <TouchableOpacity 
              style={styles.headerAvatarWrapper} 
              onPress={() => navigation.navigate('ProfileTab')}
            >
              {user?.profileImage ? (
                <Image source={{ uri: resolveImageUri(user.profileImage) }} style={styles.headerAvatarImage} />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarInitial}>
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search parts"
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <Ionicons name="mic-outline" size={20} color="#64748b" style={styles.micIcon} />
            <Ionicons name="camera-outline" size={20} color="#64748b" />
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsContainer}>
            <TouchableOpacity style={styles.pill}><Text style={styles.pillText}>Make <Ionicons name="chevron-down" size={12} /></Text></TouchableOpacity>
            <TouchableOpacity style={styles.pill}><Text style={styles.pillText}>Model <Ionicons name="chevron-down" size={12} /></Text></TouchableOpacity>
            <TouchableOpacity style={styles.pill}><Text style={styles.pillText}>Year <Ionicons name="chevron-down" size={12} /></Text></TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn}><Ionicons name="options-outline" size={16} color="#fff" /></TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Main Content Area overlapping the header */}
      <View style={styles.mainContent}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Spare Parts Section */}
          <View style={styles.recommendedSection}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>Available Spare Parts</Text>
            <View style={styles.recommendedGrid}>
              {filteredProducts.map((product) => {
                const imageUri = resolveImageUri(product.image);
                const productId = product._id || product.id;
                return (
                  <TouchableOpacity
                    key={productId}
                    style={styles.productCard}
                    onPress={() => handleProductPress(product)}
                  >
                    <View style={styles.productImageContainer}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.productImage} />
                      ) : (
                        <View style={styles.imagePlaceholder}><Ionicons name="car" size={40} color="#cbd5e1" /></View>
                      )}
                      <TouchableOpacity
                        style={styles.favoriteBtn}
                        onPress={() => addToCart(product)}
                      >
                        <Ionicons name="heart-outline" size={18} color="#000" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                      <Text style={styles.productPrice}>Rs. {product.finalPrice ?? product.price ?? '0'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  redHeader: {
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 40,
  },
  welcomeText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerAvatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ef4444',
    overflow: 'hidden',
    marginLeft: 15,
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  micIcon: {
    marginHorizontal: 10,
  },
  pillsContainer: {
    flexDirection: 'row',
  },
  pill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  pillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  filterBtn: {
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingTop: 24,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  recommendedSection: {
    marginBottom: 20,
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  productCard: {
    width: '48%', // 2 columns
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
});

export default CustomerDashboardScreen;