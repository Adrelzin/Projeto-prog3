import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, FlatList, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from './styles';

function getApiUrl() {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = debuggerHost?.split(':')[0];
  if (host) return `http://${host}:3000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export const API_URL = getApiUrl();

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
      navigation.replace('Main', { screen: 'Home', params: { usuario: dados } });
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

      <TouchableOpacity style={[styles.botao, { backgroundColor: colors.tan, marginTop: 10 }]} onPress={() => navigation.navigate('Main')}>
        <Text style={styles.botaoTexto}>Entrar sem login (Modo Demo)</Text>
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
      navigation.replace('Main', { screen: 'Home', params: { usuario: dados } });
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

      <TouchableOpacity style={[styles.botao, { backgroundColor: colors.tan, marginTop: 10 }]} onPress={() => navigation.navigate('Main')}>
        <Text style={styles.botaoTexto}>Entrar sem cadastro (Modo Demo)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

function HomeScreen({ navigation, route }) {
  const [usuario, setUsuario] = useState(route.params?.usuario ?? null);

  useEffect(() => {
    if (!usuario) AsyncStorage.getItem('usuario').then((v) => v && setUsuario(JSON.parse(v)));
  }, []);

  const handleSair = async () => {
    await AsyncStorage.removeItem('usuario');
    navigation.getParent().replace('Login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>Olá{usuario?.email ? `, ${usuario.email}` : '!'}</Text>
          <Text style={styles.emailUsuario}>Modo de Navegação Livre</Text>
        </View>
        <TouchableOpacity onPress={handleSair}>
          <Text style={styles.sair}>Sair</Text>
        </TouchableOpacity>
      </View>

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

function CalendarioScreen() {
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
        <Text style={styles.titulo}>Calendário</Text>
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

function useLista(chave) {
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

function TarefaScreen() {
  const [tarefas, salvar] = useLista('tarefas');
  const [titulo, setTitulo] = useState('');
  const [prazo, setPrazo] = useState('');
  const [erro, setErro] = useState('');

  const adicionar = () => {
    if (!titulo || !prazo) return setErro('Preencha o título e o prazo.');
    setErro('');
    salvar([...tarefas, { id: Date.now().toString(), titulo, prazo, feita: false }]);
    setTitulo('');
    setPrazo('');
  };

  const alternar = (id) => salvar(tarefas.map((t) => (t.id === id ? { ...t, feita: !t.feita } : t)));
  const remover = (id) => salvar(tarefas.filter((t) => t.id !== id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Tarefas</Text>
      </View>

      <View style={styles.formAgenda}>
        <TextInput style={styles.input} placeholder="Título da tarefa" placeholderTextColor={colors.textSecondary} value={titulo} onChangeText={setTitulo} />
        <TextInput style={styles.input} placeholder="Prazo (ex: 15/10)" placeholderTextColor={colors.textSecondary} value={prazo} onChangeText={setPrazo} />
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        <TouchableOpacity style={styles.botao} onPress={adicionar}>
          <Text style={styles.botaoTexto}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tarefas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.cardDescricao}>Nenhuma tarefa ainda.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => alternar(item.id)}>
              <Ionicons name={item.feita ? 'checkbox' : 'square-outline'} size={26} color={colors.olive} style={{ marginRight: 12 }} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitulo, item.feita && styles.feita]}>{item.titulo}</Text>
              <Text style={styles.cardDescricao}>Entrega até {item.prazo}</Text>
            </View>
            <TouchableOpacity onPress={() => remover(item.id)}>
              <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

function HorariosScreen() {
  const [horarios, salvar] = useLista('horarios');
  const [materia, setMateria] = useState('');
  const [dia, setDia] = useState('');
  const [hora, setHora] = useState('');
  const [erro, setErro] = useState('');

  const adicionar = () => {
    if (!materia || !dia || !hora) return setErro('Preencha matéria, dia e horário.');
    setErro('');
    salvar([...horarios, { id: Date.now().toString(), materia, dia, hora }]);
    setMateria('');
    setDia('');
    setHora('');
  };

  const remover = (id) => salvar(horarios.filter((h) => h.id !== id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Horários</Text>
      </View>

      <View style={styles.formAgenda}>
        <TextInput style={styles.input} placeholder="Matéria" placeholderTextColor={colors.textSecondary} value={materia} onChangeText={setMateria} />
        <TextInput style={styles.input} placeholder="Dia (ex: Seg)" placeholderTextColor={colors.textSecondary} value={dia} onChangeText={setDia} />
        <TextInput style={styles.input} placeholder="Horário (ex: 08:00)" placeholderTextColor={colors.textSecondary} value={hora} onChangeText={setHora} />
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        <TouchableOpacity style={styles.botao} onPress={adicionar}>
          <Text style={styles.botaoTexto}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={horarios}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.cardDescricao}>Nenhum horário ainda.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.dataBox}>
              <Text style={styles.dataTexto}>{item.dia} {item.hora}</Text>
            </View>
            <Text style={[styles.cardTitulo, { flex: 1 }]}>{item.materia}</Text>
            <TouchableOpacity onPress={() => remover(item.id)}>
              <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICONES = {
  Home: 'home-outline',
  Tarefa: 'clipboard-outline',
  Calendario: 'calendar-number-outline',
  Horarios: 'time-outline',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.olive,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONES[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tarefa" component={TarefaScreen} options={{ title: 'Tarefas' }} />
      <Tab.Screen name="Calendario" component={CalendarioScreen} options={{ title: 'Calendário' }} />
      <Tab.Screen name="Horarios" component={HorariosScreen} options={{ title: 'Horários' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Main" component={Tabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
