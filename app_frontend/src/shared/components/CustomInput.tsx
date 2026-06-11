import React, { forwardRef } from 'react';
import { TextInput, StyleSheet, View, TextInputProps } from 'react-native';

interface CustomInputProps extends TextInputProps {
    placeholder: string;
}

// Usamos o forwardRef para passar a referência do TextInput para o componente pai
const CustomInput = forwardRef<TextInput, CustomInputProps>(({
    placeholder,
    secureTextEntry,
    value,
    onChangeText,
    ...rest
}, ref) => {
    return (
        <View style={styles.container}>
            <TextInput
                ref={ref} // Aqui conectamos a ref ao componente nativo
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#00FF4D"
                secureTextEntry={secureTextEntry}
                value={value}
                onChangeText={onChangeText}
                {...rest}
            />
        </View>
    );
});

export default CustomInput;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#00FF4D',
        borderRadius: 8,
        padding: 14,
        color: '#00FF4D',
        backgroundColor: 'transparent',
        fontSize: 16,
    }
});