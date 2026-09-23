import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, FlatList, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SQLite from 'expo-sqlite';

function getApiUrl() {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = debuggerHost?.split(':')[0];
  if (host) return `http://${host}:3000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export const API_URL = getApiUrl();

const colors = {
  background: '#FAF6F1',
  surface: '#FFFFFF',
  tan: '#BF9B7A',
  brown: '#593E2E',
  olive: '#555934',
  textPrimary: '#3A2B22',
  textSecondary: '#7A6A5D',
  border: '#E4D8CB',
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', paddingHorizontal: 28 },
  titulo: { fontSize: 28, fontWeight: '700', color: colors.brown, textAlign: 'center' },
  subtitulo: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 32 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, marginBottom: 14 },
  botao: { backgroundColor: colors.olive, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  link: { color: colors.tan, textAlign: 'center', marginTop: 20, fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  saudacao: { fontSize: 22, fontWeight: '700', color: colors.brown },
  emailUsuario: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sair: { fontSize: 14, color: colors.olive, fontWeight: '600' },
  secaoTitulo: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 14 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 18, marginBottom: 14 },
  cardTitulo: { fontSize: 16, fontWeight: '600', color: colors.brown, marginBottom: 4 },
  cardDescricao: { fontSize: 13, color: colors.textSecondary },
  voltar: { fontSize: 14, color: colors.olive, fontWeight: '600' },
  adicionar: { fontSize: 14, color: colors.olive, fontWeight: '600' },
  formAgenda: { marginBottom: 20 },
  dataBox: { backgroundColor: colors.tan, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginRight: 14 },
  dataTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  cardTipo: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    try {
      setCarregando(true);
      const res = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
      const dados = await res.json();
      if (!res.ok) throw new Error();
      await AsyncStorage.setItem('usuario', JSON.stringify(dados));
      navigation.replace('Home', { usuario: dados });
    } catch (error) {
      Alert.alert('Erro ao entrar', 'E-mail ou senha inválidos.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Rotina Escolar</Text>
      <Text style={styles.subtitulo}>Entre para continuar</Text>
      <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor={colors.textSecondary} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={colors.textSecondary} secureTextEntry value={senha} onChangeText={setSenha} />
      <TouchableOpacity style={styles.botao} onPress={handleLogin} disabled={carregando}>
        <Text style={styles.botaoTexto}>{carregando ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleCadastro = async () => {
    if (!nome || !email || !senha) return Alert.alert('Atenção', 'Preencha todos os campos.');
    if (senha.length < 6) return Alert.alert('Atenção', 'A senha precisa ter pelo menos 6 caracteres.');
    try {
      setCarregando(true);
      const res = await fetch(`${API_URL}/cadastro`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, email, senha }) });
      const dados = await res.json();
      if (!res.ok) throw new Error();
      await AsyncStorage.setItem('usuario', JSON.stringify(dados));
      navigation.replace('Home', { usuario: dados });
    } catch (error) {
      Alert.alert('Erro ao cadastrar', 'Verifique os dados e tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Criar conta</Text>
      <Text style={styles.subtitulo}>Comece a organizar sua rotina escolar</Text>
      <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={colors.textSecondary} value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor={colors.textSecondary} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Senha (mín. 6 caracteres)" placeholderTextColor={colors.textSecondary} secureTextEntry value={senha} onChangeText={setSenha} />
      <TouchableOpacity style={styles.botao} onPress={handleCadastro} disabled={carregando}>
        <Text style={styles.botaoTexto}>{carregando ? 'Cadastrando...' : 'Cadastrar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const ATALHOS = [
  { titulo: 'Agenda', descricao: 'Veja suas atividades e compromissos', tela: 'Agenda' },
  { titulo: 'Horários', descricao: 'Consulte o horário das aulas', tela: null },
  { titulo: 'Notas', descricao: 'Acompanhe seu desempenho', tela: null },
  { titulo: 'Metas de estudo', descricao: 'Defina e acompanhe suas metas', tela: null },
];

function HomeScreen({ navigation, route }) {
  const [usuario, setUsuario] = useState(route.params?.usuario ?? null);

  useEffect(() => {
    if (!usuario) AsyncStorage.getItem('usuario').then((v) => v && setUsuario(JSON.parse(v)));
  }, []);

  const handleSair = async () => {
    await AsyncStorage.removeItem('usuario');
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>Olá{usuario?.email ? ',' : '!'}</Text>
          {usuario?.email ? <Text style={styles.emailUsuario}>{usuario.email}</Text> : null}
        </View>
        <TouchableOpacity onPress={handleSair}>
          <Text style={styles.sair}>Sair</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.secaoTitulo}>Sua rotina escolar</Text>
      {ATALHOS.map((item) => (
        <TouchableOpacity key={item.titulo} style={styles.card} activeOpacity={0.8} onPress={() => item.tela && navigation.navigate(item.tela)}>
          <Text style={styles.cardTitulo}>{item.titulo}</Text>
          <Text style={styles.cardDescricao}>{item.descricao}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

let localDbPromise = null;
function getLocalDb() {
  if (!localDbPromise) localDbPromise = SQLite.openDatabaseAsync('rotina_escolar.db');
  return localDbPromise;
}

async function iniciarBancoLocal() {
  const localDb = await getLocalDb();
  await localDb.execAsync(`
    CREATE TABLE IF NOT EXISTS atividades (
      id TEXT PRIMARY KEY NOT NULL,
      titulo TEXT NOT NULL,
      data TEXT NOT NULL,
      tipo TEXT NOT NULL,
      sincronizado INTEGER NOT NULL DEFAULT 0
    );
  `);
}

function AgendaScreen({ navigation }) {
  const [atividades, setAtividades] = useState([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      await iniciarBancoLocal();
      await carregarAtividadesLocais();
      await sincronizarComServidor();
      setCarregando(false);
    })();
  }, []);

  const carregarAtividadesLocais = async () => {
    const localDb = await getLocalDb();
    const linhas = await localDb.getAllAsync('SELECT * FROM atividades ORDER BY data');
    setAtividades(linhas);
  };

  const sincronizarComServidor = async () => {
    try {
      const localDb = await getLocalDb();
      const res = await fetch(`${API_URL}/agenda`);
      const itens = await res.json();
      for (const item of itens) {
        await localDb.runAsync(
          'INSERT OR REPLACE INTO atividades (id, titulo, data, tipo, sincronizado) VALUES (?, ?, ?, ?, 1)',
          [item.id, item.titulo, item.data, item.tipo]
        );
      }
      await carregarAtividadesLocais();
    } catch (erro) {}
  };

  const adicionarAtividade = async () => {
    if (!novoTitulo || !novaData) {
      Alert.alert('Atenção', 'Preencha o título e a data.');
      return;
    }
    const id = Date.now().toString();
    const novoItem = { id, titulo: novoTitulo, data: novaData, tipo: 'Tarefa' };
    const localDb = await getLocalDb();

    await localDb.runAsync(
      'INSERT INTO atividades (id, titulo, data, tipo, sincronizado) VALUES (?, ?, ?, ?, 0)',
      [id, novoItem.titulo, novoItem.data, novoItem.tipo]
    );
    await carregarAtividadesLocais();
    setNovoTitulo('');
    setNovaData('');

    try {
      await fetch(`${API_URL}/agenda`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novoItem) });
      await localDb.runAsync('UPDATE atividades SET sincronizado = 1 WHERE id = ?', [id]);
      await carregarAtividadesLocais();
    } catch (erro) {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.voltar}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Agenda</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.formAgenda}>
        <TextInput style={styles.input} placeholder="Título da atividade" placeholderTextColor={colors.textSecondary} value={novoTitulo} onChangeText={setNovoTitulo} />
        <TextInput style={styles.input} placeholder="Data (ex: 25/09)" placeholderTextColor={colors.textSecondary} value={novaData} onChangeText={setNovaData} />
        <TouchableOpacity style={styles.botao} onPress={adicionarAtividade}>
          <Text style={styles.botaoTexto}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <Text style={styles.cardDescricao}>Carregando...</Text>
      ) : (
        <FlatList
          data={atividades}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.cardDescricao}>Nenhuma atividade ainda.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.dataBox}>
                <Text style={styles.dataTexto}>{item.data}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitulo}>{item.titulo}</Text>
                <Text style={styles.cardTipo}>{item.tipo} · {item.sincronizado ? 'Sincronizado' : 'Pendente (offline)'}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function TarefasScreen({ navigation }) {
  const [tarefas, salvar] = useArmazenado('tarefas', []);
  const [titulo, setTitulo] = useState('');
  const [erro, setErro] = useState('');

  const adicionar = () => {
    if (!titulo.trim()) return setErro('Digite o título da tarefa.');
    setErro('');
    salvar([{ id: Date.now().toString(), titulo: titulo.trim(), feita: false }, ...tarefas]);
    setTitulo('');
  };
  const alternar = (id) => salvar(tarefas.map((t) => (t.id === id ? { ...t, feita: !t.feita } : t)));
  const remover = (id) => salvar(tarefas.filter((t) => t.id !== id));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Cabecalho navigation={navigation} titulo="Tarefas" />
      <TextInput style={styles.input} placeholder="Nova tarefa" placeholderTextColor={colors.textSecondary} value={titulo} onChangeText={setTitulo} />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <TouchableOpacity style={styles.botao} onPress={adicionar}>
        <Text style={styles.botaoTexto}>Adicionar</Text>
      </TouchableOpacity>
      <View style={styles.espaco} />
      {tarefas.length === 0 ? <Text style={styles.cardDescricao}>Nenhuma tarefa ainda.</Text> : null}
      {tarefas.map((t) => (
        <View key={t.id} style={[styles.card, styles.linhaEntre]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => alternar(t.id)}>
            <Text style={[styles.cardTitulo, t.feita && styles.riscado]}>{t.titulo}</Text>
            <Text style={styles.cardTipo}>{t.feita ? 'Concluída' : 'Pendente'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => remover(t.id)}>
            <Text style={styles.remover}>Excluir</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const chaveDia = (a, m, d) => `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function CalendarioScreen({ navigation }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [dia, setDia] = useState(hoje.getDate());
  const [eventos, salvar] = useArmazenado('eventos', {});
  const [titulo, setTitulo] = useState('');
  const [erro, setErro] = useState('');

  const trocarMes = (delta) => {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
    setDia(1);
  };

  const inicio = new Date(ano, mes, 1).getDay();
  const total = new Date(ano, mes + 1, 0).getDate();
  const celulas = [...Array(inicio).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const chaveSel = chaveDia(ano, mes, dia);
  const doDia = eventos[chaveSel] ?? [];

  const adicionar = () => {
    if (!titulo.trim()) return setErro('Digite o título do evento.');
    setErro('');
    salvar({ ...eventos, [chaveSel]: [...doDia, { id: Date.now().toString(), titulo: titulo.trim() }] });
    setTitulo('');
  };
  const remover = (id) => salvar({ ...eventos, [chaveSel]: doDia.filter((e) => e.id !== id) });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Cabecalho navigation={navigation} titulo="Calendário" />
      <View style={styles.linhaEntre}>
        <TouchableOpacity onPress={() => trocarMes(-1)}>
          <Text style={styles.voltar}>‹ Anterior</Text>
        </TouchableOpacity>
        <Text style={styles.secaoTitulo}>{MESES[mes]} {ano}</Text>
        <TouchableOpacity onPress={() => trocarMes(1)}>
          <Text style={styles.voltar}>Próximo ›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grade}>
        {INICIAIS.map((l, i) => <Text key={i} style={styles.diaSemana}>{l}</Text>)}
        {celulas.map((d, i) =>
          d ? (
            <TouchableOpacity key={i} style={[styles.celula, d === dia && styles.celulaAtiva]} onPress={() => setDia(d)}>
              <Text style={[styles.celulaTexto, d === dia && styles.chipTextoAtivo]}>{d}</Text>
              {eventos[chaveDia(ano, mes, d)]?.length ? <View style={styles.ponto} /> : null}
            </TouchableOpacity>
          ) : (
            <View key={i} style={styles.celula} />
          )
        )}
      </View>
      <Text style={styles.secaoTitulo}>{String(dia).padStart(2, '0')}/{String(mes + 1).padStart(2, '0')}/{ano}</Text>
      <TextInput style={styles.input} placeholder="Novo evento" placeholderTextColor={colors.textSecondary} value={titulo} onChangeText={setTitulo} />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <TouchableOpacity style={styles.botao} onPress={adicionar}>
        <Text style={styles.botaoTexto}>Adicionar</Text>
      </TouchableOpacity>
      <View style={styles.espaco} />
      {doDia.length === 0 ? <Text style={styles.cardDescricao}>Nenhum evento neste dia.</Text> : null}
      {doDia.map((e) => (
        <View key={e.id} style={[styles.card, styles.linhaEntre]}>
          <Text style={[styles.cardTitulo, { flex: 1 }]}>{e.titulo}</Text>
          <TouchableOpacity onPress={() => remover(e.id)}>
            <Text style={styles.remover}>Excluir</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function HorariosScreen({ navigation }) {
  const [aulas, salvar] = useArmazenado('horarios', {});
  const [dia, setDia] = useState('Seg');
  const [hora, setHora] = useState('');
  const [materia, setMateria] = useState('');
  const [erro, setErro] = useState('');

  const doDia = [...(aulas[dia] ?? [])].sort((a, b) => a.hora.localeCompare(b.hora));

  const adicionar = () => {
    if (!horaValida(hora)) return setErro('Use o formato HH:MM (ex: 07:30).');
    if (!materia.trim()) return setErro('Digite a disciplina.');
    setErro('');
    salvar({ ...aulas, [dia]: [...(aulas[dia] ?? []), { id: Date.now().toString(), hora, materia: materia.trim() }] });
    setHora('');
    setMateria('');
  };
  const remover = (id) => salvar({ ...aulas, [dia]: (aulas[dia] ?? []).filter((a) => a.id !== id) });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Cabecalho navigation={navigation} titulo="Horários" />
      <View style={styles.chips}>
        {SEMANA.map((s) => (
          <TouchableOpacity key={s} style={[styles.chip, s === dia && styles.chipAtivo]} onPress={() => setDia(s)}>
            <Text style={[styles.chipTexto, s === dia && styles.chipTextoAtivo]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.input} placeholder="Horário (ex: 07:30)" placeholderTextColor={colors.textSecondary} keyboardType="numbers-and-punctuation" value={hora} onChangeText={setHora} />
      <TextInput style={styles.input} placeholder="Disciplina" placeholderTextColor={colors.textSecondary} value={materia} onChangeText={setMateria} />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <TouchableOpacity style={styles.botao} onPress={adicionar}>
        <Text style={styles.botaoTexto}>Adicionar aula</Text>
      </TouchableOpacity>
      <View style={styles.espaco} />
      {doDia.length === 0 ? <Text style={styles.cardDescricao}>Nenhuma aula neste dia.</Text> : null}
      {doDia.map((a) => (
        <View key={a.id} style={[styles.card, styles.linha]}>
          <View style={styles.dataBox}>
            <Text style={styles.dataTexto}>{a.hora}</Text>
          </View>
          <Text style={[styles.cardTitulo, { flex: 1, marginBottom: 0 }]}>{a.materia}</Text>
          <TouchableOpacity onPress={() => remover(a.id)}>
            <Text style={styles.remover}>Excluir</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Agenda" component={AgendaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
