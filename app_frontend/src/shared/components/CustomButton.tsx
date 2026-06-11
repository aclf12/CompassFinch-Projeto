import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';

interface CustomButtonProps extends TouchableOpacityProps {
    title: string;
    onPress: () => void;
}

export default function CustomButton({title, onPress, ...rest}: CustomButtonProps) {

    return(
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8} {...rest}>
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        backgroundColor: '#00FF4D',
        padding: 14,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    text: {
        color: '#013310',
        fontSize: 16,
        fontWeight: 'bold',
    }
});