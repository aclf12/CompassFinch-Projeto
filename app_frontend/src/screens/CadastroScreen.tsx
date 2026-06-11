import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native'; 
import CustomInput from '../shared/components/CustomInput';
import CustomButton from '../shared/components/CustomButton';
import { CustomButtonBack } from '../shared/components/CustomButtonBack';
import api from '../services/api';

export default function CadastroScreen({navigation}: any) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [user, setUser] = useState(''); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Referências para navegação entre inputs
    const firstNameRef = useRef<TextInput>(null);
    const lastNameRef = useRef<TextInput>(null);
    const userRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem. Por favor, tente novamente.');
            return;
        }

        if (!firstName || !email || !password) {
            Alert.alert('Erro', 'Por favor, preencha os campos obrigatórios.');
            return;
        }

        try {
            const fullName = `${firstName} ${lastName}`.trim();
            await api.post('/auth/registrar', {
                nome: fullName,
                email: email,
                senha: password
            });

            Alert.alert('Sucesso!', 'Cadastro realizado com sucesso!');
            navigation.navigate('LoginScreen'); 
        } catch (error: any) {
            // Nova lógica de erro: captura a mensagem específica do backend
            if (error.response && error.response.status === 400) {
                // Exibe a mensagem que o backend enviou (ex: "Este e-mail já está registado.")
                Alert.alert('Atenção', error.response.data.detail || 'Erro no cadastro.');
            } else {
                console.error(error);
                Alert.alert('Erro', 'Não foi possível realizar o cadastro. Tente novamente mais tarde.');
            }
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1, backgroundColor: '#050505' }}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/cadastro.png')}
                            style={styles.cadastroLogo}
                        />
                        <CustomButtonBack onPress={() => navigation.goBack()} />
                    </View>

                    <View style={styles.formContainer}>
                        <CustomInput 
                            ref={firstNameRef}
                            placeholder="Primeiro Nome" 
                            value={firstName} 
                            onChangeText={setFirstName} 
                            returnKeyType="next"
                            onSubmitEditing={() => lastNameRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                        <CustomInput 
                            ref={lastNameRef}
                            placeholder="Último Nome" 
                            value={lastName} 
                            onChangeText={setLastName} 
                            returnKeyType="next"
                            onSubmitEditing={() => userRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                        <CustomInput 
                            ref={userRef}
                            placeholder="Nome de Usuário" 
                            value={user} 
                            onChangeText={setUser} 
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                        <CustomInput 
                            ref={emailRef}
                            placeholder="Email" 
                            value={email} 
                            onChangeText={setEmail} 
                            keyboardType="email-address"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                        <CustomInput 
                            ref={passwordRef}
                            placeholder="Senha" 
                            value={password} 
                            onChangeText={setPassword} 
                            secureTextEntry 
                            returnKeyType="next"
                            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                        <CustomInput 
                            ref={confirmPasswordRef}
                            placeholder="Confirmar Senha" 
                            value={confirmPassword} 
                            onChangeText={setConfirmPassword} 
                            secureTextEntry 
                            returnKeyType="done"
                            onSubmitEditing={handleRegister}
                        />
                    </View>

                    <CustomButton title="Cadastrar" onPress={handleRegister} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, backgroundColor: '#050505' },
    container: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 40, paddingBottom: 35 },
    header: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
    cadastroLogo: { width: 270, height: 95, resizeMode: 'contain' },
    formContainer: { width: '100%', marginBottom: 20 },
});