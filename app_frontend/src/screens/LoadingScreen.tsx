import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoadingScreen({ navigation }: any) {

  useEffect(() => {
    verificarSessao();
  }, []);

  const verificarSessao = async () => {
    try {
      // Procura o token do usuário no aparelho
      const token = await AsyncStorage.getItem('userToken');

      // Adicionamos um pequeno delay (opcional) só para a animação ficar suave
      setTimeout(() => {
        if (token) {
          // Já está logado? Vai direto pro fluxo principal (Home)
          navigation.replace('HomeScreen'); 
        } else {
          // Não tem token? Vai para a tela de Login
          navigation.replace('LoginScreen');
        }
      }, 1000); // 1 segundo de tempo de tela

    } catch (error) {
      // Se der erro ao ler a memória, manda pro Login por segurança
      navigation.replace('LoginScreen');
    }
  };

  return (
    <View style={styles.container}>
      {/* Aqui você pode colocar a sua Logo usando <Image /> no futuro */}
      <Image source={require('../../assets/logo_login.png')} style={styles.logo_size} />
      
      {/* O indicador de carregamento com a sua cor verde neon */}
      <ActivityIndicator size="large" color="#00FF4D" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505', // Mantendo a identidade visual escura
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo_size: {
    width: 200,
    height: 200,
    resizeMode: 'contain'

  }
});