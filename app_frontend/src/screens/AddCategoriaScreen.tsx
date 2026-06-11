import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import CustomInput from '../shared/components/CustomInput'; 
import CustomButton from '../shared/components/CustomButton'; 
import api from '../services/api';

// Lista de ícones disponíveis para seleção do usuário
const ICONES_DISPONIVEIS = [
  'fast-food-outline', 'bus-outline', 'cart-outline', 
  'shirt-outline', 'medkit-outline', 'game-controller-outline',
  'school-outline', 'home-outline', 'construct-outline', 'cash-outline',
  'briefcase-outline', 'gift-outline' // Adicionei uns para receita
];

export default function AddCategoriaScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState('');
  const [iconeSelecionado, setIconeSelecionado] = useState('fast-food-outline');
  
  // --- NOVO ESTADO: Controla se a categoria é Receita ou Despesa ---
  const [tipoCategoria, setTipoCategoria] = useState<'receita' | 'despesa'>('despesa');

  const salvarCategoria = async () => {
    if (!titulo.trim()) {
      Alert.alert("Atenção", "Por favor, digite o nome da categoria.");
      return;
    }

    try {
      const novaCategoria = {
        titulo: titulo,
        icone: iconeSelecionado,
        tipo: tipoCategoria // Agora mandamos o tipo para o backend!
      };

      await api.post('/categorias', novaCategoria);
      Alert.alert("Sucesso!", "Categoria mapeada com sucesso!");
      navigation.goBack(); 

    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      Alert.alert("Erro", "Não foi possível criar a categoria.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="compass-outline" size={32} color="#008A2A" style={{ marginRight: 10 }} />
            <View>
                <Text style={styles.headerSubtitle}>Adicionar nova</Text>
                <Text style={styles.headerTitle}>Categoria</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={28} color="#00FF4D" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          
          {/* --- NOVA SEÇÃO: ESCOLHA DE TIPO (TOGGLE) --- */}
          <Text style={styles.label}>Qual a natureza desta categoria?</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, tipoCategoria === 'receita' && styles.toggleBtnReceita]} 
              onPress={() => setTipoCategoria('receita')}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up-circle-outline" size={20} color={tipoCategoria === 'receita' ? '#050505' : '#00FF4D'} />
              <Text style={[styles.toggleText, tipoCategoria === 'receita' && { color: '#050505' }]}>
                Receita
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toggleBtn, tipoCategoria === 'despesa' && styles.toggleBtnDespesa]} 
              onPress={() => setTipoCategoria('despesa')}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-down-circle-outline" size={20} color={tipoCategoria === 'despesa' ? '#050505' : '#FF3333'} />
              <Text style={[styles.toggleText, tipoCategoria === 'despesa' && { color: '#050505' }]}>
                Despesa
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nome da Categoria:</Text>
          <CustomInput 
            placeholder="Ex: Alimentação, Combustível, Salário..." 
            value={titulo}
            onChangeText={setTitulo}
          />
          
          <Text style={styles.label}>Escolha um Ícone representativo:</Text>
          <View style={styles.gridIcones}>
            {ICONES_DISPONIVEIS.map((iconName) => {
              const selecionado = iconeSelecionado === iconName;
              
              // Se for receita, o botão selecionado fica verde, se for despesa, fica vermelho escuro
              const corAtiva = tipoCategoria === 'receita' ? '#00FF4D' : '#FF383C';
              
              return (
                <TouchableOpacity
                  key={iconName}
                  style={[
                    styles.iconButton, 
                    selecionado && { backgroundColor: corAtiva, borderColor: corAtiva }
                  ]}
                  onPress={() => setIconeSelecionado(iconName)}
                >
                  <Ionicons 
                    name={iconName as any} 
                    size={24} 
                    color={selecionado ? '#050505' : '#FFF'} 
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={{ marginTop: 30 }}>
            {/* O CustomButton original já é verde neon, combina perfeitamente */}
            <CustomButton title="Cadastrar Categoria" onPress={salvarCategoria} />
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 }, // Diminuí um pouco a margem para caber tudo bem
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#00FF4D', fontSize: 12, fontWeight: 'bold', marginBottom: -5 },
  form: { gap: 15 },
  label: { color: '#00FF4D', fontSize: 13, fontWeight: 'bold', marginLeft: 5, marginBottom: 2 },
  
  /* --- ESTILOS DO TOGGLE NOVO --- */
  toggleContainer: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#222', backgroundColor: '#0A0A0A' },
  toggleBtnReceita: { backgroundColor: '#00FF4D', borderColor: '#00FF4D' },
  toggleBtnDespesa: { backgroundColor: '#FF383C', borderColor: '#FF383C' },
  toggleText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  gridIcones: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 5 },
  iconButton: { width: 50, height: 50, borderRadius: 8, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }
});