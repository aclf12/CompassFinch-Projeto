import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import CustomInput from '../shared/components/CustomInput'; 
import CustomButton from '../shared/components/CustomButton'; 
import api from '../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ReceitaScreen({ navigation }: any) {
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // --- ESTADOS PARA O CALENDÁRIO ---
  const [dataTransacao, setDataTransacao] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  // --- ESTADOS DA CATEGORIA (Dropdown) ---
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [menuAberto, setMenuAberto] = useState(false); 

  useEffect(() => {
    async function carregarCategorias() {
      try {
        const resposta = await api.get('/categorias');
        // Filtramos APENAS as categorias do tipo 'receita'
        const entradas = resposta.data.filter((c: any) => c.tipo === 'receita');
        setCategorias(entradas);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      }
    }
    carregarCategorias();
  }, []);

  const alternarMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMenuAberto(!menuAberto);
  };

  const aplicarMascaraMoeda = (texto: string) => {
    let numeroLimpo = texto.replace(/\D/g, '');
    if (numeroLimpo === '') {
      setValor('');
      return;
    }
    const valorDecimal = (parseInt(numeroLimpo, 10) / 100).toFixed(2);
    let valorFormatado = valorDecimal.replace('.', ',');
    valorFormatado = valorFormatado.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    setValor(`R$ ${valorFormatado}`);
  };

  const aoMudarData = (evento: any, dataSelecionada?: Date) => {
    setMostrarCalendario(false); 
    if (dataSelecionada) {
      setDataTransacao(dataSelecionada); 
    }
  };

  const formatarDataParaTela = (data: Date) => {
    return `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;
  };

  const salvarReceita = async () => {
    if (!valor || !descricao || !categoriaId) {
      Alert.alert("Atenção", "Preencha o valor, descrição e escolha uma categoria.");
      return;
    }

    const valorNumericoLimpo = valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
    const valorFloat = parseFloat(valorNumericoLimpo);

    if (isNaN(valorFloat) || valorFloat <= 0) {
      Alert.alert("Atenção", "Por favor, insira um valor válido.");
      return;
    }

    try {
      const novaReceita = {
        tipo: "receita",
        descricao: descricao,
        valor: valorFloat, 
        data: formatarDataParaTela(dataTransacao), 
        categoria_id: categoriaId
      };

      await api.post('/transacoes', novaReceita);
      
      Alert.alert("Sucesso!", "Receita registada com sucesso!");
      navigation.navigate('HomeScreen'); 

    } catch (error) {
      console.error("Erro ao salvar:", error);
      Alert.alert("Erro", "Não foi possível salvar a receita.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="wallet-outline" size={32} color="#00FF4D" style={{ marginRight: 10 }} />
            <Text style={styles.headerTitle}>Nova Receita</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={28} color="#00FF4D" />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          
          <CustomInput 
            placeholder="R$ 0,00"
            keyboardType="numeric"
            value={valor}
            onChangeText={aplicarMascaraMoeda} 
          />

          <CustomInput 
            placeholder="Descrição (Ex: Salário, Freelance)"
            value={descricao}
            onChangeText={setDescricao}
          />

          {/* BOTÃO DE CALENDÁRIO */}
          <TouchableOpacity 
            style={styles.datePickerTrigger} 
            activeOpacity={0.8}
            onPress={() => setMostrarCalendario(true)}
          >
            <Text style={styles.datePickerText}>{formatarDataParaTela(dataTransacao)}</Text>
            <Ionicons name="calendar-outline" size={20} color="#00FF4D" />
          </TouchableOpacity>

          {mostrarCalendario && (
            <DateTimePicker
              value={dataTransacao}
              mode="date" 
              display="default" 
              onChange={aoMudarData}
            />
          )}

          {/* O MENU DROP-DOWN DE CATEGORIAS DE ENTRADA */}
          <View>
            <TouchableOpacity 
              style={[styles.dropdownTrigger, menuAberto && styles.dropdownTriggerAberto]} 
              activeOpacity={0.8}
              onPress={alternarMenu}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {categoriaSelecionada ? (
                  <>
                    <Ionicons name={categoriaSelecionada.icone as any} size={20} color="#00FF4D" style={{ marginRight: 10 }} />
                    <Text style={[styles.dropdownTriggerText, { color: '#FFF' }]}>{categoriaSelecionada.titulo}</Text>
                  </>
                ) : (
                  <Text style={styles.dropdownTriggerText}>Selecione uma Categoria</Text>
                )}
              </View>
              <Ionicons name={menuAberto ? "chevron-up-outline" : "chevron-down-outline"} size={20} color="#00FF4D" />
            </TouchableOpacity>

            {menuAberto && (
              <View style={styles.dropdownContent}>
                
                {categorias.length > 0 ? (
                  <ScrollView 
                    style={{ maxHeight: 180 }} 
                    nestedScrollEnabled={true} 
                    showsVerticalScrollIndicator={true}
                  >
                    {categorias.map((cat, index) => (
                      <TouchableOpacity 
                        key={cat.id} 
                        style={[
                          styles.menuItem, 
                          index !== categorias.length - 1 && styles.menuItemBorder 
                        ]} 
                        onPress={() => {
                          setCategoriaSelecionada(cat);
                          setCategoriaId(cat.id);
                          alternarMenu(); 
                        }}
                      >
                        <Ionicons name={cat.icone as any} size={24} color="#00FF4D" />
                        <Text style={styles.menuItemText}>{cat.titulo}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Sem categorias de entrada.</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.menuAddButton}
                  onPress={() => {
                    alternarMenu();
                    navigation.navigate('AddCategoriaScreen'); // Direto para criar nova
                  }}
                >
                  <Ionicons name="add" size={24} color="#050505" />
                  <Text style={styles.menuAddButtonText}>Adicionar Categoria</Text>
                </TouchableOpacity>

              </View>
            )}
          </View>

        </View>

        <View style={styles.footer}>
          <CustomButton title="Confirmar Receita" onPress={salvarReceita} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 20, paddingBottom: 40 }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 50 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  formContainer: { gap: 20, zIndex: 10 },
  
  datePickerTrigger: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#00FF4D', 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    paddingVertical: 15,
    backgroundColor: '#050505'
  },
  datePickerText: { 
    color: '#FFF', 
    fontSize: 16 
  },

  dropdownTrigger: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#00FF4D', 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    paddingVertical: 15,
    backgroundColor: '#050505'
  },
  dropdownTriggerAberto: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dropdownTriggerText: { color: '#00FF4D', fontSize: 14 },
  
  dropdownContent: {
    borderWidth: 1,
    borderColor: '#00FF4D',
    borderTopWidth: 0, 
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#050505',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#050505',
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#00FF4D',
  },
  menuItemText: {
    color: '#00FF4D',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 14
  },
  menuAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FF4D',
    paddingVertical: 18,
    borderTopWidth: 1, 
    borderTopColor: '#003311' 
  },
  menuAddButtonText: {
    color: '#050505',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  footer: { flex: 1, justifyContent: 'flex-end', marginTop: 40 },
});