import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen({ navigation }: any) {

  const [metas, setMetas] = useState<any[]>([]);
  const [categoriasEntrada, setCategoriasEntrada] = useState<any[]>([]);
  const [categoriasSaida, setCategoriasSaida] = useState<any[]>([]);
  
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null);
  const [saldo, setSaldo] = useState<number>(0);
  const [userName, setUserName] = useState('Usuário');

  // --- ESTADOS PARA O NOVO GRÁFICO ---
  const [topDespesas, setTopDespesas] = useState<any[]>([]);
  const [maiorGasto, setMaiorGasto] = useState<number>(1);

  async function carregarDadosDoBanco() {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      if (savedName) setUserName(savedName);

      const respostaCategorias = await api.get('/categorias');
      const todasCategorias = respostaCategorias.data;
      
      const entradas = todasCategorias.filter((c: any) => c.tipo === 'receita');
      const saidas = todasCategorias.filter((c: any) => c.tipo === 'despesa');

      setCategoriasEntrada(entradas);
      setCategoriasSaida(saidas);

      // --- CÁLCULO DO TOP 4 DESPESAS DO MÊS ---
      const dataHoje = new Date();
      const mesAtualStr = (dataHoje.getMonth() + 1).toString().padStart(2, '0');
      const anoAtualStr = dataHoje.getFullYear().toString();
      const sufixoMesAno = `/${mesAtualStr}/${anoAtualStr}`;

      const categoriasComTotais = saidas.map((cat: any) => {
        const historico = cat.transacoes || cat.historico || [];
        const total = historico
          .filter((t: any) => t.data && t.data.endsWith(sufixoMesAno))
          .reduce((acc: number, t: any) => acc + Number(t.valor || 0), 0);
        return { id: cat.id, titulo: cat.titulo, total };
      });

      const top4 = categoriasComTotais
        .filter((c: any) => c.total > 0)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 4);

      setTopDespesas(top4);
      setMaiorGasto(top4.length > 0 ? top4[0].total : 1);
      // ----------------------------------------

      const respostaMetas = await api.get('/metas');
      setMetas(respostaMetas.data);

      const respostaSaldo = await api.get('/transacoes/saldo');
      setSaldo(respostaSaldo.data.saldo);

    } catch (error) {
      console.error("Erro ao buscar dados do banco:", error);
    }
  }

  useEffect(() => {
    carregarDadosDoBanco();
    const dispararAoVoltar = navigation.addListener('focus', () => carregarDadosDoBanco());
    return dispararAoVoltar;
  }, [navigation]);

  const toggleMeta = async (id: number, concluidaAtual: boolean) => {
    const novoStatus = !concluidaAtual;
    try {
      await api.put(`/metas/${id}`, { concluida: novoStatus });
      carregarDadosDoBanco();
    } catch (error) {
      console.error("Erro ao atualizar status da meta:", error);
    }
  };

  const toggleCategoria = (id: string) => {
    setCategoriaExpandida(categoriaExpandida === id ? null : id);
  };

  const formatarParaMoeda = (valorNumerico: number) => {
    return `R$ ${valorNumerico.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
  };

  const renderCategoriaCard = (item: any) => {
    const isExpanded = categoriaExpandida === item.id;
    const historicoSeguro = item.transacoes || item.historico || [];

    const valorTotalCategoria = historicoSeguro.reduce((somaTotal: number, transacao: any) => {
      return somaTotal + Number(transacao.valor || 0);
    }, 0);

    return (
      <View key={item.id} style={styles.cardContainer}>
        <TouchableOpacity style={[styles.categoryItem, isExpanded && styles.categoryItemExpanded]} onPress={() => toggleCategoria(item.id)} activeOpacity={0.8}>
          <View style={styles.categoryLeft}>
            <Ionicons name={(item.icone || 'help-circle-outline') as any} size={20} color="#FFF" />
            <Text style={styles.categoryTitle}>{item.titulo}</Text>
          </View>
          <View style={styles.categoryRight}>
            <Text style={styles.categoryValue}>{formatarParaMoeda(valorTotalCategoria)}</Text>
            <Ionicons name={isExpanded ? "caret-up-outline" : "caret-down-outline"} size={16} color="#00FF4D" style={{ marginLeft: 10 }} />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.historyContainer}>
            {historicoSeguro.length > 0 ? (
              historicoSeguro.map((transacao: any) => (
                <View key={transacao.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{transacao.data}</Text>
                  <Text style={styles.historyDesc}>{transacao.descricao || transacao.desc}</Text>
                  <Text style={styles.historyValue}>R$ {transacao.valor}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.historyEmpty}>Nenhum registro nesta categoria.</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const fazerLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userName');
      navigation.replace('LoginScreen');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>

        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={require('../../assets/homescreenprof.png')} style={styles.profileAvatar} />
            <Text style={styles.welcomeText}>Bem vindo, {userName}!</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('AnalyticsScreen')}>
              <Ionicons name="bar-chart-outline" size={26} color="#00FF4D" />
            </TouchableOpacity>
            <TouchableOpacity onPress={fazerLogout}>
              <Ionicons name="log-out-outline" size={28} color="#FF3333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CARTÃO DE SALDO */}
        <TouchableOpacity style={styles.balanceSection} onPress={() => navigation.navigate('HistoricoScreen')} activeOpacity={0.9}>
          <Image source={require('../../assets/background.png')} style={styles.bgCompass} />
          <Text style={styles.balanceLabel}>Seu saldo atual (Toque para detalhar):</Text>

          <Text style={[styles.balanceValue, { color: saldo < 0 ? '#FF3333' : '#00FF4D' }]}>
            {formatarParaMoeda(saldo)}
          </Text>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.btnReceita]} onPress={() => navigation.navigate('ReceitaScreen')}>
              <Text style={styles.btnTextreceita}>Receita</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnDespesa]} onPress={() => navigation.navigate('DespesasScreen')}>
              <Text style={styles.btnTextdespesa}>Despesas</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* --- NOVO GRÁFICO CUSTOMIZADO DE BARRAS HORIZONTAIS --- */}
        <View style={{ marginTop: 25, paddingHorizontal: 20 }}>
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16, marginBottom: 20 }}>
            Maiores Despesas deste Mês:
          </Text>
          
          {topDespesas.length > 0 ? (
            topDespesas.map((item, index) => {
              // Calcula a largura da barra em %. O valor 25 garante que mesmo valores muito baixos mostrem o texto sem cortar.
              const largura = Math.max((item.total / maiorGasto) * 100, 25);
              
              return (
                <View key={index} style={styles.customBarRow}>
                  <Text style={styles.customBarLabel} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  
                  <View style={styles.customBarTrack}>
                    <View style={[styles.customBarFill, { width: `${largura}%` }]}>
                      <Text style={styles.customBarValue}>
                        {formatarParaMoeda(item.total)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={{ color: '#666', fontStyle: 'italic', marginBottom: 20 }}>
              Você ainda não teve despesas este mês. Que ótimo!
            </Text>
          )}
        </View>

        {/* SEÇÃO DE METAS */}
        <TouchableOpacity onPress={() => navigation.navigate('MetasScreen')}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Metas/{'\n'}Objetivos:</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddMetaScreen')}>
                <Text style={styles.addBtnText}>+ Metas</Text>
              </TouchableOpacity>
            </View>

            {(Array.isArray(metas) ? metas : []).slice(0, 3).map((item) => {
              const metaConcluida = item.concluida === true;

              const valorTotal = Number(item.valor || 1);
              const valorAtual = Number(item.valor_atual || 0);
              const percentagem = Math.min(Math.round((valorAtual / valorTotal) * 100), 100);
              const quantoFalta = valorTotal - valorAtual;

              return (
                <View key={item.id} style={styles.goalCard}>
                  <View style={styles.goalItem}>
                    <View style={styles.goalLeft}>
                      <TouchableOpacity
                        style={[styles.checkbox, metaConcluida && styles.checkboxChecked]}
                        onPress={() => toggleMeta(item.id, item.concluida)}
                        activeOpacity={0.7}
                      >
                        {metaConcluida && <Ionicons name="checkmark" size={14} color="#050505" />}
                      </TouchableOpacity>
                      <View>
                        <Text style={[styles.goalTitle, metaConcluida && styles.textTratado]}>{item.titulo}</Text>
                        <Text style={styles.goalSub}>Alvo: {formatarParaMoeda(valorTotal)} | Guardado: {formatarParaMoeda(valorAtual)}</Text>
                        {quantoFalta > 0 && !metaConcluida ? (
                          <Text style={styles.goalMissing}>Falta juntar: {formatarParaMoeda(quantoFalta)}</Text>
                        ) : (
                          <Text style={styles.goalSuccess}>🏆 Objetivo Alcançado!</Text>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.goalStatus, { color: metaConcluida ? '#00FF4D' : '#FF3333' }]}>
                      {percentagem}%
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[
                      styles.progressFill,
                      {
                        width: `${percentagem}%`,
                        backgroundColor: metaConcluida ? '#00FF4D' : '#008A2A'
                      }
                    ]} />
                  </View>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>

        {/* NOVA SEÇÃO: CATEGORIAS DE ENTRADA (RECEITAS) */}
        <TouchableOpacity onPress={() => navigation.navigate('CategoriasEntradaScreen')}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categorias{'\n'}(Entradas do Mês):</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddCategoriaScreen')}>
                <Text style={styles.addBtnText}>+ Categorias</Text>
              </TouchableOpacity>
            </View>

            {categoriasEntrada.length > 0 ? (
              categoriasEntrada.slice(0, 3).map(renderCategoriaCard)
            ) : (
              <Text style={{ color: '#666', fontStyle: 'italic' }}>Nenhuma categoria de receita encontrada.</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* SEÇÃO ORIGINAL: CATEGORIAS DE SAÍDA (DESPESAS) */}
        <TouchableOpacity onPress={() => navigation.navigate('CategoriasScreen')}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categorias{'\n'}(Saídas do Mês):</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddCategoriaScreen')}>
                <Text style={styles.addBtnText}>+ Categorias</Text>
              </TouchableOpacity>
            </View>

            {categoriasSaida.length > 0 ? (
              categoriasSaida.slice(0, 3).map(renderCategoriaCard)
            ) : (
              <Text style={{ color: '#666', fontStyle: 'italic' }}>Nenhuma categoria de despesa encontrada.</Text>
            )}
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  scrollContainer: { paddingHorizontal: 0, paddingTop: 20 },
  header: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', },
  profileAvatar: { width: 45, height: 45, marginRight: -10 },
  welcomeText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: '5%' },
  balanceSection: { width: '100%', backgroundColor: '#2e2e2e', position: 'relative', marginBottom: 20, marginHorizontal: 0, overflow: 'hidden', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 15 },
  bgCompass: { position: 'absolute', right: -40, top: -20, zIndex: -1, width: 432, height: 432 },
  balanceLabel: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  balanceValue: { fontSize: 36, fontWeight: 'bold', marginTop: 10, marginBottom: 30 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20 },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 40, borderRadius: 8, alignItems: 'center' },
  btnReceita: { backgroundColor: 'rgba(0,255,77,0.5)' },
  btnTextreceita: { color: '#00FF4D', fontWeight: 'bold', fontSize: 15 },
  btnDespesa: { backgroundColor: 'rgba(255,56,60,0.5)' },
  btnTextdespesa: { color: '#FF383C', fontWeight: 'bold', fontSize: 15 },
  sectionContainer: { marginBottom: 30, paddingHorizontal: 20, marginTop: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sectionTitle: { color: '#FFF', fontSize: 25, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#008A2A', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 15 },
  addBtnText: { color: '#00FF4D', fontWeight: 'bold', fontSize: 12 },

  // --- ESTILOS DO NOVO GRÁFICO CUSTOMIZADO ---
  customBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  customBarLabel: { color: '#AAA', fontSize: 12, width: 75, paddingRight: 5 }, // Largura fixa para alinhar as barras
  customBarTrack: { flex: 1, height: 32, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden' },
  customBarFill: { height: '100%', backgroundColor: '#00FF4D', justifyContent: 'center', paddingLeft: 10, borderRadius: 8 },
  customBarValue: { color: '#050505', fontWeight: 'bold', fontSize: 12 },
  // -------------------------------------------

  goalCard: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 10, padding: 15, marginBottom: 15 },
  goalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, paddingRight: 10 },
  checkbox: { width: 20, height: 20, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#00FF4D', marginRight: 12, marginTop: 2, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#00FF4D', borderColor: '#00FF4D' },
  goalTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  textTratado: { textDecorationLine: 'line-through', color: '#666' },
  goalSub: { color: '#AAA', fontSize: 11 },
  goalMissing: { color: '#FF3333', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  goalSuccess: { color: '#00FF4D', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  goalStatus: { fontSize: 14, fontWeight: 'bold' },
  progressTrack: { width: '100%', height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  cardContainer: { marginBottom: 10 },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 15, backgroundColor: '#050505', zIndex: 2 },
  categoryItemExpanded: { borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderColor: '#008A2A' },
  categoryLeft: { flexDirection: 'row', alignItems: 'center' },
  categoryRight: { flexDirection: 'row', alignItems: 'center' },
  categoryTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
  categoryValue: { color: '#00FF4D', fontSize: 14, fontWeight: 'bold' },
  historyContainer: { backgroundColor: '#111', borderWidth: 1, borderTopWidth: 0, borderColor: '#008A2A', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, padding: 15, paddingTop: 10 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#222' },
  historyDate: { color: '#888', fontSize: 10, width: 45 },
  historyDesc: { color: '#DDD', fontSize: 10, flex: 1 },
  historyValue: { color: '#FF3333', fontSize: 10, fontWeight: 'bold' },
  historyEmpty: { color: '#666', fontSize: 10, textAlign: 'center', fontStyle: 'italic', paddingVertical: 10 }
});