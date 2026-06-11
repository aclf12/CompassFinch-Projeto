import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// IMPORTANTE: Ajuste o caminho abaixo para onde o seu api.ts está localizado
import api from '../services/api'; 

const mesesMock = [
  { valor: 'todos', label: 'Todos' },
  { valor: '05', label: 'Maio' },
  { valor: '06', label: 'Junho' },
];

export default function HistoricoScreen({ navigation }: any) {
  // Ajustado para o singular para bater com o banco de dados ("receita", "despesa")
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [filtroMes, setFiltroMes] = useState('06');

  // Novos States para lidar com os dados reais
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca os dados ao carregar a tela
  useEffect(() => {
    buscarHistorico();
  }, []);

  const buscarHistorico = async () => {
    try {
      setLoading(true);
      // Chama a rota que já tem o seu user_id protegido pelo Token JWT!
      const response = await api.get('/transacoes/');
      setTransacoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      Alert.alert("Ops!", "Não foi possível carregar as transações.");
    } finally {
      setLoading(false);
    }
  };

  // LÓGICA DE FILTRAGEM DUPLA
  const transacoesFiltradas = transacoes.filter(item => {
    // 1. Verifica se o tipo bate
    const bateTipo = filtroTipo === 'todos' || item.tipo === filtroTipo;
    
    // 2. Verifica se o mês bate (O banco salva como "08/06" ou "08/06/2026")
    const partesData = item.data.split('/');
    const mesDaTransacao = partesData.length > 1 ? partesData[1] : ''; 
    const bateMes = filtroMes === 'todos' || mesDaTransacao === filtroMes;

    return bateTipo && bateMes;
  });

  const renderItem = ({ item }: any) => {
    // Define a cor com base no tipo que veio do banco
    const isReceita = item.tipo === 'receita';
    const cor = isReceita ? '#00FF4D' : '#FF3333';

    // Formata o número (Ex: 450.5 vira "450,50")
    const valorFormatado = Number(item.valor).toFixed(2).replace('.', ',');

    return (
      <View style={styles.transactionCard}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconArea, { backgroundColor: isReceita ? '#001A05' : '#1A0000' }]}>
            <Ionicons 
              name={isReceita ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'} 
              size={24} 
              color={cor} 
            />
          </View>
          <View>
            <Text style={styles.descText}>{item.descricao}</Text>
            {/* Se o backend não trouxer o nome da categoria, mostramos apenas a data */}
            <Text style={styles.categoryText}>{item.data}</Text>
          </View>
        </View>
        <Text style={[styles.valueText, { color: cor }]}>
          {isReceita ? '+' : '-'} R$ {valorFormatado}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Fluxo de Caixa/</Text>
            <Text style={styles.headerTitle}>Histórico</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={28} color="#00FF4D" />
          </TouchableOpacity>
        </View>

        {/* RÉGUA DE MESES */}
        <View style={styles.monthsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {mesesMock.map((mes) => (
              <TouchableOpacity 
                key={mes.valor}
                style={[styles.monthBtn, filtroMes === mes.valor && styles.monthBtnActive]}
                onPress={() => setFiltroMes(mes.valor)}
              >
                <Text style={[styles.monthBtnText, filtroMes === mes.valor && styles.monthBtnTextActive]}>
                  {mes.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* BOTÕES DE FILTRO DE TIPO */}
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterBtn, filtroTipo === 'todos' && styles.filterBtnActive]} 
            onPress={() => setFiltroTipo('todos')}
          >
            <Text style={[styles.filterBtnText, filtroTipo === 'todos' && styles.filterBtnTextActive]}>Todos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterBtn, filtroTipo === 'receita' && styles.filterBtnActive]} 
            onPress={() => setFiltroTipo('receita')}
          >
            <Text style={[styles.filterBtnText, filtroTipo === 'receita' && styles.filterBtnTextActive]}>Receitas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterBtn, filtroTipo === 'despesa' && styles.filterBtnActive]} 
            onPress={() => setFiltroTipo('despesa')}
          >
            <Text style={[styles.filterBtnText, filtroTipo === 'despesa' && styles.filterBtnTextActive]}>Despesas</Text>
          </TouchableOpacity>
        </View>

        {/* LISTA FILTRADA COM ESTADO DE CARREGAMENTO */}
        {loading ? (
          <ActivityIndicator size="large" color="#00FF4D" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={transacoesFiltradas}
            keyExtractor={(item) => item.id.toString()} // Garante que o ID seja string
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma transação para este período.</Text>
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { color: '#00FF4D', fontSize: 14, fontWeight: 'bold', marginBottom: -5 },
  
  /* ESTILOS DA RÉGUA DE MESES */
  monthsRow: { marginBottom: 20 },
  monthBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginRight: 10, backgroundColor: '#111' },
  monthBtnActive: { borderColor: '#00FF4D', backgroundColor: '#001A05' },
  monthBtnText: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  monthBtnTextActive: { color: '#00FF4D' },

  /* FILTROS DE TIPO */
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  filterBtnActive: { backgroundColor: '#008A2A', borderColor: '#00FF4D' },
  filterBtnText: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  filterBtnTextActive: { color: '#FFF' },

  /* LISTA */
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0A0A0A', padding: 15, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#151515' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconArea: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  descText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  categoryText: { color: '#666', fontSize: 11, marginTop: 2 },
  valueText: { fontSize: 14, fontWeight: 'bold' },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 30, fontStyle: 'italic' }
});