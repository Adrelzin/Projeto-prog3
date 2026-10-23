import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';

export const ERRO = '#B3261E';
export const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const hojeMs = () => new Date().setHours(0, 0, 0, 0);

export const paraData = (s) => {
  const [d, m] = s.split('/').map(Number);
  return new Date(new Date().getFullYear(), (m || 1) - 1, d || 1).getTime();
};

export const dataValida = (s) => {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(s);
  return !!m && +m[1] >= 1 && +m[1] <= 31 && +m[2] >= 1 && +m[2] <= 12;
};

export const horaValida = (s) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(s);

export const toMin = (s) => {
  const [h, m] = (s || '0:0').split(':').map(Number);
  return h * 60 + m;
};

export const rotuloDias = (data) => {
  const n = Math.round((paraData(data) - hojeMs()) / 86400000);
  return n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : n > 1 ? `Em ${n} dias` : 'Já passou';
};

export function useLista(chave) {
  const [itens, setItens] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(chave).then((v) => v && setItens(JSON.parse(v)));
  }, []);

  const salvar = (novos) => {
    setItens(novos);
    AsyncStorage.setItem(chave, JSON.stringify(novos));
  };

  return [itens, salvar];
}

export function Chips({ opcoes, valor, onChange }) {
  return (
    <View style={styles.chips}>
      {opcoes.map((o) => (
        <TouchableOpacity key={o} style={[styles.chip, valor === o && styles.chipAtivo]} onPress={() => onChange(o)}>
          <Text style={[styles.chipTexto, valor === o && styles.chipTextoAtivo]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
