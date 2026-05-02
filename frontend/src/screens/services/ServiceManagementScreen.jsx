import React, { useContext, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert,
    Modal,
    TextInput,
    ScrollView,
    Switch,
    Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getServices, createService, updateService, deleteService } from '../../api/api';

const ServiceManagementScreen = ({ navigation }) => {
    const { token } = useContext(AuthContext);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        price: '',
        durationMinutes: '',
        isActive: true
    });
    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
        price: '',
        durationMinutes: '',
        isActive: true
    });

    useEffect(() => {
        loadServices();
    }, [token]);

    const loadServices = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getServices(token);
            setServices(response.data || []);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleCreateService = async () => {
        try {
            const formData = new FormData();
            formData.append('name', createForm.name);
            formData.append('description', createForm.description);
            formData.append('price', parseFloat(createForm.price));
            formData.append('durationMinutes', parseInt(createForm.durationMinutes));
            formData.append('isActive', createForm.isActive);
            
            if (selectedImage) {
                const uri = selectedImage;
                const filename = uri.split('/').pop();
                const type = 'image/jpeg';
                formData.append('image', {
                    uri,
                    name: filename,
                    type,
                });
            }

            const response = await createService(formData, token);
            setServices(prevServices => [...prevServices, response.data]);
            setCreateModalVisible(false);
            setCreateForm({
                name: '',
                description: '',
                price: '',
                durationMinutes: '',
                isActive: true
            });
            setSelectedImage(null);
            Alert.alert('Success', 'Service created successfully');
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to create service');
        }
    };

    const handleDeleteService = async (serviceId) => {
        Alert.alert(
            'Delete Service',
            'Are you sure you want to delete this service?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteService(serviceId, token);
                            setServices(prevServices => prevServices.filter(service => service._id !== serviceId));
                            Alert.alert('Success', 'Service deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', error?.response?.data?.message || 'Failed to delete service');
                        }
                    },
                },
            ]
        );
    };

    const handleEdit = (service) => {
        setSelectedService(service);
        setEditForm({
            name: service.name || '',
            description: service.description || '',
            price: service.price?.toString() || '',
            durationMinutes: service.durationMinutes?.toString() || '',
            isActive: service.isActive !== false
        });
        setEditModalVisible(true);
    };

    const handleUpdateService = async () => {
        try {
            const updatedData = {
                ...editForm,
                price: parseFloat(editForm.price),
                durationMinutes: parseInt(editForm.durationMinutes)
            };

            const response = await updateService(selectedService._id, updatedData, token);
            
            // Update the services list
            setServices(prevServices => 
                prevServices.map(service => 
                    service._id === selectedService._id ? response.data : service
                )
            );

            setEditModalVisible(false);
            Alert.alert('Success', 'Service updated successfully');
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to update service');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <View style={styles.statusContainer}>
                        <Text style={[
                            styles.status, 
                            { color: item.isActive ? '#10b981' : '#ef4444' }
                        ]}>
                            {item.isActive ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                </View>
                {item.image && (
                    <Image source={{ uri: item.image }} style={styles.serviceImage} />
                )}
            </View>
            
            <Text style={styles.description}>{item.description || 'No description'}</Text>
            
            <View style={styles.detailsRow}>
                <Text style={styles.detail}>Price: Rs. {item.price}</Text>
                <Text style={styles.detail}>Duration: {item.durationMinutes} min</Text>
            </View>
            
            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={[styles.button, styles.editButton]} 
                    onPress={() => handleEdit(item)}
                >
                    <Ionicons name="create-outline" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, styles.deleteButton]} 
                    onPress={() => handleDeleteService(item._id)}
                >
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
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
                    <Ionicons name="arrow-back" size={22} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.title}>Service Management</Text>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={() => setCreateModalVisible(true)}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Add New Service</Text>
            </TouchableOpacity>

            {error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadServices}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={services}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    ListEmptyComponent={<Text style={styles.emptyText}>No services found.</Text>}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {/* Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Service</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Service Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.name}
                                    onChangeText={(text) => setEditForm({...editForm, name: text})}
                                    placeholder="Enter service name"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={editForm.description}
                                    onChangeText={(text) => setEditForm({...editForm, description: text})}
                                    placeholder="Enter service description"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>Price (Rs.)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.price}
                                        onChangeText={(text) => setEditForm({...editForm, price: text})}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Duration (min)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.durationMinutes}
                                        onChangeText={(text) => setEditForm({...editForm, durationMinutes: text})}
                                        placeholder="60"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.switchRow}>
                                    <Text style={styles.label}>Active Status</Text>
                                    <Switch
                                        value={editForm.isActive}
                                        onValueChange={(value) => setEditForm({...editForm, isActive: value})}
                                        trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                                        thumbColor={editForm.isActive ? '#2563eb' : '#9ca3af'}
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleUpdateService}
                            >
                                <Text style={styles.saveButtonText}>Update Service</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Create Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createModalVisible}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New Service</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Service Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={createForm.name}
                                    onChangeText={(text) => setCreateForm({...createForm, name: text})}
                                    placeholder="Enter service name"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={createForm.description}
                                    onChangeText={(text) => setCreateForm({...createForm, description: text})}
                                    placeholder="Enter service description"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>Price (Rs.)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={createForm.price}
                                        onChangeText={(text) => setCreateForm({...createForm, price: text})}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Duration (min)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={createForm.durationMinutes}
                                        onChangeText={(text) => setCreateForm({...createForm, durationMinutes: text})}
                                        placeholder="60"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.switchRow}>
                                    <Text style={styles.label}>Active Status</Text>
                                    <Switch
                                        value={createForm.isActive}
                                        onValueChange={(value) => setCreateForm({...createForm, isActive: value})}
                                        trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                                        thumbColor={createForm.isActive ? '#2563eb' : '#9ca3af'}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Service Image</Text>
                                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                    {selectedImage ? (
                                        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Ionicons name="camera" size={40} color="#9ca3af" />
                                            <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setCreateModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleCreateService}
                            >
                                <Text style={styles.saveButtonText}>Create Service</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backButton: { marginRight: 10, padding: 4 },
    title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
    listContent: { paddingBottom: 20 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    serviceName: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
    statusContainer: {},
    status: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    description: { fontSize: 14, color: '#6b7280', marginBottom: 12, lineHeight: 20 },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    detail: { fontSize: 13, color: '#475569' },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    button: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flex: 1, marginHorizontal: 4 },
    editButton: { backgroundColor: '#2563eb' },
    deleteButton: { backgroundColor: '#ef4444' },
    buttonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 6, textAlign: 'center' },
    createButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#2563eb', 
        padding: 16, 
        borderRadius: 12, 
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    serviceInfo: { flex: 1 },
    serviceImage: { width: 60, height: 60, borderRadius: 8, marginLeft: 12 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#dc2626', fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryButton: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    emptyText: { textAlign: 'center', color: '#64748b', marginTop: 20 },

    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, width: '90%', maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    modalBody: { padding: 20 },
    modalFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
    inputGroup: { marginBottom: 16 },
    inputRow: { flexDirection: 'row' },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
    textArea: { height: 80, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cancelButton: { backgroundColor: '#f3f4f6', flex: 1, marginRight: 8 },
    cancelButtonText: { color: '#6b7280', fontSize: 14, fontWeight: '600', textAlign: 'center' },
    saveButton: { backgroundColor: '#2563eb', flex: 1, marginLeft: 8 },
    saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
    imagePicker: { 
        borderWidth: 1, 
        borderColor: '#d1d5db', 
        borderRadius: 8, 
        padding: 16, 
        alignItems: 'center',
        backgroundColor: '#f9fafb'
    },
    previewImage: { width: 100, height: 100, borderRadius: 8 },
    imagePlaceholder: { 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 20
    },
    imagePlaceholderText: { 
        color: '#9ca3af', 
        fontSize: 14, 
        marginTop: 8 
    }
});

export default ServiceManagementScreen;
