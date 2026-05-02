import React, { useContext, useEffect, useState } from 'react';
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
    Modal
} from 'react-native';
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

const ServiceBookingScreen = ({ navigation }) => {
    const { token, user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin';

    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [serviceName, setServiceName] = useState('');
    const [serviceDescription, setServiceDescription] = useState('');
    const [servicePrice, setServicePrice] = useState('');
    const [serviceImage, setServiceImage] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const getMinimumDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    const onDateChange = (event, selectedDate) => {
        console.log('Date picker changed:', { event, selectedDate });
        
        // Always close the picker first
        setShowDatePicker(false);
        
        if (event?.type === 'dismissed') {
            return;
        }

        // Handle both event types (Android and iOS)
        const newDate = selectedDate || event?.nativeEvent?.timestamp;
        
        // Set the selected date if it exists
        if (newDate) {
            const d = new Date(newDate);
            if (!isNaN(d.getTime())) {
                setSelectedDate(d);
                console.log('Date selected:', d);
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

    // Update current time every second for accurate countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const onCheckAvailability = async (serviceId) => {
        const date = formatDate(selectedDate);
        if (!date) {
            Alert.alert('Date required', 'Please select a date');
            return;
        }
        try {
            setSelectedService(serviceId);
            const response = await getServiceAvailability(serviceId, date, token);
            setSlots(response.data.availableSlots || []);
            setSelectedSlot('');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to load slots');
        }
    };

    const onBook = async () => {
        const date = formatDate(selectedDate);
        if (!selectedService || !date || !selectedSlot) {
            Alert.alert('Missing details', 'Select service, date, and a slot');
            return;
        }
        try {
            await bookService(selectedService, { date, timeSlot: selectedSlot }, token);
            Alert.alert('Booked', 'Service booked successfully', [
                {
                    text: 'OK',
                    onPress: () => {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'Home' }],
                            })
                        );
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
            Alert.alert('Permission needed', 'Please allow photo access to select service image');
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

                formData.append('image', {
                    uri: serviceImage.uri,
                    name: fileName,
                    type,
                });
            }

            await createService(formData, token);
            setServiceName('');
            setServiceDescription('');
            setServicePrice('');
            setServiceImage(null);
            loadData();
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

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.title}>Service and Booking</Text>
            </View>

            {isAdmin && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Add Service</Text>
                    <TextInput style={styles.input} placeholder="Service Name" value={serviceName} onChangeText={setServiceName} />
                    <TextInput style={styles.input} placeholder="Description" value={serviceDescription} onChangeText={setServiceDescription} />
                    <TextInput style={styles.input} placeholder="Price" keyboardType="numeric" value={servicePrice} onChangeText={setServicePrice} />
                    <TouchableOpacity style={styles.secondaryButton} onPress={onPickImage}>
                        <Text style={styles.secondaryButtonText}>{serviceImage ? 'Change Image' : 'Select Service Image'}</Text>
                    </TouchableOpacity>
                    {serviceImage?.uri ? (
                        <Image source={{ uri: serviceImage.uri }} style={styles.previewImage} />
                    ) : null}
                    <TouchableOpacity style={styles.primaryButton} onPress={onAddService}>
                        <Text style={styles.primaryButtonText}>Add Service</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={services}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={<Text style={styles.sectionTitle}>Available Services</Text>}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        {resolveImageUri(item.image) ? (
                            <Image source={{ uri: resolveImageUri(item.image) }} style={styles.serviceImage} />
                        ) : null}
                        <Text style={styles.serviceName}>{item.name}</Text>
                        <Text style={styles.serviceText}>{item.description || 'No description'}</Text>
                        <Text style={styles.serviceText}>Rs. {Number(item.price || 0).toFixed(2)}</Text>
                        {!isAdmin && (
                            <>
                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={() => {
                                        console.log('Date picker pressed for service:', item._id);
                                        setSelectedService(item._id);
                                        setShowDatePicker(true);
                                    }}
                                >
                                    <Text style={styles.dateText}>
                                        {selectedService === item._id ? formatDate(selectedDate) : 'Select Date'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.secondaryButton} onPress={() => onCheckAvailability(item._id)}>
                                    <Text style={styles.secondaryButtonText}>Check Slots</Text>
                                </TouchableOpacity>
                                <View style={styles.slotWrap}>
                                    {selectedService === item._id && slots.map((slot) => (
                                        <TouchableOpacity
                                            key={slot}
                                            style={[styles.slotButton, selectedSlot === slot && styles.slotButtonActive]}
                                            onPress={() => setSelectedSlot(slot)}
                                        >
                                            <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TouchableOpacity style={styles.primaryButton} onPress={onBook}>
                                    <Text style={styles.primaryButtonText}>Book Service</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {isAdmin && (
                            <TouchableOpacity style={styles.deleteButton} onPress={() => onDeleteService(item._id)}>
                                <Text style={styles.deleteText}>Delete Service</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
            />

            {!isAdmin && (
                <View style={styles.bookingDropdownContainer}>
                    <TouchableOpacity 
                        style={styles.dropdownBar}
                        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <View style={styles.dropdownBarLeft}>
                            <Text style={styles.dropdownTitle}>My Bookings</Text>
                            <Text style={styles.dropdownSubtitle}>
                                {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
                            </Text>
                        </View>
                        <Ionicons 
                            name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
                            size={24} 
                            color="#64748b" 
                        />
                    </TouchableOpacity>
                    
                    {isDropdownOpen && (
                        <View style={styles.dropdownContent}>
                            {bookings.length === 0 ? (
                                <View style={styles.emptyBookingContainer}>
                                    <Text style={styles.serviceText}>No bookings yet</Text>
                                </View>
                            ) : (
                                bookings.map((booking) => {
                                    // Calculate if booking is within 60-second edit window
                                    const bookingTime = new Date(booking.createdAt);
                                    const timeDiffInSeconds = (currentTime - bookingTime) / 1000;
                                    const canEdit = timeDiffInSeconds <= 60;
                                    
                                    return (
                                        <View key={booking._id} style={styles.bookingItem}>
                                            <View style={styles.bookingItemHeader}>
                                                <View style={styles.bookingItemLeft}>
                                                    <Text style={styles.serviceName}>{booking.service?.name || 'Service'}</Text>
                                                    <Text style={styles.bookingStatus}>{booking.status}</Text>
                                                    <Text style={styles.bookingDateTime}>{booking.bookingDate} at {booking.timeSlot}</Text>
                                                </View>
                                                <View style={[
                                                    styles.statusBadge,
                                                    booking.status === 'Booked' ? styles.bookedBadge : styles.canceledBadge
                                                ]}>
                                                    <Text style={[
                                                        styles.statusText,
                                                        booking.status === 'Booked' ? styles.bookedText : styles.canceledText
                                                    ]}>
                                                        {booking.status}
                                                    </Text>
                                                </View>
                                            </View>
                                            
                                            {canEdit && (
                                                <View style={styles.editTimerContainer}>
                                                    <Text style={styles.editTimerText}>
                                                        Editable for {Math.ceil(60 - timeDiffInSeconds)}s
                                                    </Text>
                                                </View>
                                            )}
                                            
                                            <View style={styles.bookingActions}>
                                                {booking.status === 'Booked' && (
                                                    <TouchableOpacity 
                                                        style={styles.deleteButton} 
                                                        onPress={() => onCancelBooking(booking._id)}
                                                    >
                                                        <Text style={styles.deleteText}>Cancel</Text>
                                                    </TouchableOpacity>
                                                )}
                                                {canEdit && (
                                                    <TouchableOpacity 
                                                        style={styles.editButton} 
                                                        onPress={() => {
                                                            console.log('Edit button pressed for booking:', booking);
                                                            navigation.navigate('EditBooking', { booking });
                                                        }}
                                                    >
                                                        <Text style={styles.editButtonText}>Edit</Text>
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
            )}
            <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
            >
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
                                positiveButton={{ label: 'OK', textColor: '#2563eb' }}
                                negativeButton={{ label: 'Cancel', textColor: '#64748b' }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eef4ff', padding: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backButton: { marginRight: 8, padding: 4 },
    title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#1e293b' },
    card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 12 },
    input: { borderWidth: 1, borderColor: '#dbeafe', borderRadius: 10, padding: 10, marginBottom: 8 },
    primaryButton: { backgroundColor: '#2563eb', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 6 },
    primaryButtonText: { color: '#fff', fontWeight: '700' },
    secondaryButton: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 4 },
    secondaryButtonText: { color: '#2563eb', fontWeight: '700' },
    deleteButton: { borderWidth: 1, borderColor: '#ef4444', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 8 },
    deleteText: { color: '#ef4444', fontWeight: '700' },
    serviceName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    serviceText: { color: '#475569', marginTop: 4 },
    slotWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
    slotButton: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 10 },
    slotButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    slotText: { color: '#334155', fontWeight: '600' },
    slotTextActive: { color: '#fff' },
    // Dropdown booking styles
    bookingDropdownContainer: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginHorizontal: 0,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dropdownBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    dropdownBarLeft: {
        flex: 1,
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    dropdownSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    dropdownContent: {
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    emptyBookingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    bookingItem: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    bookingItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    bookingItemLeft: {
        flex: 1,
    },
    bookingDateTime: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
    },
    bookedBadge: {
        backgroundColor: '#dcfce7',
    },
    canceledBadge: {
        backgroundColor: '#fee2e2',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    bookedText: {
        color: '#16a34a',
    },
    canceledText: {
        color: '#dc2626',
    },
    bookingActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    editButton: { 
        borderWidth: 1, 
        borderColor: '#2563eb', 
        borderRadius: 10, 
        padding: 10, 
        alignItems: 'center', 
        flex: 1 
    },
    editButtonText: { color: '#2563eb', fontWeight: '700' },
    editTimerContainer: { 
        marginBottom: 8,
        backgroundColor: '#f0f9ff',
        padding: 8,
        borderRadius: 8,
    },
    editTimerText: { 
        fontSize: 12, 
        color: '#2563eb', 
        fontWeight: '600',
        textAlign: 'center',
    },
    serviceImage: { width: '100%', height: 140, borderRadius: 10, marginBottom: 10, backgroundColor: '#e2e8f0' },
    previewImage: { width: '100%', height: 120, borderRadius: 10, marginTop: 8, backgroundColor: '#e2e8f0' },
    dateText: { color: '#0f172a' },
    // Modal styles for date picker
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
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
    datePicker: {
        width: '100%',
        height: Platform.OS === 'ios' ? 300 : 'auto',
    },
    datePickerContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default ServiceBookingScreen;
