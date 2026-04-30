import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="person-circle" size={100} color="#007bff" />
                </View>
                
                <Text style={styles.userName}>{user?.name || 'Amal'}</Text>
                <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'ADMIN'}</Text>

                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>{user?.email || 'amal@example.com'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>Role: {user?.role || 'admin'}</Text>
                    </View>
                </View>

                <View style={styles.logoutContainer}>
                    <CustomButton 
                        title="Logout" 
                        onPress={logout} 
                        style={styles.logoutBtn}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#007bff',
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 5,
    },
    profileCard: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    avatarContainer: {
        marginBottom: 20,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    userRole: {
        fontSize: 14,
        color: '#007bff',
        fontWeight: 'bold',
        marginTop: 5,
        letterSpacing: 1,
    },
    infoSection: {
        width: '100%',
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoText: {
        fontSize: 16,
        color: '#444',
        marginLeft: 15,
    },
    logoutContainer: {
        width: '100%',
        marginTop: 30,
    },
    logoutBtn: {
        backgroundColor: '#dc3545',
    }
});

export default ProfileScreen;
