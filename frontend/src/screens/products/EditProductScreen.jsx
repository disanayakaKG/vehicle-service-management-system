import React, { useState, useContext, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import { ProductContext } from '../../context/ProductContext';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { API_BASE_URL } from '../../api/api';
import { Ionicons } from '@expo/vector-icons';

const VEHICLE_TYPE_OPTIONS = ['Car', 'Van', 'Truck', 'Bus', 'Motorcycle'];
const PRODUCT_BRAND_OPTIONS = ['Toyota', 'Nissan', 'Honda', 'Mitsubishi', 'Suzuki', 'Isuzu', 'Tata', 'Ashok Leyland', 'Yamaha', 'Hero'];
const CATEGORY_OPTIONS = ['Engine Parts', 'Brake Parts', 'Electrical Parts', 'Body Parts', 'Filters', 'Tyres', 'Batteries', 'Spare Parts'];

const SelectInput = ({ label, value, onValueChange, options, placeholder }) => {
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setOpen(prev => !prev)}>
                <Text style={[styles.selectText, !value && styles.placeholderText]}>
                    {value || placeholder}
                </Text>
                <Ionicons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#6b7280"
                />
            </TouchableOpacity>
            {open && (
                <View style={styles.dropdownList}>
                    {options.map(option => (
                        <TouchableOpacity
                            key={option}
                            style={styles.dropdownOption}
                            onPress={() => {
                                onValueChange(option);
                                setOpen(false);
                            }}
                        >
                            <Text style={styles.dropdownOptionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const EditProductScreen = ({ route, navigation }) => {
    const { product } = route.params;
    const { user } = useContext(AuthContext);
    const { updateProduct, products } = useContext(ProductContext);

    useEffect(() => {
        if (user?.role !== 'admin') {
            Alert.alert('Access Denied', 'Admin only.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }
    }, [user, navigation]);

    const [form, setForm] = useState({
        productId: product.productId || '',
        name: product.name || '',
        brand: product.brand || '',
        vehicleType: product.vehicleType || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        discount: product.discount?.toString() || '',
        stocks: product.stocks?.toString() || '',
        warrantyMonths: product.warrantyMonths?.toString() || '',
        description: product.description || '',
        image: product.image || '',
    });

    const getImageUri = () => {
        if (form.image?.uri) return form.image.uri;
        if (typeof form.image === 'string' && form.image) {
            return form.image.startsWith('/uploads') ? `${API_BASE_URL}${form.image}` : form.image;
        }
        return null;
    };

    const handleSelectImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission required', 'Media library access is required to select images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && !result.cancelled) {
            const selectedAsset = result.assets?.[0] || result;
            if (selectedAsset?.uri) {
                setForm({
                    ...form,
                    image: {
                        uri: selectedAsset.uri,
                        fileName: selectedAsset.fileName,
                        mimeType: selectedAsset.mimeType,
                    },
                });
            }
        }
    };

    const handleRemoveImage = () => {
        setForm({ ...form, image: '' });
    };

    const handleUpdate = async () => {
        const { 
            productId, name, brand, vehicleType, category,
            price, discount, stocks, warrantyMonths, description 
        } = form;

        // 1. Required field validation
        if (!productId || !name || !brand || !vehicleType || !category || !price || warrantyMonths === '') {
            Alert.alert('Validation Error', 'Please fill in all required fields marked with *');
            return;
        }

        // 2. Unique Product ID validation (excluding current product)
        const realId = product._id || product.id;
        console.log("PRODUCT ID:", realId);
        const isDuplicate = products.some(p => 
            p.productId.toLowerCase() === productId.toLowerCase() && (p._id || p.id) !== realId
        );
        if (isDuplicate) {
            Alert.alert('Validation Error', 'Product ID already exists. Please use a unique ID.');
            return;
        }

        // 3. Numeric validation
        const numPrice = parseFloat(price);
        const numDiscount = discount === '' ? 0 : parseFloat(discount);
        const numStocks = stocks === '' ? 0 : parseInt(stocks);
        const numWarranty = parseInt(warrantyMonths);

        if (isNaN(numPrice) || numPrice <= 0) {
            Alert.alert('Validation Error', 'Price must be a number greater than 0');
            return;
        }

        if (discount !== '' && (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100)) {
            Alert.alert('Validation Error', 'Discount must be between 0 and 100');
            return;
        }

        if (stocks !== '' && (isNaN(numStocks) || numStocks < 0)) {
            Alert.alert('Validation Error', 'Stocks must be 0 or a positive number');
            return;
        }

        if (isNaN(numWarranty) || numWarranty < 0) {
            Alert.alert('Validation Error', 'Warranty must be 0 (for no warranty) or a positive number');
            return;
        }

        const result = await updateProduct(realId, {
            productId,
            name,
            brand,
            vehicleType,
            category,
            price: numPrice,
            discount: numDiscount,
            stocks: numStocks,
            warrantyMonths: numWarranty,
            description,
            image: form.image || ''
        });

        if (result?.success) {
            Alert.alert('Success', 'Product updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert('Error', result?.message || 'Failed to update product');
        }
    };

    if (user?.role !== 'admin') return null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Product</Text>
                
            </View>

            <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Select Product Image</Text>
                    <CustomButton
                        title={getImageUri() ? 'Change Image' : 'Select Product Image'}
                        onPress={handleSelectImage}
                    />
                    {getImageUri() ? (
                        <View style={styles.imagePreviewWrapper}>
                            <Image source={{ uri: getImageUri() }} style={styles.imagePreview} />
                            <TouchableOpacity style={styles.removeImageBtn} onPress={handleRemoveImage}>
                                <Text style={styles.removeImageText}>Remove Image</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Product ID *</Text>
                    <CustomInput 
                        placeholder="e.g. P00123" 
                        value={form.productId} 
                        onChangeText={(val) => setForm({...form, productId: val})} 
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Product Name *</Text>
                    <CustomInput 
                        placeholder="e.g. Brake Pad Set" 
                        value={form.name} 
                        onChangeText={(val) => setForm({...form, name: val})} 
                    />
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <SelectInput
                            label="Product Brand *"
                            value={form.brand}
                            placeholder="Select a brand"
                            options={PRODUCT_BRAND_OPTIONS}
                            onValueChange={(val) => setForm({ ...form, brand: val })}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}> 
                        <SelectInput
                            label="Vehicle Type *"
                            value={form.vehicleType}
                            placeholder="Select vehicle type"
                            options={VEHICLE_TYPE_OPTIONS}
                            onValueChange={(val) => setForm({ ...form, vehicleType: val })}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <SelectInput
                        label="Category *"
                        value={form.category}
                        placeholder="Select category"
                        options={CATEGORY_OPTIONS}
                        onValueChange={(val) => setForm({ ...form, category: val })}
                    />
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.inputLabel}>Price *</Text>
                        <CustomInput 
                            placeholder="e.g. 12500" 
                            value={form.price} 
                            onChangeText={(val) => setForm({...form, price: val})} 
                            keyboardType="numeric" 
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Discount (%) Optional</Text>
                        <CustomInput 
                            placeholder="e.g. 10" 
                            value={form.discount} 
                            onChangeText={(val) => setForm({...form, discount: val})} 
                            keyboardType="numeric" 
                        />
                    </View>
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.inputLabel}>Stocks</Text>
                        <CustomInput 
                            placeholder="e.g. 20" 
                            value={form.stocks} 
                            onChangeText={(val) => setForm({...form, stocks: val})} 
                            keyboardType="numeric" 
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Warranty (Months) *</Text>
                        <CustomInput 
                            placeholder="0 = No, 12 = 12 mo" 
                            value={form.warrantyMonths} 
                            onChangeText={(val) => setForm({...form, warrantyMonths: val})} 
                            keyboardType="numeric" 
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <CustomInput 
                        placeholder="Add product description..." 
                        value={form.description} 
                        onChangeText={(val) => setForm({...form, description: val})} 
                        multiline={true}
                        numberOfLines={4}
                        style={styles.textArea}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <CustomButton title="Update Product" onPress={handleUpdate} />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E8ECF5',
    },
    backBtn: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#172554',
    },
    formCard: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 22,
        padding: 22,
        borderWidth: 1,
        borderColor: '#E8ECF5',
        elevation: 3,
        shadowColor: '#172554',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
    },
    imagePreviewWrapper: {
        marginTop: 16,
        alignItems: 'center',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginTop: 12,
    },
    removeImageBtn: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#fde2e1',
    },
    removeImageText: {
        color: '#cc1f1a',
        fontWeight: '600',
    },
    imagePicker: {
        height: 180,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#eee',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: 8,
        marginLeft: 4,
    },
    selectInput: {
        borderWidth: 1,
        borderColor: '#E8ECF5',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 14,
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectText: {
        fontSize: 14,
        color: '#1f2937',
    },
    placeholderText: {
        color: '#9ca3af',
    },
    dropdownList: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E8ECF5',
        borderRadius: 16,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    dropdownOption: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dropdownOptionText: {
        fontSize: 14,
        color: '#1f2937',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        marginTop: 10,
    },
});

export default EditProductScreen;
