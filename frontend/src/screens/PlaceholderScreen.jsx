import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PlaceholderScreen = ({ route, navigation }) => {
    const { title } = route.params || { title: 'Screen' };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color="#333" />
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.content}>
                <Ionicons name="construct-outline" size={80} color="#007bff" />
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>This module is currently under development.</Text>
                <Text style={styles.info}>Stay tuned for future updates!</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
    },
    backText: {
        fontSize: 16,
        marginLeft: 5,
        color: '#333',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },
    info: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
    },
});

export default PlaceholderScreen;
