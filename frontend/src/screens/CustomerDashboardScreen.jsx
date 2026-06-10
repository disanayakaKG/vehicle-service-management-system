import React, { useCallback, useContext, useState, useRef, useEffect } from 'react';
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
  Platform,
  Animated,
  Dimensions
} from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width } = Dimensions.get('window');
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

  // Banner Setup
  const [activeBanner, setActiveBanner] = useState(0);
  const banners = [
    { id: '1', title: 'Summer Sale', subtitle: 'Up to 30% off on all brake pads', color: '#EF4444' },
    { id: '2', title: 'Free Inspection', subtitle: 'Book any service today', color: '#111111' },
    { id: '3', title: 'New Arrivals', subtitle: 'Check out our latest performance parts', color: '#3b82f6' },
  ];

  const bannerScrollRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextSlide = (activeBanner + 1) % banners.length;
      setActiveBanner(nextSlide);
      bannerScrollRef.current?.scrollTo({ x: nextSlide * width, animated: true });
    }, 4000);
    return () => clearInterval(timer);
  }, [activeBanner, banners.length]);

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // We don't need headerTranslateY for absolute positioning anymore, 
  // as the header will be part of the ScrollView.
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [products]);

  const renderTopHeaderRow = () => (
    <View style={styles.redHeaderTopPart}>
      <SafeAreaView edges={['top', 'left', 'right']}>
        <Animated.View style={[styles.headerTopRow, { opacity: headerOpacity }]}>
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
        </Animated.View>
      </SafeAreaView>
    </View>
  );

  const renderStickySearchBar = () => (
    <View style={styles.redHeaderBottomPart}>
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
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Main Animated ScrollView */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {renderTopHeaderRow()}
        {renderStickySearchBar()}

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], backgroundColor: '#f8fafc', paddingTop: 20 }}>
          {/* Promotional Banners */}
          <View style={styles.bannerContainer}>
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveBanner(newIndex);
              }}
            >
              {banners.map((banner, index) => (
                <View key={banner.id} style={{ width: width, paddingHorizontal: 20 }}>
                  <View style={[styles.bannerCard, { backgroundColor: banner.color }]}>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.paginationDots}>
              {banners.map((_, i) => (
                <View key={i} style={[styles.dot, activeBanner === i && styles.activeDot]} />
              ))}
            </View>
          </View>

          {/* Featured Spare Parts Section (Horizontal) */}
          <View style={styles.recommendedSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Featured Spare Parts</Text>
              <Text style={styles.viewAllText}>View All</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollPadding}>
              {filteredProducts.map((product) => {
                const imageUri = resolveImageUri(product.image);
                const productId = product._id || product.id;
                
                return (
                  <Pressable
                    key={productId}
                    onPress={() => handleProductPress(product)}
                  >
                    {({ pressed }) => (
                      <Animated.View style={[styles.horizontalProductCard, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
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
                            <Ionicons name="add" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                          <Text style={styles.productPrice}>Rs. {product.finalPrice ?? product.price ?? '0'}</Text>
                        </View>
                      </Animated.View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          
          {/* Recent Arrivals Section (Vertical Grid) */}
          <View style={styles.recommendedSection}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>New Arrivals</Text>
            <View style={styles.recommendedGrid}>
              {filteredProducts.slice(0, 4).map((product) => {
                const imageUri = resolveImageUri(product.image);
                const productId = product._id || product.id;
                return (
                  <Pressable
                    key={`new-${productId}`}
                    onPress={() => handleProductPress(product)}
                    style={{ width: '48%' }}
                  >
                    {({ pressed }) => (
                      <Animated.View style={[styles.productCard, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
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
                            <Ionicons name="add" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                          <Text style={styles.productPrice}>Rs. {product.finalPrice ?? product.price ?? '0'}</Text>
                        </View>
                      </Animated.View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111', // Black background to bleed into the safe area behind scrollview
  },
  redHeaderTopPart: {
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  redHeaderBottomPart: {
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
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
    marginBottom: 10,
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
  scrollContentContainer: {
    paddingBottom: 60,
    backgroundColor: '#f8fafc',
    flexGrow: 1,
  },
  bannerContainer: {
    marginBottom: 24,
  },
  bannerCard: {
    flex: 1,
    height: 140,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#EF4444',
    width: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAllText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  recommendedSection: {
    marginBottom: 24,
  },
  horizontalScrollPadding: {
    paddingHorizontal: 20,
    gap: 16,
  },
  horizontalProductCard: {
    width: width * 0.45,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  productCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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