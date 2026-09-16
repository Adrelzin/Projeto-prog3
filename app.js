import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export default function App() {
  const [tarefas, setTarefas] = useState([
    {
      id: 1,
      titulo: 'Fazer atividade de matemática',
      concluida: false,
    },
    {
      id: 2,
      titulo: 'Estudar para a prova de português',
      concluida: false,
    },
    {
      id: 3,
      titulo: 'Entregar trabalho de história',
      concluida: true,
    },
  ]);

  function concluirTarefa(id) {
    setTarefas(
      tarefas.map(tarefa =>
        tarefa.id === id
          ? {
              ...tarefa,
              concluida: !tarefa.concluida,
            }
          : tarefa
      )
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.titulo}>
          Minha Rotina
        </Text>

        <Text style={styles.subtitulo}>
          Organize seus estudos e atividades
        </Text>

        {/* RESUMO */}
        <View style={styles.resumo}>

          <View style={styles.resumoItem}>
            <Text style={styles.numero}>
              {tarefas.filter(t => !t.concluida).length}
            </Text>

            <Text style={styles.resumoTexto}>
              Pendentes
            </Text>
          </View>

          <View style={styles.resumoItem}>
            <Text style={styles.numero}>
              {tarefas.filter(t => t.concluida).length}
            </Text>

            <Text style={styles.resumoTexto}>
              Concluídas
            </Text>
          </View>

        </View>

        {/* TAREFAS */}
        <Text style={styles.tituloSecao}>
          Tarefas de hoje
        </Text>

        {tarefas.map(tarefa => (
          <TouchableOpacity
            key={tarefa.id}
            style={styles.tarefa}
            onPress={() => concluirTarefa(tarefa.id)}
          >

            <View
              style={[
                styles.checkbox,
                tarefa.concluida && styles.checkboxConcluido,
              ]}
            >
              {tarefa.concluida && (
                <Text style={styles.check}>
                  ✓
                </Text>
              )}
            </View>

            <Text
              style={[
                styles.tarefaTexto,
                tarefa.concluida && styles.tarefaConcluida,
              ]}
            >
              {tarefa.titulo}
            </Text>

          </TouchableOpacity>
        ))}

        {/* ACESSO RÁPIDO */}
        <Text style={styles.tituloSecao}>
          Acesso rápido
        </Text>

        <View style={styles.menu}>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.icone}>📅</Text>
            <Text style={styles.menuTexto}>
              Agenda
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.icone}>🕐</Text>
            <Text style={styles.menuTexto}>
              Horários
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.icone}>🎯</Text>
            <Text style={styles.menuTexto}>
              Metas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.icone}>📊</Text>
            <Text style={styles.menuTexto}>
              Notas
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },

  content: {
    padding: 20,
  },

  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#202124',
  },

  subtitulo: {
    marginTop: 5,
    fontSize: 15,
    color: '#777',
  },

  resumo: {
    marginTop: 25,
    padding: 20,
    backgroundColor: '#6C4AB6',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  resumoItem: {
    alignItems: 'center',
  },

  numero: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },

  resumoTexto: {
    marginTop: 4,
    color: '#E5DFFF',
  },

  tituloSecao: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#202124',
  },

  tarefa: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6C4AB6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxConcluido: {
    backgroundColor: '#6C4AB6',
  },

  check: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  tarefaTexto: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
  },

  tarefaConcluida: {
    color: '#999',
    textDecorationLine: 'line-through',
  },

  menu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  menuItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    alignItems: 'center',
  },

  icone: {
    fontSize: 28,
  },

  menuTexto: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
