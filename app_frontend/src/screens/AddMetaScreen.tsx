import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import CustomInput from '../shared/components/CustomInput'; 
import CustomButton from '../shared/components/CustomButton'; 
import api from '../services/api';

export default function AddMetaScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [valorGuardado, setValorGuardado] = useState('');
  
  const [dataPrevisao, setDataPrevisao] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [saldoAtual, setSaldoAtual] = useState<number>(0);

  useEffect(() => {
    async function buscarSaldo() {
      try {
        const resposta = await api.get('/transacoes/saldo');
        setSaldoAtual(resposta.data.saldo);
      } catch (error) {
        console.error("Erro ao buscar saldo para a meta:", error);
      }
    }
    buscarSaldo();
  }, []);

  const formatarParaMoeda = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
  };

  const aplicarMascaraMoeda = (texto: string) => {
    let numeroLimpo = texto.replace(/\D/g, '');
    if (numeroLimpo === '') return '';
    const valorDecimal = (parseInt(numeroLimpo, 10) / 100).toFixed(2);
    let valorFormatado = valorDecimal.replace('.', ',');
    valorFormatado = valorFormatado.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${valorFormatado}`;
  };

  const usarSaldoDoBanco = () => {
    if (saldoAtual <= 0) {
      Alert.alert("Atenção", "O seu saldo atual é zero ou negativo.");
      return;
    }
    const valorFormatado = aplicarMascaraMoeda(saldoAtual.toFixed(2).replace('.', ''));
    setValorGuardado(valorFormatado);
  };

  const aoMudarData = (evento: any, dataSelecionada?: Date) => {
    setMostrarCalendario(false); 
    if (dataSelecionada) {
      setDataPrevisao(dataSelecionada); 
    }
  };

  const formatarDataParaTela = (data: Date) => {
    return `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;
  };

  const salvarMeta = async () => {
    if (!titulo || !valorAlvo) {
      Alert.alert("Atenção", "Preencha a meta e o valor para alcançar.");
      return;
    }

    // --- NOVA FUNÇÃO DE LIMPEZA MAIS SEGURA ---
    // Remove o "R$ ", tira os pontos (milhares) e troca a vírgula por ponto (decimal)
    const limparMoeda = (valorStr: string) => {
      if (!valorStr) return 0;
      let numero = valorStr.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
      return parseFloat(numero);
    };

    const valorAlvoLimpo = limparMoeda(valorAlvo);
    const valorGuardadoLimpo = limparMoeda(valorGuardado);

    if (isNaN(valorAlvoLimpo) || valorAlvoLimpo <= 0) {
      Alert.alert("Atenção", "Por favor, insira um valor válido.");
      return;
    }

    try {
      const novaMeta = {
        titulo: titulo,
        valor: valorAlvoLimpo, 
        valor_atual: valorGuardadoLimpo, // Envia o valor inicial guardado para o Python processar
        data_previsao: formatarDataParaTela(dataPrevisao),
        concluida: valorGuardadoLimpo >= valorAlvoLimpo
      };

      await api.post('/metas', novaMeta);
      Alert.alert("Sucesso!", "Nova meta adicionada com sucesso!");
      navigation.goBack(); 

    } catch (error) {
      console.error("Erro ao salvar meta:", error);
      Alert.alert("Erro", "Não foi possível adicionar a meta.");
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
                <Text style={styles.headerTitle}>Meta/Objetivo</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={28} color="#00FF4D" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <CustomInput 
            placeholder="Digite nova Meta" 
            value={titulo}
            onChangeText={setTitulo}
          />
          
          <CustomInput 
            placeholder="Digite o valor para alcançar" 
            keyboardType="numeric" 
            value={valorAlvo}
            onChangeText={(t) => setValorAlvo(aplicarMascaraMoeda(t))}
          />
          
          <View>
            <CustomInput 
              placeholder="Valor já guardado (Opcional)" 
              keyboardType="numeric" 
              value={valorGuardado}
              onChangeText={(t) => setValorGuardado(aplicarMascaraMoeda(t))}
            />
            {saldoAtual > 0 && (
              <TouchableOpacity onPress={usarSaldoDoBanco} style={styles.atalhoSaldoBtn}>
                <Ionicons name="wallet-outline" size={14} color="#00FF4D" />
                <Text style={styles.atalhoSaldoText}>
                  Usar saldo atual ({formatarParaMoeda(saldoAtual)})
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.datePickerTrigger} 
            activeOpacity={0.8}
            onPress={() => setMostrarCalendario(true)}
          >
            <Text style={styles.datePickerText}>{formatarDataParaTela(dataPrevisao)}</Text>
            <Ionicons name="calendar-outline" size={20} color="#00FF4D" /> 
          </TouchableOpacity>

          {mostrarCalendario && (
            <DateTimePicker
              value={dataPrevisao}
              mode="date"
              display="default"
              onChange={aoMudarData}
            />
          )}
          
          <View style={{ marginTop: 20 }}>
            <CustomButton title="Adicionar Meta" onPress={salvarMeta} />
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#00FF4D', fontSize: 12, fontWeight: 'bold', marginBottom: -5 },
  form: { gap: 20 },
  atalhoSaldoBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 5, gap: 5 },
  atalhoSaldoText: { color: '#00FF4D', fontSize: 12, fontWeight: 'bold' },
  datePickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#00FF4D', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#050505' },
  datePickerText: { color: '#FFF', fontSize: 14 }
});