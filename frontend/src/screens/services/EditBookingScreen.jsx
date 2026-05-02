import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    Modal,
    Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { updateServiceBooking, getServiceAvailability } from '../../api/api';

const DEFAULT_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00'];

const EditBookingScreen = ({ route, navigation }) => {
    const { token } = useContext(AuthContext);
    const { booking } = route.params || {};
    console.log('EditBookingScreen received booking:', booking);
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00');
    const [timeLeft, setTimeLeft] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);

    // Fetch slots when date changes
    useEffect(() => {
        if (!isInitialized || !booking) return;

        const fetchSlots = async () => {
            const serviceId = booking.service?._id || booking.service;
            if (!serviceId) return;

            const dateStr = formatDate(selectedDate);
            try {
                const response = await getServiceAvailability(serviceId, dateStr, token);
                let slots = response.data.availableSlots || [];

                // Add current booking slot back if we are on the same date
                if (dateStr === booking.bookingDate && !slots.includes(booking.timeSlot)) {
                    slots.push(booking.timeSlot);
                    slots.sort(); // Sort to maintain chronological order
                }

                setAvailableSlots(slots);
                
                // If currently selected slot is not available, reset or select first
                if (slots.length > 0 && !slots.includes(selectedTimeSlot) && dateStr !== booking.bookingDate) {
                    setSelectedTimeSlot(slots[0]);
                } else if (slots.length === 0) {
                    setSelectedTimeSlot('');
                }
            } catch (error) {
                console.log('Failed to fetch available slots:', error);
            }
        };

        fetchSlots();
    }, [selectedDate, isInitialized, booking]);

    // Initialize component state and timer
    useEffect(() => {
        if (!booking) {
            setIsInitialized(true);
            return;
        }
        
        // Initialize date and time slot from booking
        setSelectedDate(new Date(booking.bookingDate || Date.now()));
        setSelectedTimeSlot(booking.timeSlot || '09:00');
        
        // Calculate time left for editing
        if (!booking.createdAt) {
            setTimeLeft(0);
            setIsInitialized(true);
            return;
        }
        
        const bookingTime = new Date(booking.createdAt);
        const currentTime = new Date();
        const elapsedSeconds = (currentTime - bookingTime) / 1000;
        
        // For now, always start with 60 seconds regardless of elapsed time
        // This ensures the full 1-minute edit window
        const remainingTime = 60;
        
        console.log('Timer Debug:', {
            bookingCreatedAt: booking.createdAt,
            bookingTime: bookingTime,
            currentTime: currentTime,
            elapsedSeconds: elapsedSeconds,
            remainingTime: remainingTime,
            note: 'Timer fixed to always start at 60 seconds'
        });
        
        setTimeLeft(remainingTime);
        setIsInitialized(true);

        if (remainingTime > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prevTime => {
                    const newTime = Math.max(0, prevTime - 1);
                    if (newTime <= 0) {
                        clearInterval(timer);
                        Alert.alert(
                            'Edit Window Expired',
                            'The 1-minute edit window has expired. You can no longer edit this booking.',
                            [
                                {
                                    text: 'OK',
                                    onPress: () => navigation.goBack()
                                }
                            ]
                        );
                    }
                    return newTime;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [booking]);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (event, selectedDate) => {
        console.log('Date picker changed:', { event, selectedDate });
        setShowDatePicker(false);
        if (event?.type === 'dismissed') {
            return;
        }
        const newDate = selectedDate || event?.nativeEvent?.timestamp;
        if (newDate) {
            // Ensure the date is valid
            const d = new Date(newDate);
            if (!isNaN(d.getTime())) {
                setSelectedDate(d);
            }
        }
    };

    const getMinimumDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    const handleUpdateBooking = async () => {
        if (timeLeft <= 0) {
            Alert.alert('Edit Window Expired', 'The 1-minute edit window has expired.');
            return;
        }

        try {
            setLoading(true);
            const bookingData = {
                bookingDate: formatDate(selectedDate),
                timeSlot: selectedTimeSlot
            };

            await updateServiceBooking(booking._id, bookingData, token);
            Alert.alert(
                'Success',
                'Booking updated successfully',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to update booking');
        } finally {
            setLoading(false);
        }
    };

    if (!booking || !isInitialized) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Booking</Text>
            </View>

            <View style={[
                styles.timerContainer,
                { borderColor: timeLeft <= 10 ? '#ef4444' : '#2563eb' }
            ]}>
                <Text style={[
                    styles.timerText,
                    { color: timeLeft <= 10 ? '#ef4444' : '#2563eb' }
                ]}>
                    Time left to edit: {Math.floor(timeLeft / 60)}:{(Math.floor(timeLeft) % 60).toString().padStart(2, '0')}
                </Text>
                {timeLeft <= 10 && (
                    <Text style={styles.warningText}>Edit window closing soon!</Text>
                )}
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Service Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Service:</Text>
                        <Text style={styles.value}>{booking.service?.name || 'Unknown Service'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Current Date:</Text>
                        <Text style={styles.value}>{booking.bookingDate}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Current Time:</Text>
                        <Text style={styles.value}>{booking.timeSlot}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Update Booking Time</Text>
                    
                    <TouchableOpacity 
                        style={styles.dateSelector}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar" size={20} color="#2563eb" />
                        <Text style={styles.dateText}>
                            Date: {formatDate(selectedDate)}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.timeSlotLabel}>Select Time Slot:</Text>
                    {availableSlots.length === 0 ? (
                        <Text style={styles.errorText}>No available slots for this date.</Text>
                    ) : (
                        <View style={styles.timeSlotGrid}>
                            {availableSlots.map((slot) => (
                                <TouchableOpacity
                                    key={slot}
                                    style={[
                                        styles.timeSlot,
                                        selectedTimeSlot === slot && styles.selectedTimeSlot
                                    ]}
                                    onPress={() => setSelectedTimeSlot(slot)}
                                >
                                    <Text style={[
                                        styles.timeSlotText,
                                        selectedTimeSlot === slot && styles.selectedTimeSlotText
                                    ]}>
                                        {slot}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.updateButton,
                        (timeLeft <= 0 || loading) && styles.disabledButton
                    ]}
                    onPress={handleUpdateBooking}
                    disabled={timeLeft <= 0 || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.updateButtonText}>
                            {timeLeft <= 0 ? 'Edit Window Expired' : 'Update Booking'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

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
                                onChange={handleDateChange}
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
}

const getTimerColor = (timeLeft) => {
    return timeLeft <= 3 ? '#ef4444' : '#2563eb';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
    },
    timerContainer: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2563eb',
    },
    timerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2563eb',
        textAlign: 'center',
    },
    warningText: {
        fontSize: 12,
        color: '#ef4444',
        textAlign: 'center',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '600',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    dateText: {
        fontSize: 16,
        color: '#0f172a',
        marginLeft: 8,
    },
    timeSlotLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 12,
    },
    timeSlotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    timeSlot: {
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 8,
        width: '48%',
        alignItems: 'center',
        marginBottom: 8,
    },
    selectedTimeSlot: {
        backgroundColor: '#2563eb',
    },
    timeSlotText: {
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '500',
    },
    selectedTimeSlotText: {
        color: '#fff',
    },
    updateButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
    },
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

export default EditBookingScreen;
