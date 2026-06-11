import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import CustomInput from '../shared/components/CustomInput';
import CustomButton from '../shared/components/CustomButton';
import { CustomButtonBack } from '../shared/components/CustomButtonBack';
import api from '../services/api';

export default function RecoverPasswordScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRecover = async () => {
        if (!email) {
            Alert.alert('Erro', 'Por favor, insira o seu e-mail.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/esqueceu-senha', { email: email });
            Alert.alert('Sucesso', 'Verifique o seu e-mail para continuar a recuperação.');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível processar o pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1, backgroundColor: '#050505' }}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <CustomButtonBack onPress={() => navigation.goBack()} />
                    </View>

                    <Text style={styles.title}>Esqueceu a senha?</Text>
                    <Text style={styles.subtitle}>Digite seu e-mail abaixo e enviaremos as instruções.</Text>

                    <View style={styles.formContainer}>
                        <CustomInput 
                            placeholder="Seu e-mail" 
                            value={email} 
                            onChangeText={setEmail} 
                            keyboardType="email-address"
                        />
                    </View>

                    <CustomButton 
                        title={loading ? "Enviando..." : "Enviar instruções"} 
                        onPress={handleRecover} 
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, backgroundColor: '#050505' },
    container: { flex: 1, padding: 30, paddingTop: 60 },
    header: { marginBottom: 40 },
    title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { color: '#AAA', fontSize: 16, marginBottom: 30 },
    formContainer: { width: '100%', marginBottom: 20 },
});