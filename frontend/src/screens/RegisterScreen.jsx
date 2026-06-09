import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { validateRequired } from '../utils/validation';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useContext(AuthContext);

    const handleRegister = async () => {
        // 1. Validate required fields
        if (!validateRequired(name) || !validateRequired(email) || 
            !validateRequired(password)) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        // 2. Call register function
        const result = await register({
            name,
            email,
            password,
            role
        });
        setIsLoading(false);

        if (!result.success) {
            Alert.alert('Registration Failed', result.message);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create Account</Text>
            
            <CustomInput
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
            />
            <CustomInput
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
            />
            <CustomInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Text style={styles.roleLabel}>Select Role</Text>
            <View style={styles.roleContainer}>
                <TouchableOpacity 
                    style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
                    onPress={() => setRole('customer')}
                >
                    <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.roleButton, role === 'admin' && styles.roleButtonActive]}
                    onPress={() => setRole('admin')}
                >
                    <Text style={[styles.roleText, role === 'admin' && styles.roleTextActive]}>Admin</Text>
                </TouchableOpacity>
            </View>

            <CustomButton title="Register" onPress={handleRegister} loading={isLoading} />
            
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
                Already have an account? Login here
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#333',
    },
    roleLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    roleButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    roleButtonActive: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    roleText: {
        fontSize: 16,
        color: '#666',
    },
    roleTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    link: {
        marginTop: 20,
        textAlign: 'center',
        color: '#007bff',
        fontSize: 16,
    },
});

export default RegisterScreen;
