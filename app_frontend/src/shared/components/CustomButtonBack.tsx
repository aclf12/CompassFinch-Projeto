import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';

interface CustomButtonBackProps {
    onPress: () => void;
}

export const CustomButtonBack = ({ onPress, ...rest }: CustomButtonBackProps) => {
    return (
        <TouchableOpacity style={styles.backButton} onPress={onPress} {...rest}>
            <Ionicons name="arrow-back-circle-sharp" size={35} color="#00FF4D" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backButton: {
        height: 50,
        alignSelf: 'center',
        justifyContent: 'flex-end',
    },
}); 