import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from "react-native-chart-kit";
import api from '../services/api';

const screenWidth = Dimensions.get("window").width;

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function AnalyticsScreen({ navigation }: any) {
  // --- ESTADOS DO FILTRO DE TEMPO ---
  const dataHoje = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(dataHoje.getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(dataHoje.getFullYear());

  // --- ESTADOS DO MODAL DE DATA ---
  const [modalDataVisivel, setModalDataVisivel] = useState(false);
  const [anoTemporario, setAnoTemporario] = useState(dataHoje.getFullYear());

  // --- ESTADOS DOS DADOS DA API ---
  const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, saldo_livre: 0 });
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);

  // Função para buscar a análise do mês correto no Python
  async function carregarDadosAnalise() {
    try {
      const mesRota = mesSelecionado + 1; // Ajusta 0-11 para 1-12 do Python
      const resposta = await api.get(`/transacoes/analise/${mesRota}/${anoSelecionado}`);
      
      setResumo(resposta.data.resumo);
      setDadosGrafico(resposta.data.grafico_pizza);
    } catch (error) {
      console.error("Erro ao carregar dados do Analytics:", error);
    }
  }

  // Monitora mudanças de mês/ano e atualiza a tela automaticamente
  useEffect(() => {
    carregarDadosAnalise();
    const dispararAoVoltar = navigation.addListener('focus', () => carregarDadosAnalise());
    return dispararAoVoltar;
  }, [mesSelecionado, anoSelecionado, navigation]);

  // Controles rápidos de navegação pelas setas
  const mesAnterior = () => {
    if (mesSelecionado === 0) {
      setMesSelecionado(11);
      setAnoSelecionado(anoSelecionado - 1);
    } else {
      setMesSelecionado(mesSelecionado - 1);
    }
  };

  const mesSeguinte = () => {
    if (mesSelecionado === 11) {
      setMesSelecionado(0);
      setAnoSelecionado(anoSelecionado + 1);
    } else {
      setMesSelecionado(mesSelecionado + 1);
    }
  };

  const abrirModalData = () => {
    setAnoTemporario(anoSelecionado);
    setModalDataVisivel(true);
  };

  const selecionarMesAno = (indexMes: number) => {
    setMesSelecionado(indexMes);
    setAnoSelecionado(anoTemporario);
    setModalDataVisivel(false);
  };

  const formatarParaMoeda = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
  };

  const chartConfig = {
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
          <Ionicons name="arrow-back-outline" size={28} color="#00FF4D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Análise Mensal</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* SELETOR DE MÊS INTATIVO DA GRELHA */}
      <View style={styles.monthSelectorContainer}>
        <TouchableOpacity onPress={mesAnterior} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={24} color="#00FF4D" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={abrirModalData} style={styles.monthCenterBtn}>
          <Text style={styles.monthText}>
            {MESES[mesSelecionado]} {anoSelecionado}
          </Text>
          <Ionicons name="calendar-outline" size={16} color="#00FF4D" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={mesSeguinte} style={styles.monthArrow}>
          <Ionicons name="chevron-forward" size={24} color="#00FF4D" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* CARDS DE RESUMO FINANCEIRO */}
        <View style={styles.cardsRow}>
          <View style={[styles.miniCard, styles.borderReceita]}>
            <Text style={styles.cardLabel}>Entradas</Text>
            <Text style={[styles.cardValue, styles.textReceita]}>{formatarParaMoeda(resumo.receitas)}</Text>
          </View>
          
          <View style={[styles.miniCard, styles.borderDespesa]}>
            <Text style={styles.cardLabel}>Saídas</Text>
            <Text style={[styles.cardValue, styles.textDespesa]}>{formatarParaMoeda(resumo.despesas)}</Text>
          </View>
        </View>

        <View style={[styles.bigCard, resumo.saldo_livre >= 0 ? styles.borderReceita : styles.borderDespesa]}>
          <Text style={styles.cardLabel}>Saldo do Mês</Text>
          <Text style={[styles.bigCardValue, { color: resumo.saldo_livre >= 0 ? '#00FF4D' : '#FF3333' }]}>
            {formatarParaMoeda(resumo.saldo_livre)}
          </Text>
        </View>

        {/* GRÁFICO DE PIZZA */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Despesas por Categorias:</Text>
          
          <PieChart
            data={dadosGrafico}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute // Mostra o valor real do gasto ao lado da legenda
          />
        </View>

      </ScrollView>

      {/* MODAL GRELHA RÁPIDA DE SELEÇÃO DE DATA */}
      <Modal visible={modalDataVisivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.yearSelector}>
              <TouchableOpacity onPress={() => setAnoTemporario(anoTemporario - 1)} style={styles.yearArrow}>
                <Ionicons name="chevron-back" size={28} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.yearText}>{anoTemporario}</Text>
              <TouchableOpacity onPress={() => setAnoTemporario(anoTemporario + 1)} style={styles.yearArrow}>
                <Ionicons name="chevron-forward" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.monthGrid}>
              {MESES.map((mes, index) => {
                const ativo = mesSelecionado === index && anoSelecionado === anoTemporario;
                return (
                  <TouchableOpacity
                    key={mes}
                    style={[styles.monthGridItem, ativo && styles.monthGridItemActive]}
                    onPress={() => selecionarMesAno(index)}
                  >
                    <Text style={[styles.monthGridText, ativo && styles.monthGridTextActive]}>
                      {mes.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalDataVisivel(false)}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  
  monthSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#111', marginBottom: 20 },
  monthArrow: { padding: 5 },
  monthCenterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 8, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  monthText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 15 },
  miniCard: { flex: 1, backgroundColor: '#111', padding: 15, borderRadius: 10, borderWidth: 1 },
  bigCard: { backgroundColor: '#111', padding: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginBottom: 25 },
  cardLabel: { color: '#AAA', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  cardValue: { fontSize: 18, fontWeight: 'bold' },
  bigCardValue: { fontSize: 26, fontWeight: 'bold' },
  
  borderReceita: { borderColor: '#008A2A' },
  borderDespesa: { borderColor: '#8A0000' },
  textReceita: { color: '#00FF4D' },
  textDespesa: { color: '#FF3333' },

  chartSection: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 15, alignItems: 'center' },
  sectionTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 15, marginLeft: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', paddingHorizontal: 25 },
  modalContent: { backgroundColor: '#111', borderWidth: 1, borderColor: '#00FF4D', borderRadius: 12, padding: 25, gap: 15 },
  yearSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#050505', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: '#333' },
  yearArrow: { padding: 5 },
  yearText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  monthGridItem: { width: '30%', paddingVertical: 15, backgroundColor: '#050505', borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  monthGridItemActive: { backgroundColor: '#00FF4D', borderColor: '#00FF4D' },
  monthGridText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  monthGridTextActive: { color: '#050505' },
  closeBtn: { paddingVertical: 15, borderRadius: 8, borderWidth: 1, borderColor: '#FF3333', alignItems: 'center', marginTop: 10 },
  closeText: { color: '#FF3333', fontWeight: 'bold' }
});