import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import CustomInput from '../shared/components/CustomInput';
import CustomButton from '../shared/components/CustomButton';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); // Estado para o erro

    const handleLogin = async () => {
        setErrorMessage(''); // Limpa erro anterior ao tentar novamente

        if (!email || !password) {
            setErrorMessage('Preencha os campos de e-mail e senha.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email: email,
                senha: password
            });

            await AsyncStorage.setItem('userToken', response.data.access_token);
            await AsyncStorage.setItem('userName', response.data.nome);

            navigation.replace('HomeScreen');
        } catch (error) {
            setErrorMessage('E-mail ou senha incorretos.');
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/logo_login.png')}
                    style={styles.logo}
                />
            </View>
            <View style={styles.formContainer}>
                <CustomInput
                    placeholder="E-mail"
                    value={email}
                    onChangeText={(text) => { setEmail(text); setErrorMessage(''); }} // Limpa ao digitar
                    keyboardType="email-address"
                />
                <CustomInput
                    placeholder="Senha"
                    secureTextEntry
                    value={password}
                    onChangeText={(text) => { setPassword(text); setErrorMessage(''); }} // Limpa ao digitar
                />
                
                {/* Mensagem de erro condicional */}
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </View>
            
            <View style={styles.actionContainer}>
                <CustomButton 
                    title={loading ? "Entrando..." : "Entrar"} 
                    onPress={handleLogin} 
                />

                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('RecoverPasswordScreen')}>
                    <Text style={styles.secondaryButtonText}>Esqueci minha senha</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate('CadastroScreen')}>
                    <Text style={styles.linkText}>Não tem uma conta?
                        <Text style={styles.linkTextBold}> Cadastre-se aqui</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
    logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 50 },
    logo: { width: 180, height: 95 },
    formContainer: { width: '100%', marginBottom: 20 },
    actionContainer: { width: '100%', alignItems: 'center' },
    
    // Novo estilo para o erro
    errorText: {
        color: '#FF3333',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 5,
        fontWeight: 'bold',
    },

    secondaryButton: { width: '100%', backgroundColor: '#00FF4D20', padding: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    secondaryButtonText: { color: '#00FF4D', fontSize: 16, fontWeight: 'bold' },
    linkContainer: { marginTop: 25 },
    linkText: { color: '#FFF', fontSize: 14 },
    linkTextBold: { fontWeight: 'bold' },
});