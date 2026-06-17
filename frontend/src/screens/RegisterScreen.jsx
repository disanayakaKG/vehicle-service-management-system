import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    KeyboardAvoidingView, 
    Platform, 
    Animated, 
    Dimensions,
    Alert,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { validateRequired } from '../utils/validation';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('customer');
    const [isLoading, setIsLoading] = useState(false);
    
    const { register } = useContext(AuthContext);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleRegister = async () => {
        if (!validateRequired(name) || !validateRequired(email) || !validateRequired(password)) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
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
        <View style={styles.container}>
            {/* Abstract Background Shapes */}
            <View style={styles.shape1} />
            <LinearGradient
                colors={['#FF2D2D', '#8B0000', 'transparent']}
                style={styles.shape2}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <View style={styles.shape3} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        
                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <View style={styles.logoContainer}>
                                <Ionicons name="person-add-outline" size={32} color="#FF2D2D" />
                            </View>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join us to get started</Text>
                        </View>

                        {/* Form Card */}
                        <View style={styles.formCard}>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your full name"
                                        placeholderTextColor="#64748b"
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#64748b"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Create a password"
                                        placeholderTextColor="#64748b"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Select Role</Text>
                                <View style={styles.roleContainer}>
                                    <TouchableOpacity 
                                        style={styles.roleButtonWrapper}
                                        onPress={() => setRole('customer')}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={role === 'customer' ? ['#FF2D2D', '#CC0000'] : ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.3)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[styles.roleButton, role !== 'customer' && styles.roleButtonInactive]}
                                        >
                                            <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Customer</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    
                                    <View style={{ width: 12 }} />

                                    <TouchableOpacity 
                                        style={styles.roleButtonWrapper}
                                        onPress={() => setRole('admin')}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={role === 'admin' ? ['#FF2D2D', '#CC0000'] : ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.3)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[styles.roleButton, role !== 'admin' && styles.roleButtonInactive]}
                                        >
                                            <Text style={[styles.roleText, role === 'admin' && styles.roleTextActive]}>Admin</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity 
                                onPress={handleRegister} 
                                disabled={isLoading}
                                activeOpacity={0.8}
                                style={{ marginTop: 10 }}
                            >
                                <LinearGradient
                                    colors={['#FF2D2D', '#CC0000']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.registerBtn}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.registerBtnText}>Register</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    shape1: {
        position: 'absolute',
        top: -height * 0.1,
        right: -width * 0.2,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: 'rgba(255, 45, 45, 0.08)',
    },
    shape2: {
        position: 'absolute',
        top: -height * 0.05,
        left: -width * 0.3,
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: width * 0.45,
        opacity: 0.3,
    },
    shape3: {
        position: 'absolute',
        top: height * 0.2,
        left: -width * 0.1,
        width: width * 0.5,
        height: width * 0.5,
        borderRadius: width * 0.25,
        backgroundColor: 'rgba(255, 45, 45, 0.05)',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    headerContainer: {
        marginBottom: 32,
    },
    logoContainer: {
        width: 56,
        height: 56,
        backgroundColor: 'rgba(255, 45, 45, 0.1)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 45, 45, 0.2)',
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#94a3b8',
    },
    formCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#cbd5e1',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 14,
        height: 56,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    roleButtonWrapper: {
        flex: 1,
    },
    roleButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleButtonInactive: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    roleText: {
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '600',
    },
    roleTextActive: {
        color: '#ffffff',
        fontWeight: '700',
    },
    registerBtn: {
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF2D2D',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    registerBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 15,
    },
    loginLink: {
        color: '#FF2D2D',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default RegisterScreen;
