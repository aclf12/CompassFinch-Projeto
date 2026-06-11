import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../shared/components/CustomInput';
import CustomButton from '../shared/components/CustomButton';
import api from '../services/api';

export default function MetasScreen({ navigation }: any) {
  const [metas, setMetas] = useState<any[]>([]);
  
  const [modalVisivel, setModalVisivel] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<any>(null);
  const [valorInput, setValorInput] = useState('');
  
  // Controle para saber se a ação é adicionar mais dinheiro ou corrigir o erro
  const [acaoModal, setAcaoModal] = useState<'separar' | 'corrigir'>('separar');

  async function carregarMetas() {
    try {
      const resposta = await api.get('/metas');
      setMetas(resposta.data);
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
    }
  }

  useEffect(() => {
    carregarMetas();
    const dispararAoVoltar = navigation.addListener('focus', () => carregarMetas());
    return dispararAoVoltar;
  }, [navigation]);

  const toggleMeta = async (id: number, concluidaAtual: boolean) => {
    try {
      await api.put(`/metas/${id}`, { concluida: !concluidaAtual });
      carregarMetas();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const excluirMeta = (id: number, titulo: string) => {
    Alert.alert(
      "Excluir Meta",
      `Tem certeza que deseja remover a meta "${titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive", 
          onPress: async () => {
            try {
              await api.delete(`/metas/${id}`);
              Alert.alert("Sucesso", "Meta removida com sucesso!");
              carregarMetas(); 
            } catch (error) {
              console.error("Erro ao deletar meta:", error);
            }
          }
        }
      ]
    );
  };

  // Prepara o Modal para a ação escolhida
  const abrirModal = (acao: 'separar' | 'corrigir', meta: any) => {
    setAcaoModal(acao);
    setMetaSelecionada(meta);
    setValorInput('');
    setModalVisivel(true);
  };

  // Roteia a ação para o endpoint correto do Python
  const confirmarAcao = async () => {
    if (!valorInput || !metaSelecionada) {
      Alert.alert("Erro", "Insira um valor válido.");
      return;
    }

    const valorLimpo = parseFloat(valorInput.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
    
    if (isNaN(valorLimpo) || (acaoModal === 'separar' && valorLimpo <= 0) || (acaoModal === 'corrigir' && valorLimpo < 0)) {
      Alert.alert("Erro", "Insira um valor válido para a operação.");
      return;
    }

    try {
      if (acaoModal === 'separar') {
        await api.put(`/metas/${metaSelecionada.id}/separar`, { valor_a_separar: valorLimpo });
        Alert.alert("Sucesso!", `Valor alocado em: ${metaSelecionada.titulo}`);
      } else {
        await api.put(`/metas/${metaSelecionada.id}/corrigir`, { novo_valor: valorLimpo });
        Alert.alert("Corrigido!", `O saldo guardado para ${metaSelecionada.titulo} foi atualizado.`);
      }
      
      setModalVisivel(false);
      carregarMetas();
    } catch (error) {
      console.error("Erro na operação:", error);
      Alert.alert("Erro", "Não foi possível concluir a operação.");
    }
  };

  const aplicarMascaraMoeda = (texto: string) => {
    let numeroLimpo = texto.replace(/\D/g, '');
    if (numeroLimpo === '') {
      setValorInput('');
      return;
    }
    const valorDecimal = (parseInt(numeroLimpo, 10) / 100).toFixed(2);
    let valorFormatado = valorDecimal.replace('.', ',');
    valorFormatado = valorFormatado.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    setValorInput(`R$ ${valorFormatado}`);
  };

  const formatarParaMoeda = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
          <Ionicons name="arrow-back-outline" size={28} color="#00FF4D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Metas</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {metas.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma meta cadastrada. Toque no botão flutuante para criar!</Text>
        ) : (
          metas.map((item) => {
            const metaConcluida = item.concluida === true;
            const valorTotal = Number(item.valor || 1);
            const valorAtual = Number(item.valor_atual || 0);
            const percentagem = Math.min(Math.round((valorAtual / valorTotal) * 100), 100);

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
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.goalTitle, metaConcluida && styles.textTratado]}>{item.titulo}</Text>
                      <Text style={styles.goalSub}>Alvo: {formatarParaMoeda(valorTotal)}</Text>
                      <Text style={styles.goalSub}>Guardado: {formatarParaMoeda(valorAtual)}</Text>
                      <Text style={styles.goalDate}>Previsão: {item.data_previsao}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity onPress={() => excluirMeta(item.id, item.titulo)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={22} color="#FF3333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View style={[
                      styles.progressFill, 
                      { width: `${percentagem}%`, backgroundColor: metaConcluida ? '#00FF4D' : '#008A2A' }
                    ]} />
                  </View>
                  <Text style={[styles.percentText, { color: metaConcluida ? '#00FF4D' : '#AAA' }]}>{percentagem}%</Text>
                </View>

                {/* BOTÕES DE AÇÃO: SEPARAR E CORRIGIR */}
                {!metaConcluida && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => abrirModal('separar', item)}>
                      <Ionicons name="cash-outline" size={16} color="#00FF4D" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnText}>Separar valor</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.separator} />
                    
                    <TouchableOpacity style={styles.actionBtn} onPress={() => abrirModal('corrigir', item)}>
                      <Ionicons name="create-outline" size={16} color="#FFB800" style={{ marginRight: 6 }} />
                      <Text style={[styles.actionBtnText, { color: '#FFB800' }]}>Corrigir</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* JANELA MODAL DINÂMICA (Serve para as duas ações) */}
      <Modal visible={modalVisivel} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {acaoModal === 'separar' ? 'Separar Dinheiro' : 'Corrigir Valor Guardado'}
            </Text>
            
            {metaSelecionada && (
              <Text style={styles.modalSubtitle}>
                {acaoModal === 'separar' 
                  ? `Destinar para: ${metaSelecionada.titulo}` 
                  : `Qual o valor exato que está guardado para: ${metaSelecionada.titulo}?`
                }
              </Text>
            )}
            
            <CustomInput 
              placeholder="R$ 0,00"
              keyboardType="numeric"
              value={valorInput}
              onChangeText={aplicarMascaraMoeda}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisivel(false)}>
                <Text style={styles.cancelModalText}>Cancelar</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <CustomButton title="Confirmar" onPress={confirmarAcao} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddMetaScreen')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#050505" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#111' },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  scrollContainer: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 100 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontStyle: 'italic', fontSize: 16 },
  goalCard: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 10, padding: 15, marginBottom: 15 },
  goalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  goalLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, paddingRight: 10 },
  checkbox: { width: 20, height: 20, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#00FF4D', marginRight: 12, marginTop: 2, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#00FF4D', borderColor: '#00FF4D' },
  goalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  textTratado: { textDecorationLine: 'line-through', color: '#666' },
  goalSub: { color: '#AAA', fontSize: 12, marginBottom: 2 },
  goalDate: { color: '#555', fontSize: 11, marginTop: 4, fontWeight: 'bold' },
  deleteBtn: { padding: 5 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 10, marginBottom: 5 },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  percentText: { fontSize: 12, fontWeight: 'bold', width: 35, textAlign: 'right' },
  fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#00FF4D', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#00FF4D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  
  // Estilos da linha de Botões (Separar / Corrigir)
  actionButtonsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#222', marginTop: 12, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10 },
  actionBtnText: { color: '#00FF4D', fontSize: 13, fontWeight: 'bold' },
  separator: { width: 1, height: 20, backgroundColor: '#333' },
  
  // Estilos da Janela Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', paddingHorizontal: 25 },
  modalContent: { backgroundColor: '#111', borderWidth: 1, borderColor: '#00FF4D', borderRadius: 12, padding: 25, gap: 15 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { color: '#AAA', fontSize: 14, marginTop: -5, marginBottom: 5 },
  modalButtonsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 },
  cancelModalBtn: { paddingVertical: 15, paddingHorizontal: 25, borderRadius: 8, borderWidth: 1, borderColor: '#FF3333' },
  cancelModalText: { color: '#FF3333', fontWeight: 'bold' }
});