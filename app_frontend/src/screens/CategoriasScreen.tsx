import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../shared/components/CustomInput';
import CustomButton from '../shared/components/CustomButton';
import api from '../services/api';

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CategoriasScreen({ navigation }: any) {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaExpandida, setCategoriaExpandida] = useState<number | null>(null);

  // --- ESTADOS DO FILTRO DE TEMPO ---
  const dataHoje = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(dataHoje.getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(dataHoje.getFullYear());

  // --- ESTADOS DO NOVO MODAL DE DATA ---
  const [modalDataVisivel, setModalDataVisivel] = useState(false);
  const [anoTemporario, setAnoTemporario] = useState(dataHoje.getFullYear());

  // --- ESTADOS DO MODAL DE EDIÇÃO DE CATEGORIA ---
  const [modalVisivel, setModalVisivel] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<any>(null);
  const [novoTitulo, setNovoTitulo] = useState('');

  async function carregarCategorias() {
    try {
      const resposta = await api.get('/categorias');
      const todasCategorias = resposta.data;
      
      // FILTRA APENAS CATEGORIAS DE SAÍDA (DESPESAS) DIRETO PELO TIPO DO BANCO
      const saidas = todasCategorias.filter((c: any) => c.tipo === 'despesa');

      setCategorias(saidas);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  }

  useEffect(() => {
    carregarCategorias();
    const dispararAoVoltar = navigation.addListener('focus', () => carregarCategorias());
    return dispararAoVoltar;
  }, [navigation]);

  // NAVEGAÇÃO RÁPIDA (Setas)
  const mesAnterior = () => {
    if (mesSelecionado === 0) {
      setMesSelecionado(11);
      setAnoSelecionado(anoSelecionado - 1);
    } else {
      setMesSelecionado(mesSelecionado - 1);
    }
    setCategoriaExpandida(null);
  };

  const mesSeguinte = () => {
    if (mesSelecionado === 11) {
      setMesSelecionado(0);
      setAnoSelecionado(anoSelecionado + 1);
    } else {
      setMesSelecionado(mesSelecionado + 1);
    }
    setCategoriaExpandida(null);
  };

  // ABRIR O MODAL DE DATAS
  const abrirModalData = () => {
    setAnoTemporario(anoSelecionado); // Inicia o modal no ano que já estava a ver
    setModalDataVisivel(true);
  };

  // ESCOLHER O MÊS DIRETO NA GRELHA
  const selecionarMesAno = (indexMes: number) => {
    setMesSelecionado(indexMes);
    setAnoSelecionado(anoTemporario);
    setModalDataVisivel(false);
    setCategoriaExpandida(null); // Fecha as abas para não confundir os dados
  };

  const toggleExpandir = (id: number) => {
    setCategoriaExpandida(categoriaExpandida === id ? null : id);
  };

  const abrirEdicao = (categoria: any) => {
    setCategoriaSelecionada(categoria);
    setNovoTitulo(categoria.titulo);
    setModalVisivel(true);
  };

  const salvarEdicao = async () => {
    if (!novoTitulo.trim()) {
      Alert.alert("Erro", "O nome da categoria não pode estar vazio.");
      return;
    }
    try {
      await api.put(`/categorias/${categoriaSelecionada.id}`, { titulo: novoTitulo });
      setModalVisivel(false);
      Alert.alert("Sucesso", "Categoria atualizada!");
      carregarCategorias();
    } catch (error) {
      console.error("Erro ao editar:", error);
      Alert.alert("Erro", "Não foi possível salvar.");
    }
  };

  const excluirCategoria = (id: number, titulo: string) => {
    Alert.alert(
      "Remover Categoria",
      `Deseja mesmo excluir "${titulo}"? As transações ficarão sem categoria.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/categorias/${id}`);
              Alert.alert("Sucesso", "Categoria removida.");
              carregarCategorias();
            } catch (error) {
              console.error("Erro ao apagar:", error);
            }
          }
        }
      ]
    );
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
        <Text style={styles.headerTitle}>Categorias de Saída</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* --- SELETOR DE MÊS INTERATIVO --- */}
      <View style={styles.monthSelectorContainer}>
        <TouchableOpacity onPress={mesAnterior} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={24} color="#00FF4D" />
        </TouchableOpacity>
        
        {/* O texto agora é um botão que abre a grelha */}
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
        {categorias.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma categoria mapeada. Toque no "+" para adicionar.</Text>
        ) : (
          categorias.map((item) => {
            const isExpanded = categoriaExpandida === item.id;
            const todoHistorico = item.transacoes || item.historico || [];

            const mesStr = (mesSelecionado + 1).toString().padStart(2, '0');
            const sufixoFiltro = `/${mesStr}/${anoSelecionado}`;

            const historicoFiltrado = todoHistorico.filter((t: any) => 
              t.data && t.data.endsWith(sufixoFiltro)
            );

            const totalGastoNoMes = historicoFiltrado.reduce((acc: number, t: any) => acc + Number(t.valor || 0), 0);

            return (
              <View key={item.id} style={styles.cardContainer}>
                <TouchableOpacity
                  style={[styles.categoryItem, isExpanded && styles.categoryItemExpanded]}
                  onPress={() => toggleExpandir(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.categoryLeft}>
                    <Ionicons name={item.icone || 'help-circle-outline'} size={22} color="#FFF" />
                    <Text style={styles.categoryTitle}>{item.titulo}</Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryValue}>{formatarParaMoeda(totalGastoNoMes)}</Text>
                    <Ionicons name={isExpanded ? "caret-up-outline" : "caret-down-outline"} size={16} color="#00FF4D" style={{ marginLeft: 10 }} />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.actionRowContainer}>
                    <View style={styles.historyBox}>
                      {historicoFiltrado.length > 0 ? (
                        historicoFiltrado.map((transacao: any) => (
                          <View key={transacao.id} style={styles.historyRow}>
                            <Text style={styles.historyDate}>{transacao.data}</Text>
                            <Text style={styles.historyDesc}>{transacao.descricao}</Text>
                            <Text style={styles.historyValue}>R$ {transacao.valor}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.historyEmpty}>Sem registros nesta categoria este mês.</Text>
                      )}
                    </View>

                    <View style={styles.managementButtons}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => abrirEdicao(item)}>
                        <Ionicons name="create-outline" size={16} color="#FFB800" />
                        <Text style={styles.editText}>Editar Nome</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => excluirCategoria(item.id, item.titulo)}>
                        <Ionicons name="trash-outline" size={16} color="#FF3333" />
                        <Text style={styles.deleteText}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* --- MODAL DA GRELHA DE DATAS --- */}
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

            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={() => setModalDataVisivel(false)}>
              <Text style={styles.cancelText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE EDIÇÃO DE CATEGORIA */}
      <Modal visible={modalVisivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Categoria</Text>
            <CustomInput
              placeholder="Novo nome da categoria"
              value={novoTitulo}
              onChangeText={setNovoTitulo}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisivel(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <CustomButton title="Salvar" onPress={salvarEdicao} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddCategoriaScreen')} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color="#050505" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  
  monthSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#111', marginBottom: 10 },
  monthArrow: { padding: 5 },
  monthCenterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 8, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  monthText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  scrollContainer: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 100 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontStyle: 'italic', fontSize: 16 },
  cardContainer: { marginBottom: 12 },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 15, backgroundColor: '#0A0A0A' },
  categoryItemExpanded: { borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderColor: '#008A2A' },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  categoryRight: { flexDirection: 'row', alignItems: 'center' },
  categoryValue: { color: '#00FF4D', fontSize: 15, fontWeight: 'bold' },
  actionRowContainer: { backgroundColor: '#111', borderWidth: 1, borderTopWidth: 0, borderColor: '#008A2A', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, padding: 15 },
  historyBox: { marginBottom: 15 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#222' },
  historyDate: { color: '#888', fontSize: 11, width: 70 },
  historyDesc: { color: '#DDD', fontSize: 11, flex: 1 },
  historyValue: { color: '#FF3333', fontSize: 11, fontWeight: 'bold' },
  historyEmpty: { color: '#666', fontSize: 11, textAlign: 'center', fontStyle: 'italic', paddingVertical: 5 },
  managementButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editText: { color: '#FFB800', fontSize: 12, fontWeight: 'bold' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deleteText: { color: '#FF3333', fontSize: 12, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#00FF4D', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', paddingHorizontal: 25 },
  modalContent: { backgroundColor: '#111', borderWidth: 1, borderColor: '#00FF4D', borderRadius: 12, padding: 25, gap: 15 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  modalButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { paddingVertical: 15, paddingHorizontal: 25, borderRadius: 8, borderWidth: 1, borderColor: '#FF3333', alignItems: 'center' },
  cancelText: { color: '#FF3333', fontWeight: 'bold' },

  // Estilos da Grelha de Meses (Novo Modal)
  yearSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#050505', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: '#333' },
  yearArrow: { padding: 5 },
  yearText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  monthGridItem: { width: '30%', paddingVertical: 15, backgroundColor: '#050505', borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  monthGridItemActive: { backgroundColor: '#00FF4D', borderColor: '#00FF4D' },
  monthGridText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  monthGridTextActive: { color: '#050505' }
});