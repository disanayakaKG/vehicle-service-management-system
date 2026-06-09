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
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
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
    
    // Admin Add Service State
    const [serviceName, setServiceName] = useState('');
    const [serviceDescription, setServiceDescription] = useState('');
    const [servicePrice, setServicePrice] = useState('');
    const [serviceImage, setServiceImage] = useState(null);
    const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

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

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (event?.type === 'dismissed') return;
        const newDate = selectedDate || event?.nativeEvent?.timestamp;
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

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleMyBookings = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleServiceBooking = (serviceId) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (selectedService === serviceId) {
            setSelectedService(null);
            setSlots([]);
            setSelectedSlot('');
        } else {
            setSelectedService(serviceId);
            setSlots([]);
            setSelectedSlot('');
        }
    };

    const toggleAddService = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsAddServiceOpen(!isAddServiceOpen);
    };

    const onCheckAvailability = async (serviceId) => {
        const date = formatDate(selectedDate);
        if (!date) {
            Alert.alert('Date required', 'Please select a date');
            return;
        }
        try {
            const response = await getServiceAvailability(serviceId, date, token);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setSlots(response.data.availableSlots || []);
            setSelectedSlot('');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to load slots');
        }
    };

    const onBook = async () => {
        const date = formatDate(selectedDate);
        if (!selectedService || !date || !selectedSlot) {
            Alert.alert('Missing details', 'Select a date and a time slot first');
            return;
        }

        try {
            await bookService(selectedService, { date, timeSlot: selectedSlot }, token);
            Alert.alert('Success', 'Service booked successfully!', [
                {
                    text: 'Great',
                    onPress: () => {
                        setSelectedService(null);
                        setSlots([]);
                        setSelectedSlot('');
                        loadData();
                        navigation.navigate('HomeTab');
                    }
                }
            ]);
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

    const renderHeader = () => (
        <View style={styles.redHeader}>
            <SafeAreaView>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.navigate('HomeTab')} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="notifications-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <Text style={styles.welcomeText}>Service Booking</Text>
                
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search services..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <Ionicons name="mic-outline" size={20} color="#666" style={styles.micIcon} />
                </View>

                {/* Filter Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsContainer}>
                    <View style={styles.pillActive}><Text style={styles.pillTextActive}>All</Text></View>
                    <View style={styles.pill}><Text style={styles.pillText}>Repair</Text></View>
                    <View style={styles.pill}><Text style={styles.pillText}>Maintenance</Text></View>
                    <View style={styles.pill}><Text style={styles.pillText}>Inspection</Text></View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );

    const renderServiceItem = ({ item, index }) => {
        const isExpanded = selectedService === item._id;
        const scaleAnim = new Animated.Value(1);

        const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
        const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

        return (
            <AnimatedPressable
                style={[styles.serviceCard, { transform: [{ scale: scaleAnim }] }]}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={() => !isAdmin && toggleServiceBooking(item._id)}
            >
                <View style={styles.serviceImageContainer}>
                    {resolveImageUri(item.image) ? (
                        <Image source={{ uri: resolveImageUri(item.image) }} style={styles.serviceImage} />
                    ) : (
                        <View style={styles.serviceImagePlaceholder}>
                            <Ionicons name="car-sport" size={40} color="#ef4444" />
                        </View>
                    )}
                    <View style={styles.favoriteBadge}>
                        <Ionicons name="heart-outline" size={20} color="#ef4444" />
                    </View>
                </View>
                
                <View style={styles.serviceInfo}>
                    <View style={styles.serviceHeaderRow}>
                        <Text style={styles.serviceName}>{item.name}</Text>
                        <Text style={styles.servicePrice}>Rs. {Number(item.price || 0).toFixed(0)}</Text>
                    </View>
                    <Text style={styles.serviceText} numberOfLines={2}>{item.description || 'Professional vehicle service'}</Text>
                    
                    {isAdmin && (
                        <TouchableOpacity style={styles.deleteButton} onPress={() => onDeleteService(item._id)}>
                            <Ionicons name="trash-outline" size={16} color="#fff" />
                            <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Booking Form Expansion */}
                {!isAdmin && isExpanded && (
                    <View style={styles.bookingFormContainer}>
                        <Text style={styles.bookingFormTitle}>Book this Service</Text>
                        
                        <TouchableOpacity
                            style={styles.dateSelector}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#ef4444" />
                            <Text style={styles.dateText}>
                                {formatDate(selectedDate)}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.checkSlotsBtn} onPress={() => onCheckAvailability(item._id)}>
                            <Text style={styles.checkSlotsBtnText}>Check Availability</Text>
                        </TouchableOpacity>

                        {slots.length > 0 && (
                            <View style={styles.slotsWrapper}>
                                <Text style={styles.slotsLabel}>Available Slots:</Text>
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
                                
                                <TouchableOpacity style={styles.bookActionBtn} onPress={onBook}>
                                    <Text style={styles.bookActionBtnText}>Confirm Booking</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {slots.length === 0 && selectedSlot === '' && selectedDate && (
                            <Text style={styles.noSlotsText}>Tap 'Check Availability' to see slots.</Text>
                        )}
                    </View>
                )}
            </AnimatedPressable>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ef4444" />
                <Text style={styles.loadingText}>Loading Services...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}
            
            <Animated.View style={[
                styles.mainContent,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}>
                
                {/* Admin Add Service Button */}
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

                <FlatList
                    data={filteredServices}
                    keyExtractor={(item) => item._id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                    ListHeaderComponent={<Text style={styles.sectionTitle}>Available Services</Text>}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Ionicons name="construct-outline" size={48} color="#cbd5e1" />
                            <Text style={{ marginTop: 12, color: '#64748b', fontSize: 16 }}>No services available at the moment.</Text>
                        </View>
                    }
                    renderItem={renderServiceItem}
                    ListFooterComponent={
                        !isAdmin ? (
                            <View style={styles.myBookingsWrapper}>
                                <TouchableOpacity style={styles.myBookingsHeader} onPress={toggleMyBookings}>
                                    <View style={styles.myBookingsLeft}>
                                        <Ionicons name="calendar" size={22} color="#ef4444" />
                                        <Text style={styles.myBookingsTitle}>My Bookings</Text>
                                        <View style={styles.badgeCount}>
                                            <Text style={styles.badgeText}>{bookings.length}</Text>
                                        </View>
                                    </View>
                                    <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={22} color="#94a3b8" />
                                </TouchableOpacity>

                                {isDropdownOpen && (
                                    <View style={styles.myBookingsContent}>
                                        {bookings.length === 0 ? (
                                            <View style={styles.emptyState}>
                                                <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
                                                <Text style={styles.emptyStateText}>No bookings found.</Text>
                                            </View>
                                        ) : (
                                            bookings.map((booking) => {
                                                const bookingTime = new Date(booking.createdAt);
                                                const timeDiffInSeconds = (currentTime - bookingTime) / 1000;
                                                const canEdit = timeDiffInSeconds <= 60;

                                                return (
                                                    <View key={booking._id} style={styles.bookingItem}>
                                                        <View style={styles.bookingMainInfo}>
                                                            <View style={styles.bookingIconWrap}>
                                                                <Ionicons name="car" size={24} color="#ef4444" />
                                                            </View>
                                                            <View style={styles.bookingTextWrap}>
                                                                <Text style={styles.bookingServiceName}>{booking.service?.name || 'Service'}</Text>
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

                                                        {canEdit && (
                                                            <View style={styles.timerBanner}>
                                                                <Ionicons name="time-outline" size={14} color="#0284c7" />
                                                                <Text style={styles.timerText}>Editable for {Math.max(0, Math.ceil(60 - timeDiffInSeconds))}s</Text>
                                                            </View>
                                                        )}

                                                        <View style={styles.bookingActionRow}>
                                                            {booking.status === 'Booked' && (
                                                                <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancelBooking(booking._id)}>
                                                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                                                </TouchableOpacity>
                                                            )}
                                                            {canEdit && (
                                                                <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditBooking', { booking })}>
                                                                    <Text style={styles.editBtnText}>Edit</Text>
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    </View>
                                                );
                                            })
                                        )}
                                    </View>
                                )}
                            </View>
                        ) : null
                    }
                />
            </Animated.View>

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
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ef4444', // Vibrant Red background for header
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 16,
        fontWeight: '500'
    },
    redHeader: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 30,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        padding: 4,
        marginLeft: -8,
    },
    iconButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    welcomeText: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#0f172a',
    },
    micIcon: {
        marginLeft: 8,
    },
    pillsContainer: {
        flexDirection: 'row',
    },
    pillActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
    },
    pill: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
    },
    pillTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    pillText: {
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -20, // Overlap the red header
        paddingTop: 24,
        overflow: 'hidden',
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 16,
    },
    serviceCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    serviceImageContainer: {
        height: 160,
        width: '100%',
        backgroundColor: '#f1f5f9',
        position: 'relative',
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
    },
    favoriteBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    serviceInfo: {
        padding: 16,
    },
    serviceHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
        marginRight: 8,
    },
    servicePrice: {
        fontSize: 18,
        fontWeight: '800',
        color: '#ef4444',
    },
    serviceText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        borderRadius: 8,
        padding: 8,
        marginTop: 12,
    },
    deleteText: {
        color: '#fff',
        fontWeight: '700',
        marginLeft: 4,
    },
    bookingFormContainer: {
        backgroundColor: '#fafaf9',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    bookingFormTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 12,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },
    dateText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#0f172a',
        fontWeight: '500',
    },
    checkSlotsBtn: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#ef4444',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginBottom: 16,
    },
    checkSlotsBtnText: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 15,
    },
    slotsWrapper: {
        marginTop: 4,
    },
    slotsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    slotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    slotButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    slotButtonActive: {
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
    },
    slotText: {
        color: '#64748b',
        fontWeight: '600',
    },
    slotTextActive: {
        color: '#fff',
    },
    bookActionBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        borderRadius: 12,
        padding: 14,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bookActionBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        marginRight: 8,
    },
    noSlotsText: {
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8,
    },
    // Admin Add Service
    adminSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    addServiceToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 12,
    },
    addServiceToggleText: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 8,
    },
    addServiceForm: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputStyle: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        fontSize: 15,
        color: '#0f172a',
    },
    imagePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ef4444',
        borderStyle: 'dashed',
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
    },
    imagePickerText: {
        color: '#ef4444',
        fontWeight: '600',
        marginLeft: 8,
    },
    submitAddBtn: {
        backgroundColor: '#0f172a',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
    },
    submitAddBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    // My Bookings Dropdown
    myBookingsWrapper: {
        marginTop: 10,
        marginBottom: 30,
    },
    myBookingsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    myBookingsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    myBookingsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginLeft: 12,
    },
    badgeCount: {
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    badgeText: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 12,
    },
    myBookingsContent: {
        marginTop: 12,
    },
    bookingItem: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    bookingMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    bookingIconWrap: {
        backgroundColor: '#fee2e2',
        padding: 10,
        borderRadius: 12,
        marginRight: 12,
    },
    bookingTextWrap: {
        flex: 1,
    },
    bookingServiceName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    bookingTimeText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    bookedBadge: { backgroundColor: '#dcfce7' },
    canceledBadge: { backgroundColor: '#f1f5f9' },
    statusText: { fontSize: 12, fontWeight: '700' },
    bookedText: { color: '#16a34a' },
    canceledText: { color: '#64748b' },
    timerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f9ff',
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 12,
    },
    timerText: {
        color: '#0284c7',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    bookingActionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ef4444',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
    },
    cancelBtnText: { color: '#ef4444', fontWeight: '700' },
    editBtn: {
        flex: 1,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
    },
    editBtnText: { color: '#fff', fontWeight: '700' },
    emptyState: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    emptyStateText: {
        marginTop: 12,
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '90%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    datePickerContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    datePicker: {
        width: '100%',
        height: Platform.OS === 'ios' ? 300 : 'auto',
    }
});

export default ServiceBookingScreen;
