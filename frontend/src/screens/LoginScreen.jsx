import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { validateRequired } from '../utils/validation';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        // 1. Validate required fields
        if (!validateRequired(email) || !validateRequired(password)) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        // 2. Call login function
        const result = await login(email, password);
        setIsLoading(false);
        
        if (!result.success) {
            Alert.alert('Login Failed', result.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>

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

            <CustomButton title="Login" onPress={handleLogin} loading={isLoading} />

            <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
                Don't have an account? Register here
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    link: {
        marginTop: 20,
        textAlign: 'center',
        color: '#007bff',
        fontSize: 16,
    },
});

export default LoginScreen;
