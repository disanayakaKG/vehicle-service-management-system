import React, { useContext, useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Image, 
    TextInput, Alert, ActivityIndicator, ScrollView, Platform, SafeAreaView, Modal, TouchableWithoutFeedback, Animated, Pressable
} from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile, API_BASE_URL } from '../api/api';

const resolveImageUri = (image) => {
    if (!image || typeof image !== 'string') return null;
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads')) return `${API_BASE_URL}${image}`;
    if (image.startsWith('uploads')) return `${API_BASE_URL}/${image}`;
    if (image.startsWith('file')) return image;
    return `${API_BASE_URL}/uploads/${image}`;
};

const ProfileScreen = ({ navigation }) => {
    const { user, token, logout, updateUserState } = useContext(AuthContext);
    
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);

    const onPickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow photo access to update profile picture.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.length) {
            setProfileImage(result.assets[0]);
        }
    };

    const handleUpdateProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }
        
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('name', name);
            if (phone) formData.append('phone', phone);
            
            if (profileImage?.uri) {
                const uriParts = profileImage.uri.split('/');
                const fileName = uriParts[uriParts.length - 1] || `profile-${Date.now()}.jpg`;
                const ext = fileName.split('.').pop()?.toLowerCase();
                const type = ext === 'png' ? 'image/png' : 'image/jpeg';
                formData.append('profileImage', { uri: profileImage.uri, name: fileName, type });
            }

            const response = await updateUserProfile(formData, token);
            await updateUserState(response.data);
            
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out of your account?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Log Out", 
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                    }
                }
            ]
        );
    };

    const displayImage = profileImage?.uri || resolveImageUri(user?.profileImage);

    return (
        <View style={styles.container}>
            {/* Header Background */}
            <View style={styles.headerBackground}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>{isEditing ? 'Edit Profile' : 'My Profile'}</Text>
                        <TouchableOpacity 
                            onPress={() => {
                                if (isEditing) {
                                    setIsEditing(false);
                                    setName(user?.name || '');
                                    setPhone(user?.phone || '');
                                    setProfileImage(null);
                                } else {
                                    setIsEditing(true);
                                }
                            }} 
                            style={styles.editToggleBtn}
                        >
                            <Ionicons name={isEditing ? "close" : "create-outline"} size={22} color="#ef4444" />
                        </TouchableOpacity>
                    </View>

                    {/* Avatar embedded securely within Header */}
                    <View style={styles.headerAvatarSection}>
                        <View style={styles.avatarContainer}>
                            {displayImage ? (
                                <TouchableOpacity 
                                    activeOpacity={0.8} 
                                    onPress={() => !isEditing && setIsPreviewVisible(true)}
                                >
                                    <Image source={{ uri: displayImage }} style={styles.avatarImage} />
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarInitial}>
                                        {(user?.name || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            {isEditing && (
                                <TouchableOpacity style={styles.editAvatarBtn} onPress={onPickImage}>
                                    <Ionicons name="camera" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        {!isEditing && (
                            <View style={styles.headerTextWrapper}>
                                <Text style={styles.headerUserName}>{user?.name || 'User'}</Text>
                                <View style={styles.roleBadge}>
                                    <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'CUSTOMER'}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
                style={styles.scrollArea} 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.profileCard}>
                    
                    {/* Main Content Area */}
                    {!isEditing ? (
                        <View style={styles.viewModeContainer}>
                            <View style={styles.infoSection}>
                                <View style={styles.infoRow}>
                                    <View style={styles.iconBox}>
                                        <Ionicons name="mail" size={20} color="#ef4444" />
                                    </View>
                                    <View style={styles.infoTextWrapper}>
                                        <Text style={styles.infoLabel}>Email Address</Text>
                                        <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.divider} />

                                <View style={styles.infoRow}>
                                    <View style={styles.iconBox}>
                                        <Ionicons name="call" size={20} color="#10b981" />
                                    </View>
                                    <View style={styles.infoTextWrapper}>
                                        <Text style={styles.infoLabel}>Phone Number</Text>
                                        <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
                                    </View>
                                </View>
                            </View>

                            <Pressable onPress={handleLogout} style={{ width: '100%' }}>
                                {({ pressed }) => (
                                    <Animated.View style={[styles.logoutBtn, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                                        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                                        <Text style={styles.logoutText}>Log Out</Text>
                                    </Animated.View>
                                )}
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.editModeContainer}>
                            <Text style={styles.editTitle}>Personal Information</Text>
                            
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput 
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Full Name"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View style={[styles.inputContainer, styles.inputDisabledContainer]}>
                                <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput 
                                    style={[styles.input, styles.inputDisabled]}
                                    value={user?.email || ''}
                                    editable={false}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput 
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Phone Number"
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <Pressable 
                                onPress={handleUpdateProfile}
                                disabled={loading}
                                style={{ width: '100%', marginTop: 12 }}
                            >
                                {({ pressed }) => (
                                    <Animated.View style={[styles.updateBtn, { marginTop: 0, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                                        {loading ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Text style={styles.updateBtnText}>Save Changes</Text>
                                                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                            </>
                                        )}
                                    </Animated.View>
                                )}
                            </Pressable>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Full Screen Image Preview Modal */}
            <Modal
                visible={isPreviewVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsPreviewVisible(false)}
            >
                <View style={styles.previewContainer}>
                    <TouchableOpacity 
                        style={styles.previewCloseBtn} 
                        onPress={() => setIsPreviewVisible(false)}
                    >
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    <TouchableWithoutFeedback onPress={() => setIsPreviewVisible(false)}>
                        <View style={styles.previewImageWrapper}>
                            {displayImage && (
                                <Image 
                                    source={{ uri: displayImage }} 
                                    style={styles.previewImage} 
                                    resizeMode="contain" 
                                />
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    headerBackground: {
        backgroundColor: '#111111',
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    editToggleBtn: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerAvatarSection: {
        alignItems: 'center',
        marginTop: 30,
    },
    avatarContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#fff',
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        backgroundColor: '#e0f2fe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#ef4444',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#111111', // Matches header background so it looks seamless
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTextWrapper: {
        alignItems: 'center',
        marginTop: 16,
    },
    headerUserName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 6,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 1.2,
    },
    scrollArea: {
        flex: 1,
        marginTop: -30, // Pulls the scroll view up slightly over the header curve safely
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    profileCard: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        paddingHorizontal: 24,
        paddingBottom: 30,
        paddingTop: 30, // Normal padding, no absolute avatar inside
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    viewModeContainer: {
        width: '100%',
        alignItems: 'center',
    },
    infoSection: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    infoTextWrapper: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 16,
        marginLeft: 62,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        paddingVertical: 16,
        borderRadius: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 10,
    },
    editModeContainer: {
        width: '100%',
    },
    editTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        marginBottom: 16,
        paddingHorizontal: 18,
        height: 60,
    },
    inputDisabledContainer: {
        backgroundColor: '#f1f5f9',
        borderColor: '#f1f5f9',
    },
    inputIcon: {
        marginRight: 14,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0f172a',
        fontWeight: '600',
    },
    inputDisabled: {
        color: '#94a3b8',
    },
    updateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        paddingVertical: 18,
        borderRadius: 16,
        marginTop: 12,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    updateBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 17,
        marginRight: 10,
    },
    previewContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewCloseBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    previewImageWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '70%',
    }
});

export default ProfileScreen;
