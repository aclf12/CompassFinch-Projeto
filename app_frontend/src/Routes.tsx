import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Removi o import do NavigationContainer daqui, pois ele deve ficar apenas no App.tsx

// IMPORTAÇÕES DAS TELAS
import LoadingScreen from './screens/LoadingScreen'; // <-- 1. IMPORTAMOS A TELA NOVA
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CategoriasScreen from './screens/CategoriasScreen';
import CategoriasEntradaScreen from './screens/CategoriasEntradaScreen';
import MetasScreen from './screens/MetasScreen';
import ReceitaScreen from './screens/ReceitaScreen';
import DespesasScreen from './screens/DespesasScreen';
import AddMetaScreen from './screens/AddMetaScreen';
import AddCategoriaScreen from './screens/AddCategoriaScreen';
import HistoricoScreen from './screens/HistoricoScreen'; 
import CadastroScreen from './screens/CadastroScreen'; 
import RecoverPasswordScreen from './screens/RecoverPasswordScreen'; 
import AnalyticsScreen from './screens/AnalyticsScreen';

// DEFINIÇÃO DAS TIPAGENS
export type TScreenDefinitions = {
  LoadingScreen: undefined; // <-- 2. ADICIONAMOS NA TIPAGEM
  LoginScreen: undefined;
  HomeScreen: undefined;
  CategoriasEntradaScreen: undefined;
  CategoriasScreen: undefined;
  MetasScreen: undefined;
  ReceitaScreen: undefined;
  DespesasScreen: undefined;
  AddMetaScreen: undefined;
  AddCategoriaScreen: undefined;
  HistoricoScreen: undefined; 
  CadastroScreen: undefined; 
  RecoverPasswordScreen: undefined;
  AnalyticsScreen: undefined;
};

const Stack = createNativeStackNavigator<TScreenDefinitions>();

export default function AppRoutes() {
  return (
    <Stack.Navigator 
      initialRouteName="LoadingScreen" // <-- 3. MUDAMOS O PONTO DE PARTIDA (Era LoginScreen)
      screenOptions={{
        headerShown: false, 
      }}
    >
      {/* TELA DE CARREGAMENTO INICIAL */}
      <Stack.Screen name="LoadingScreen" component={LoadingScreen} />

      {/* ROTAS DE AUTENTICAÇÃO */}
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen 
        name="CadastroScreen" 
        component={CadastroScreen}
        options={{ 
          presentation: 'modal', // Abre como modal
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="RecoverPasswordScreen" 
        component={RecoverPasswordScreen}
        options={{ 
          presentation: 'formSheet',
          sheetAllowedDetents:[0.7,0.8], // Abre como modal
          headerShown: false 
        }}
      />

      {/* ROTAS PRINCIPAIS */}
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="CategoriasEntradaScreen" component={CategoriasEntradaScreen} />
      <Stack.Screen name="CategoriasScreen" component={CategoriasScreen} />
      <Stack.Screen name="MetasScreen" component={MetasScreen} />
      <Stack.Screen name="ReceitaScreen" component={ReceitaScreen} />
      <Stack.Screen name="DespesasScreen" component={DespesasScreen} />
      <Stack.Screen name="HistoricoScreen" component={HistoricoScreen} />
      <Stack.Screen name="AnalyticsScreen" component={AnalyticsScreen} />

      {/* MODAIS */}
      <Stack.Screen 
        name="AddMetaScreen" 
        component={AddMetaScreen} 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="AddCategoriaScreen" 
        component={AddCategoriaScreen} 
        options={{ presentation: 'modal' }} 
      />

    </Stack.Navigator>
  );
}