import React, { useContext, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Image, 
    Alert, 
    TouchableOpacity, 
    SafeAreaView,
    StatusBar,
    TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { ProductContext } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { getProductById, API_BASE_URL, getReviewsByProduct, createReview, updateReview, deleteReview } from '../../api/api';
import { getMyOrders } from '../../api/orderApi';
import CustomButton from '../../components/CustomButton';

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
    const productId = route.params?.id || route.params?.productId;
    const { products, deleteProduct } = useContext(ProductContext);
    const { user, token } = useContext(AuthContext);
    const { addToCart, buyNow } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [selectedRating, setSelectedRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
    const [purchaseCheckLoading, setPurchaseCheckLoading] = useState(false);

    useEffect(() => {
        let active = true;

        const loadProduct = async () => {
            if (!productId) {
                if (active) {
                    setProduct(null);
                    setLoading(false);
                }
                return;
            }

            const localProduct = products.find(
                (p) => p._id === productId || p.id === productId
            );

            if (localProduct) {
                if (active) {
                    setProduct(localProduct);
                    setLoading(false);
                }
                return;
            }

            try {
                if (active) setLoading(true);
                const response = await getProductById(productId);
                const fetchedProduct = response.data;
                const frontendProduct = {
                    ...fetchedProduct,
                    id: fetchedProduct._id || fetchedProduct.id,
                    vehicleBrand: fetchedProduct.vehicleName || fetchedProduct.vehicleBrand,
                    stocks: fetchedProduct.stockQuantity ?? fetchedProduct.stocks,
                };
                if (active) {
                    setProduct(frontendProduct);
                }
            } catch (error) {
                console.error('Error loading product details:', error);
            } finally {
                if (active) setLoading(false);
            }
        };

        loadProduct();
        return () => {
            active = false;
        };
    }, [productId, products]);

    const loadReviews = async () => {
        if (!productId) return;
        try {
            const response = await getReviewsByProduct(productId);
            setReviews(response.data);
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    };

    useEffect(() => {
        loadReviews();
    }, [productId]);

    const checkPurchaseStatus = async () => {
        if (!user || !token || !productId) {
            setHasPurchasedProduct(false);
            return;
        }

        setPurchaseCheckLoading(true);
        try {
            const orders = await getMyOrders(token);
            const hasPurchased = orders.some(order => 
                order.orderStatus === 'Delivered' && 
                order.deliveryStatus === 'Delivered' &&
                order.items.some(item => item.productId === productId || item.productId === product?.productId)
            );
            setHasPurchasedProduct(hasPurchased);
        } catch (error) {
            console.error('Error checking purchase status:', error);
            setHasPurchasedProduct(false);
        } finally {
            setPurchaseCheckLoading(false);
        }
    };

    useEffect(() => {
        checkPurchaseStatus();
    }, [user, token, productId, product]);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Product Details</Text>
                </View>
                <View style={styles.notFoundContainer}>
                    <Text style={styles.notFoundText}>Loading product details...</Text>
                </View>
            </SafeAreaView>
        );
    }

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

    const originalPrice = Number(product.price) || 0;
    const discountPercent = Number(product.discount) || 0;
    const discountedPrice = discountPercent > 0 ? originalPrice - (originalPrice * discountPercent / 100) : originalPrice;
    const hasDiscount = discountPercent > 0 && discountedPrice < originalPrice;
    const categoryLabel = product.category || 'Spare Parts';
    const vehicleLabel = product.vehicleBrand || product.vehicleType || product.vehicleName || 'N/A';
    const stockLabel = product.stocks != null ? `${product.stocks} available` : 'N/A';
    const ratingLabel = product.rating != null ? `${product.rating}/5` : 'N/A';
    const warrantyMonths = Number(product.warrantyMonths ?? 0);
    const warrantyLabel = warrantyMonths > 0 ? `${warrantyMonths} months` : 'No Warranty';
    const isAdmin = user?.role === 'admin';
    const isCustomer = user?.role === 'customer';

    const handleAddCart = () => {
        if ((product.stockQuantity || 0) === 0) {
            Alert.alert('Out of Stock', 'This product is currently out of stock.');
            return;
        }
        addToCart(product);
        navigation.navigate('Cart');
    };

    const handleBuyNow = () => {
        if ((product.stockQuantity || 0) === 0) {
            Alert.alert('Out of Stock', 'This product is currently out of stock.');
            return;
        }
        buyNow(product);
        navigation.navigate('Cart');
    };

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

    const handleDeleteReview = async (reviewId) => {
        Alert.alert(
            'Delete Review',
            'Are you sure you want to delete this review?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteReview(reviewId, token);
                            Alert.alert('Success', 'Review deleted successfully');
                            loadReviews();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete review');
                        }
                    }
                }
            ]
        );
    };

    const handleEditReview = (review) => {
        setEditingReviewId(review._id);
        setSelectedRating(review.rating);
        setReviewComment(review.comment);
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setReviewComment('');
        setSelectedRating(5);
    };

    const handleSubmitReview = async () => {
        if (!reviewComment.trim()) {
            Alert.alert('Error', 'Please enter a comment');
            return;
        }
        if (!token) {
            Alert.alert('Error', 'You must be logged in to submit a review');
            return;
        }
        setReviewLoading(true);
        try {
            if (editingReviewId) {
                await updateReview(editingReviewId, { rating: selectedRating, comment: reviewComment }, token);
                Alert.alert('Success', 'Review updated successfully');
                setEditingReviewId(null);
            } else {
                await createReview(productId, { rating: selectedRating, comment: reviewComment }, token);
                Alert.alert('Success', 'Review submitted successfully');
            }
            setReviewComment('');
            setSelectedRating(5);
            loadReviews();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
        } finally {
            setReviewLoading(false);
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

    const StarRating = ({ rating, editable = false, onRatingChange }) => {
        return (
            <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={editable ? () => onRatingChange(star) : null}
                        style={styles.star}
                    >
                        <Text style={[styles.starText, star <= rating && styles.starFilled]}>
                            {star <= rating ? '★' : '☆'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

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
                    <Text style={styles.brandSubtitle}>{product.brand || 'Brand'} | {categoryLabel}</Text>
                    
                    <View style={styles.divider} />

                    <View style={styles.detailsGrid}>
                        <DetailRow label="Product ID" value={product.productId || 'N/A'} />
                        <DetailRow label="Brand" value={product.brand || 'N/A'} />
                        <DetailRow label="Category" value={categoryLabel} />
                        <DetailRow label="Vehicle" value={vehicleLabel} />
                        <DetailRow label="Rating" value={ratingLabel} />
                        
                        <View style={styles.dividerSmall} />
                        
                        <DetailRow 
                            label="Original Price" 
                            value={`Rs. ${originalPrice.toLocaleString()}`} 
                        />
                        <DetailRow 
                            label="Discount (%)" 
                            value={hasDiscount ? `${discountPercent}%` : '0%'} 
                            isHighlight={hasDiscount}
                        />
                        <DetailRow 
                            label="Final Price" 
                            value={`Rs. ${discountedPrice.toLocaleString()}`} 
                            isHighlight={true}
                        />

                        <View style={styles.dividerSmall} />

                        <DetailRow label="Stock" value={stockLabel} />
                        <DetailRow 
                            label="Warranty" 
                            value={warrantyLabel} 
                        />
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                        {product.description || 'No description provided for this product.'}
                    </Text>
                </View>

                <View style={styles.actionContainer}>
                    {isCustomer && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity 
                                style={[
                                    styles.primaryButton, 
                                    (product.stockQuantity || 0) === 0 && styles.disabledButton
                                ]} 
                                onPress={handleAddCart}
                                disabled={(product.stockQuantity || 0) === 0}
                            >
                                <Text style={[
                                    styles.primaryButtonText,
                                    (product.stockQuantity || 0) === 0 && styles.disabledButtonText
                                ]}>
                                    {product.stockQuantity === 0 ? 'Out of Stock' : 'Add Cart'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    styles.secondaryButton, 
                                    (product.stockQuantity || 0) === 0 && styles.disabledButton
                                ]} 
                                onPress={handleBuyNow}
                                disabled={(product.stockQuantity || 0) === 0}
                            >
                                <Text style={[
                                    styles.secondaryButtonText,
                                    (product.stockQuantity || 0) === 0 && styles.disabledButtonText
                                ]}>
                                    {product.stockQuantity === 0 ? 'Out of Stock' : 'Buy Now'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {isAdmin && (
                        <>
                            <CustomButton 
                                title="Edit Product" 
                                onPress={() => navigation.navigate('EditProduct', { product })} 
                                style={styles.editBtn}
                            />
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                <Text style={styles.deleteButtonText}>Delete Product</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {isCustomer && (
                    <View style={styles.reviewFormContainer}>
                        {purchaseCheckLoading ? (
                            <Text style={styles.noReviewsText}>Checking purchase status...</Text>
                        ) : hasPurchasedProduct ? (
                            <>
                                <Text style={styles.sectionTitle}>Write a Review</Text>
                                <StarRating rating={selectedRating} editable={true} onRatingChange={setSelectedRating} />
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder="Write your review comment here..."
                                    value={reviewComment}
                                    onChangeText={setReviewComment}
                                    multiline
                                    numberOfLines={4}
                                />
                                <TouchableOpacity 
                                    style={[styles.submitButton, reviewLoading && styles.disabledButton]} 
                                    onPress={handleSubmitReview}
                                    disabled={reviewLoading}
                                >
                                    <Text style={styles.submitButtonText}>
                                        {reviewLoading ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                                    </Text>
                                </TouchableOpacity>
                                {editingReviewId && (
                                    <TouchableOpacity 
                                        style={styles.cancelButton} 
                                        onPress={handleCancelEdit}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel Edit</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View>
                                <Text style={styles.sectionTitle}>Write a Review</Text>
                                <Text style={styles.noReviewsText}>
                                    You can only review products you have purchased and received.
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.reviewsContainer}>
                    <Text style={styles.sectionTitle}>Customer Reviews</Text>
                    {reviews.length === 0 ? (
                        <Text style={styles.noReviewsText}>No reviews yet</Text>
                    ) : (
                        reviews.map((review) => {
                            const isOwnReview = review.user?._id === user?._id || review.user === user?._id;
                            return (
                                <View key={review._id} style={styles.reviewItem}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={styles.reviewerName}>{review.user?.name || 'Anonymous'}</Text>
                                        <View style={styles.reviewActions}>
                                            <StarRating rating={review.rating} />
                                            {isOwnReview && isCustomer && (
                                                <View style={styles.actionButtons}>
                                                    <TouchableOpacity 
                                                        style={styles.editReviewButton} 
                                                        onPress={() => handleEditReview(review)}
                                                    >
                                                        <Ionicons name="pencil" size={16} color="#007BFF" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity 
                                                        style={styles.deleteReviewButton} 
                                                        onPress={() => handleDeleteReview(review._id)}
                                                    >
                                                        <Ionicons name="trash" size={16} color="#FF3B30" />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <Text style={styles.reviewComment}>{review.comment}</Text>
                                    <Text style={styles.reviewDate}>
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#eaf4ff',
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
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginRight: 10,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#0EA5E9',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
    },
    starContainer: {
        flexDirection: 'row',
        marginVertical: 10,
    },
    star: {
        marginHorizontal: 2,
    },
    starText: {
        fontSize: 24,
        color: '#ddd',
    },
    starFilled: {
        color: '#FFD700',
    },
    reviewFormContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 20,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        marginVertical: 10,
        textAlignVertical: 'top',
        minHeight: 80,
    },
    submitButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    disabledButtonText: {
        color: '#999',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    reviewsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        borderRadius: 20,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    noReviewsText: {
        fontSize: 16,
        color: '#707EAE',
        textAlign: 'center',
        marginTop: 10,
    },
    reviewItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 15,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1B2559',
    },
    reviewComment: {
        fontSize: 14,
        color: '#4A5568',
        marginVertical: 5,
    },
    reviewDate: {
        fontSize: 12,
        color: '#A3AED0',
    },
    reviewActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        marginLeft: 10,
    },
    editReviewButton: {
        marginRight: 10,
        padding: 5,
    },
    deleteReviewButton: {
        padding: 5,
    },
    cancelButton: {
        backgroundColor: '#6B7280',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    }
});

export default ProductDetailsScreen;
