import React, { useContext, useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Alert,
    ActivityIndicator,
    Image,
    Platform,
    Modal,
    Animated,
    LayoutAnimation,
    UIManager,
    Pressable,
    ScrollView,
    Dimensions,
    Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../api/api';
import {
    getServices,
    createService,
    deleteService,
    getServiceAvailability,
    bookService,
    getMyServiceBookings,
    cancelServiceBooking
} from '../../api/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const resolveImageUri = (image) => {
    if (!image || typeof image !== 'string') return null;
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads')) return `${API_BASE_URL}${image}`;
    if (image.startsWith('uploads')) return `${API_BASE_URL}/${image}`;
    return `${API_BASE_URL}/uploads/${image}`;
};

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BANNER_DATA = [
    { id: '1', title: '20% Off Engine Service', subtitle: 'Keep your car running like new.', image: 'https://images.unsplash.com/photo-1486262715619-67081010ddbe?auto=format&fit=crop&w=800&q=80' },
    { id: '2', title: 'Free Vehicle Inspection', subtitle: 'Book any repair service today.', image: 'https://images.unsplash.com/photo-1503375830208-2280d195c639?auto=format&fit=crop&w=800&q=80' },
    { id: '3', title: 'Weekend Offers', subtitle: 'Exclusive discounts this weekend.', image: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80' },
];

const ServiceBookingScreen = ({ navigation }) => {
    const { token, user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin';

    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Booking Form State
    const [selectedService, setSelectedService] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    // UI Flow States
    const [isBookingSheetVisible, setIsBookingSheetVisible] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showBookingsModal, setShowBookingsModal] = useState(false);

    // Admin Add Service State
    const [serviceName, setServiceName] = useState('');
    const [serviceDescription, setServiceDescription] = useState('');
    const [servicePrice, setServicePrice] = useState('');
    const [serviceImage, setServiceImage] = useState(null);
    const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scrollY = useRef(new Animated.Value(0)).current;
    
    // Bottom Sheet Animation
    const bottomSheetAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
    
    // Success Checkmark Animation
    const checkmarkScale = useRef(new Animated.Value(0)).current;

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
    }, [services]);

    const getMinimumDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    const onDateChange = (event, date) => {
        setShowDatePicker(false);
        if (event?.type === 'dismissed') return;
        const newDate = date || event?.nativeEvent?.timestamp;
        if (newDate) {
            const d = new Date(newDate);
            if (!isNaN(d.getTime())) {
                setSelectedDate(d);
                setSlots([]);
                setSelectedSlot('');
            }
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const servicesRes = await getServices(token);
            setServices(servicesRes.data);
            if (!isAdmin) {
                const bookingsRes = await getMyServiceBookings(token);
                setBookings(bookingsRes.data);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [token]);

    const toggleAddService = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsAddServiceOpen(!isAddServiceOpen);
    };

    const openBookingSheet = (service) => {
        setSelectedService(service);
        setSelectedDate(new Date());
        setSlots([]);
        setSelectedSlot('');
        setIsBookingSheetVisible(true);
        Animated.spring(bottomSheetAnim, {
            toValue: 0,
            friction: 9,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const closeBookingSheet = () => {
        Animated.timing(bottomSheetAnim, {
            toValue: Dimensions.get('window').height,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start(() => {
            setIsBookingSheetVisible(false);
            setSelectedService(null);
        });
    };

    const triggerSuccessAnimation = () => {
        setShowSuccessModal(true);
        Animated.sequence([
            Animated.spring(checkmarkScale, {
                toValue: 1.2,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(checkmarkScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();

        setTimeout(() => {
            setShowSuccessModal(false);
            checkmarkScale.setValue(0);
        }, 2500);
    };

    const onCheckAvailability = async (id) => {
        if (!selectedDate) {
            Alert.alert('Select Date', 'Please select a date first');
            return;
        }
        try {
            const dateStr = formatDate(selectedDate);
            const response = await getServiceAvailability(id, dateStr, token);
            const availableSlots = response.data?.availableSlots || [];
            if (availableSlots.length === 0) {
                Alert.alert('No Slots', 'No available slots for this date.');
            }
            setSlots(availableSlots);
            setSelectedSlot('');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to get availability');
        }
    };

    const onBook = async () => {
        if (!selectedSlot || !selectedDate) {
            Alert.alert('Missing Info', 'Please select a date and time slot.');
            return;
        }

        const dateStr = formatDate(selectedDate);
        if (!selectedService || !selectedService._id) {
            Alert.alert('Error', 'Service ID missing.');
            return;
        }

        try {
            await bookService(selectedService._id, { date: dateStr, timeSlot: selectedSlot }, token);
            closeBookingSheet();
            triggerSuccessAnimation();
            loadData();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Booking failed');
        }
    };

    const onPickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow photo access');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.length) {
            setServiceImage(result.assets[0]);
        }
    };

    const onAddService = async () => {
        if (!serviceName.trim() || !servicePrice.trim()) {
            Alert.alert('Missing fields', 'Service name and price are required');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('name', serviceName);
            formData.append('description', serviceDescription);
            formData.append('price', String(Number(servicePrice)));
            formData.append('durationMinutes', '60');

            if (serviceImage?.uri) {
                const uriParts = serviceImage.uri.split('/');
                const fileName = uriParts[uriParts.length - 1] || `service-${Date.now()}.jpg`;
                const ext = fileName.split('.').pop()?.toLowerCase();
                const type = ext === 'png' ? 'image/png' : 'image/jpeg';
                formData.append('image', { uri: serviceImage.uri, name: fileName, type });
            }

            await createService(formData, token);
            setServiceName('');
            setServiceDescription('');
            setServicePrice('');
            setServiceImage(null);
            setIsAddServiceOpen(false);
            loadData();
            Alert.alert('Success', 'Service added successfully!');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create service');
        }
    };

    const onDeleteService = async (id) => {
        try {
            await deleteService(id, token);
            loadData();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete service');
        }
    };

    const onCancelBooking = async (bookingId) => {
        try {
            await cancelServiceBooking(bookingId, token);
            loadData();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const filteredServices = services.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderTopHeaderRow = () => (
        <View style={styles.redHeaderTopPart}>
            <SafeAreaView edges={['top', 'left', 'right']}>
                <Animated.View style={[styles.headerTopRow, { opacity: headerOpacity }]}>
                    <Text style={styles.welcomeText}>Service Booking.</Text>
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
            {/* Floating Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search services"
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <Ionicons name="mic-outline" size={20} color="#64748b" style={styles.micIcon} />
                <Ionicons name="camera-outline" size={20} color="#64748b" />
            </View>
        </View>
    );

    const renderBanners = () => (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.bannerContainer}
            snapToInterval={width - 40 + 16}
            decelerationRate="fast"
        >
            {BANNER_DATA.map((banner) => (
                <View key={banner.id} style={styles.bannerCard}>
                    <Image source={{ uri: banner.image }} style={styles.bannerImage} />
                    <View style={styles.bannerOverlay}>
                        <Text style={styles.bannerTitle}>{banner.title}</Text>
                        <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );

    const renderSkeleton = () => (
        <View style={styles.listContainer}>
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
        </View>
    );

    const renderServiceItem = ({ item, index }) => {
        const scaleAnim = new Animated.Value(1);

        const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
        const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

        return (
            <AnimatedPressable
                style={[styles.serviceCard, { transform: [{ scale: scaleAnim }] }]}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
            >
                <View style={styles.serviceImageContainer}>
                    {resolveImageUri(item.image) ? (
                        <Image source={{ uri: resolveImageUri(item.image) }} style={styles.serviceImage} />
                    ) : (
                        <View style={styles.serviceImagePlaceholder}>
                            <Ionicons name="car-sport" size={40} color="#ef4444" />
                        </View>
                    )}
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={14} color="#fbbf24" />
                        <Text style={styles.ratingText}>4.8</Text>
                    </View>
                </View>
                
                <View style={styles.serviceInfo}>
                    <View style={styles.serviceHeaderRow}>
                        <Text style={styles.serviceName}>{item.name}</Text>
                        <Text style={styles.servicePrice}>Rs. {Number(item.price || 0).toFixed(0)}</Text>
                    </View>
                    <Text style={styles.serviceText} numberOfLines={2}>{item.description || 'Professional vehicle service'}</Text>
                    
                    <View style={styles.serviceMetaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={16} color="#64748b" />
                            <Text style={styles.metaText}>60 mins</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                            <Text style={styles.metaText}>Available</Text>
                        </View>
                    </View>

                    {isAdmin ? (
                        <TouchableOpacity style={styles.deleteButton} onPress={() => onDeleteService(item._id)}>
                            <Ionicons name="trash-outline" size={18} color="#fff" />
                            <Text style={styles.deleteText}>Delete Service</Text>
                        </TouchableOpacity>
                    ) : (
                        <Pressable style={{ width: '100%', marginTop: 16 }} onPress={() => openBookingSheet(item)}>
                            {({ pressed }) => (
                                <Animated.View style={[styles.bookBtn, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                                    <Text style={styles.bookBtnText}>Book Now</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </Animated.View>
                            )}
                        </Pressable>
                    )}
                </View>
            </AnimatedPressable>
        );
    };

    return (
        <View style={styles.container}>
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
                    {loading ? renderSkeleton() : (
                        <View>
                            {renderBanners()}
                            <View style={styles.listContainer}>
                                <View style={styles.listHeaderTitles}>
                                    <Text style={styles.sectionTitle}>Premium Services</Text>
                                </View>
                            
                            {isAdmin && (
                                <View style={styles.adminSection}>
                                    <TouchableOpacity style={styles.addServiceToggle} onPress={toggleAddService}>
                                        <Ionicons name={isAddServiceOpen ? "close-circle" : "add-circle"} size={24} color="#ef4444" />
                                        <Text style={styles.addServiceToggleText}>{isAddServiceOpen ? 'Cancel' : 'Add New Service'}</Text>
                                    </TouchableOpacity>

                                    {isAddServiceOpen && (
                                        <View style={styles.addServiceForm}>
                                            <TextInput style={styles.inputStyle} placeholder="Service Name" value={serviceName} onChangeText={setServiceName} />
                                            <TextInput style={styles.inputStyle} placeholder="Description" value={serviceDescription} onChangeText={setServiceDescription} multiline />
                                            <TextInput style={styles.inputStyle} placeholder="Price (Rs.)" keyboardType="numeric" value={servicePrice} onChangeText={setServicePrice} />
                                            
                                            <TouchableOpacity style={styles.imagePickerBtn} onPress={onPickImage}>
                                                <Ionicons name="image-outline" size={20} color="#ef4444" />
                                                <Text style={styles.imagePickerText}>{serviceImage ? 'Change Image' : 'Select Service Image'}</Text>
                                            </TouchableOpacity>
                                            
                                            {serviceImage?.uri && (
                                                <Image source={{ uri: serviceImage.uri }} style={styles.previewImage} />
                                            )}
                                            
                                            <TouchableOpacity style={styles.submitAddBtn} onPress={onAddService}>
                                                <Text style={styles.submitAddBtnText}>Save Service</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                            
                            {filteredServices.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="construct-outline" size={60} color="#cbd5e1" />
                                    <Text style={styles.emptyTitle}>No Services Available</Text>
                                    <Text style={styles.emptySubtitle}>We are updating our service catalog. Please check back later.</Text>
                                </View>
                            ) : (
                                filteredServices.map((service, index) => (
                                    <View key={service._id}>
                                        {renderServiceItem({ item: service, index })}
                                    </View>
                                ))
                            )}

                            {!isAdmin && (
                                <Pressable 
                                    onPress={() => setShowBookingsModal(true)}
                                    style={{ marginVertical: 20 }}
                                >
                                    {({ pressed }) => (
                                        <Animated.View style={[styles.myBookingsBanner, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                                            <View style={styles.myBookingsLeft}>
                                                <View style={styles.myBookingsIconSquare}>
                                                    <Ionicons name="calendar" size={24} color="#fff" />
                                                </View>
                                                <View>
                                                    <Text style={styles.myBookingsTitleBanner}>My Bookings</Text>
                                                    <Text style={styles.myBookingsSubBanner}>View your history & status</Text>
                                                </View>
                                            </View>
                                            <View style={styles.badgeCountBanner}>
                                                <Text style={styles.badgeTextBanner}>{bookings.length}</Text>
                                            </View>
                                        </Animated.View>
                                    )}
                                </Pressable>
                            )}
                        </View>
                        </View>
                    )}
                </Animated.View>
            </Animated.ScrollView>

            {/* Bottom Sheet Booking Modal */}
            {isBookingSheetVisible && (
                <View style={styles.bottomSheetOverlay}>
                    <Pressable style={styles.bottomSheetBackground} onPress={closeBookingSheet} />
                    <Animated.View style={[styles.bottomSheetContainer, { transform: [{ translateY: bottomSheetAnim }] }]}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Schedule Service</Text>
                            <TouchableOpacity onPress={closeBookingSheet} style={styles.sheetCloseBtn}>
                                <Ionicons name="close" size={24} color="#0f172a" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            {selectedService && (
                                <View style={styles.sheetServiceSummary}>
                                    {resolveImageUri(selectedService.image) ? (
                                        <Image source={{ uri: resolveImageUri(selectedService.image) }} style={styles.sheetServiceImage} />
                                    ) : (
                                        <View style={styles.sheetServicePlaceholder}>
                                            <Ionicons name="car" size={24} color="#ef4444" />
                                        </View>
                                    )}
                                    <View style={styles.sheetServiceInfo}>
                                        <Text style={styles.sheetServiceName}>{selectedService.name}</Text>
                                        <Text style={styles.sheetServicePrice}>Rs. {Number(selectedService.price).toFixed(0)}</Text>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.sheetSectionTitle}>Select Date</Text>
                            <TouchableOpacity
                                style={styles.dateSelector}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={22} color="#ef4444" />
                                <Text style={styles.dateText}>
                                    {formatDate(selectedDate)}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.checkSlotsBtn} onPress={() => onCheckAvailability(selectedService?._id)}>
                                <Text style={styles.checkSlotsBtnText}>Check Availability</Text>
                            </TouchableOpacity>

                            {slots.length > 0 && (
                                <View style={styles.slotsWrapper}>
                                    <Text style={styles.sheetSectionTitle}>Available Slots</Text>
                                    <View style={styles.slotGrid}>
                                        {slots.map((slot) => (
                                            <TouchableOpacity
                                                key={slot}
                                                style={[styles.slotButton, selectedSlot === slot && styles.slotButtonActive]}
                                                onPress={() => setSelectedSlot(slot)}
                                            >
                                                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                            
                            {slots.length === 0 && selectedSlot === '' && selectedDate && (
                                <Text style={styles.noSlotsText}>Tap 'Check Availability' to view open time slots.</Text>
                            )}

                            <View style={styles.sheetDivider} />
                            
                            <View style={styles.sheetTotalRow}>
                                <Text style={styles.sheetTotalLabel}>Total Estimate</Text>
                                <Text style={styles.sheetTotalValue}>Rs. {selectedService ? Number(selectedService.price).toFixed(0) : '0'}</Text>
                            </View>

                            <Pressable style={{ width: '100%', marginTop: 20 }} onPress={onBook}>
                                {({ pressed }) => (
                                    <Animated.View style={[styles.sheetConfirmBtn, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                                        <Text style={styles.sheetConfirmBtnText}>Confirm Booking</Text>
                                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    </Animated.View>
                                )}
                            </Pressable>
                        </ScrollView>
                    </Animated.View>
                </View>
            )}

            {/* My Bookings Modal */}
            <Modal visible={showBookingsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBookingsModal(false)}>
                <SafeAreaView style={styles.bookingsModalContainer}>
                    <View style={styles.bookingsModalHeader}>
                        <Text style={styles.bookingsModalTitle}>My Bookings</Text>
                        <TouchableOpacity onPress={() => setShowBookingsModal(false)} style={styles.bookingsModalCloseBtn}>
                            <Ionicons name="close" size={24} color="#0f172a" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.bookingsModalScroll} showsVerticalScrollIndicator={false}>
                        {bookings.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
                                <Text style={styles.emptyStateText}>No bookings found.</Text>
                            </View>
                        ) : (
                            bookings.map((booking) => (
                                <View key={booking._id} style={styles.bookingItem}>
                                    <View style={styles.bookingMainInfo}>
                                        <View style={styles.bookingIconWrap}>
                                            <Ionicons name="construct" size={24} color="#ef4444" />
                                        </View>
                                        <View style={styles.bookingTextWrap}>
                                            <Text style={styles.bookingServiceName}>{booking.service?.name || 'Vehicle Service'}</Text>
                                            <Text style={styles.bookingTimeText}>{booking.bookingDate} • {booking.timeSlot}</Text>
                                        </View>
                                        <View style={[
                                            styles.statusBadge,
                                            booking.status === 'Booked' ? styles.bookedBadge : styles.canceledBadge
                                        ]}>
                                            <Text style={[
                                                styles.statusText,
                                                booking.status === 'Booked' ? styles.bookedText : styles.canceledText
                                            ]}>{booking.status}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.bookingActionRow}>
                                        <Text style={styles.bookingIdText}>ID: {booking._id.substring(0, 8).toUpperCase()}</Text>
                                        <TouchableOpacity 
                                            style={styles.detailsBtn} 
                                            onPress={() => {
                                                setShowBookingsModal(false);
                                                navigation.navigate('EditBooking', { booking });
                                            }}
                                        >
                                            <Text style={styles.detailsBtnText}>View Details</Text>
                                            <Ionicons name="chevron-forward" size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Date Picker Modal */}
            <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.datePickerContainer}>
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                minimumDate={getMinimumDate()}
                                onChange={onDateChange}
                                style={styles.datePicker}
                                textColor="#0f172a"
                                themeVariant="light"
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Animation Modal */}
            {showSuccessModal && (
                <View style={styles.successOverlay}>
                    <Animated.View style={[styles.successCard, { transform: [{ scale: checkmarkScale }] }]}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name="checkmark-sharp" size={50} color="#fff" />
                        </View>
                        <Text style={styles.successTitle}>Booking Confirmed!</Text>
                        <Text style={styles.successSubtitle}>Your service has been scheduled successfully.</Text>
                    </Animated.View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
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
        fontSize: 26,
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
    headerAvatarImage: { width: '100%', height: '100%' },
    headerAvatarPlaceholder: {
        width: '100%', height: '100%',
        backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center',
    },
    headerAvatarInitial: {
        fontSize: 18, fontWeight: 'bold', color: '#ef4444',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 25,
        paddingHorizontal: 16,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
        flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '500',
    },
    micIcon: { marginHorizontal: 10 },
    
    // Banners
    bannerContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    bannerCard: {
        width: width - 40,
        height: 160,
        borderRadius: 20,
        marginRight: 16,
        overflow: 'hidden',
        backgroundColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        opacity: 0.7,
    },
    bannerOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        padding: 20,
        justifyContent: 'center',
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    bannerSubtitle: {
        color: '#f8fafc',
        fontSize: 15,
        fontWeight: '500',
    },

    scrollContentContainer: {
        paddingBottom: 60,
        backgroundColor: '#f8fafc',
        flexGrow: 1,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    listHeaderTitles: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
    },
    
    // Skeleton
    skeletonCard: {
        width: '100%',
        height: 300,
        backgroundColor: '#e2e8f0',
        borderRadius: 24,
        marginBottom: 20,
        opacity: 0.5,
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },

    // Service Cards
    serviceCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginBottom: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    serviceImageContainer: {
        height: 180,
        width: '100%',
        backgroundColor: '#f1f5f9',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    serviceImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
    },
    ratingBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    ratingText: {
        fontWeight: '700',
        color: '#0f172a',
        marginLeft: 4,
        fontSize: 13,
    },
    serviceInfo: {
        padding: 20,
    },
    serviceHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        flex: 1,
        marginRight: 8,
    },
    servicePrice: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ef4444',
    },
    serviceText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 22,
        marginBottom: 16,
    },
    serviceMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 10,
    },
    metaText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    bookBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111111',
        borderRadius: 16,
        paddingVertical: 16,
    },
    bookBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        marginRight: 8,
    },

    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
    },
    deleteText: {
        color: '#fff',
        fontWeight: '700',
        marginLeft: 8,
        fontSize: 15,
    },

    // Bottom Sheet
    bottomSheetOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 100,
        justifyContent: 'flex-end',
    },
    bottomSheetBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomSheetContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '90%',
    },
    sheetHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#cbd5e1',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
    },
    sheetCloseBtn: {
        padding: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
    },
    sheetServiceSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sheetServiceImage: {
        width: 60, height: 60, borderRadius: 12, marginRight: 16,
    },
    sheetServicePlaceholder: {
        width: 60, height: 60, borderRadius: 12, marginRight: 16,
        backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center',
    },
    sheetServiceInfo: { flex: 1 },
    sheetServiceName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    sheetServicePrice: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
    
    sheetSectionTitle: {
        fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12,
    },
    dateSelector: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16,
        padding: 16, marginBottom: 16,
    },
    dateText: { flex: 1, marginLeft: 12, fontSize: 16, color: '#0f172a', fontWeight: '600' },
    checkSlotsBtn: {
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ef4444',
        borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24,
    },
    checkSlotsBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
    
    slotsWrapper: { marginBottom: 20 },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotButton: {
        backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
        borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
    },
    slotButtonActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
    slotText: { color: '#64748b', fontWeight: '600', fontSize: 15 },
    slotTextActive: { color: '#fff' },
    
    sheetDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
    sheetTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sheetTotalLabel: { fontSize: 16, color: '#64748b', fontWeight: '600' },
    sheetTotalValue: { fontSize: 24, color: '#0f172a', fontWeight: '800' },
    
    sheetConfirmBtn: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 18,
        shadowColor: '#ef4444', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    sheetConfirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 18, marginRight: 8 },
    noSlotsText: { color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginBottom: 20 },

    // Success Modal
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 200,
    },
    successCard: {
        backgroundColor: '#fff', borderRadius: 30, padding: 40,
        alignItems: 'center', width: '80%',
    },
    successIconCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
        shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
    successTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
    successSubtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },

    // My Bookings Banner
    myBookingsBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#111111', borderRadius: 24, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
    },
    myBookingsLeft: { flexDirection: 'row', alignItems: 'center' },
    myBookingsIconSquare: {
        backgroundColor: '#ef4444', padding: 14, borderRadius: 16, marginRight: 16,
    },
    myBookingsTitleBanner: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
    myBookingsSubBanner: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
    badgeCountBanner: {
        backgroundColor: '#ef4444', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6,
    },
    badgeTextBanner: { color: '#fff', fontWeight: '800', fontSize: 14 },

    // My Bookings Modal (Existing Redesign)
    bookingsModalContainer: { flex: 1, backgroundColor: '#f8fafc' },
    bookingsModalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    bookingsModalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
    bookingsModalCloseBtn: { padding: 4, backgroundColor: '#f1f5f9', borderRadius: 20 },
    bookingsModalScroll: { padding: 20, paddingBottom: 60 },
    bookingItem: {
        backgroundColor: '#fff', borderRadius: 24, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 16,
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    bookingMainInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    bookingIconWrap: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 18, marginRight: 16 },
    bookingTextWrap: { flex: 1 },
    bookingServiceName: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    bookingTimeText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    bookedBadge: { backgroundColor: '#dcfce7' },
    canceledBadge: { backgroundColor: '#f1f5f9' },
    statusText: { fontSize: 12, fontWeight: '800' },
    bookedText: { color: '#16a34a' },
    canceledText: { color: '#64748b' },
    bookingActionRow: {
        borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    bookingIdText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
    detailsBtn: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14,
        backgroundColor: '#fef2f2', borderRadius: 12,
    },
    detailsBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 14, marginRight: 6 },
    
    // Misc
    adminSection: { paddingHorizontal: 20, marginBottom: 20 },
    addServiceToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 16, borderRadius: 16 },
    addServiceToggleText: { color: '#ef4444', fontWeight: '800', fontSize: 16, marginLeft: 8 },
    addServiceForm: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
    inputStyle: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, marginBottom: 16, fontSize: 16, color: '#0f172a' },
    imagePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ef4444', borderStyle: 'dashed', borderRadius: 16, padding: 16, marginBottom: 16 },
    imagePickerText: { color: '#ef4444', fontWeight: '700', marginLeft: 8, fontSize: 16 },
    previewImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 16 },
    submitAddBtn: { backgroundColor: '#111111', borderRadius: 16, padding: 18, alignItems: 'center' },
    submitAddBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, width: '90%', padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    datePickerContainer: { alignItems: 'center', marginBottom: 10 },
    datePicker: { width: '100%', height: Platform.OS === 'ios' ? 300 : 'auto' },
});

export default ServiceBookingScreen;
