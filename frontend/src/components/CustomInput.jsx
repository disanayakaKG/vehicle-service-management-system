import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const CustomInput = ({ style, ...props }) => {
    return (
        <TextInput
            style={[styles.input, style]}
            {...props}
        />
    );
};


const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginVertical: 10,
        fontSize: 16,
    },
});

export default CustomInput;
