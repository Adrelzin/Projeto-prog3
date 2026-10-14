import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, FlatList, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from './styles';

function getApiUrl() {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = debuggerHost?.split(':')[0];
  if (host) return `http://${host}:3000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export const API_URL = getApiUrl();

const ERRO = '#B3261E';
const PRIORIDADES = ['Baixa', 'Média', 'Alta'];
const COR_PRIORIDADE = { Baixa: colors.olive, Média: colors.tan, Alta: ERRO };
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TIPOS = ['Prova', 'Trabalho', 'Tarefa', 'Evento'];
const COR_TIPO = { Prova: ERRO, Trabalho: colors.tan, Tarefa: colors.olive, Evento: '#3B6E8F' };

const hojeMs = () => new Date().setHours(0, 0, 0, 0);
const paraData = (s) => {
  const [d, m] = s.split('/').map(Number);
  return new Date(new Date().getFullYear(), (m || 1) - 1, d || 1).getTime();
};
const dataValida = (s) => {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(s);
  return !!m && +m[1] >= 1 && +m[1] <= 31 && +m[2] >= 1 && +m[2] <= 12;
};
const horaValida = (s) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(s);
const toMin = (s) => {
  const [h, m] = (s || '0:0').split(':').map(Number);
  return h * 60 + m;
};
const rotuloDias = (data) => {
  const n = Math.round((paraData(data) - hojeMs()) / 86400000);
  return n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : n > 1 ? `Em ${n} dias` : 'Já passou';
};

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

function Chips({ opcoes, valor, onChange }) {
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
          <Text style={styles.emailUsuario}>Usuário</Text>
        </View>
        <TouchableOpacity onPress={handleSair}>
          <Text style={styles.sair}>Sair</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function CalendarioScreen() {
  const [atividades, salvar] = useLista('atividades');
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [tipo, setTipo] = useState('Tarefa');
  const [obs, setObs] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('Todas');
  const [periodo, setPeriodo] = useState('Próximas');
  const [erro, setErro] = useState('');

  const limpar = () => {
    setTitulo('');
    setData('');
    setTipo('Tarefa');
    setObs('');
    setEditandoId(null);
    setErro('');
  };

  const confirmar = () => {
    if (!titulo || !data) return setErro('Preencha o título e a data.');
    if (!dataValida(data)) return setErro('Data inválida. Use dd/mm.');
    if (editandoId) salvar(atividades.map((a) => (a.id === editandoId ? { ...a, titulo, data, tipo, obs } : a)));
    else salvar([...atividades, { id: Date.now().toString(), titulo, data, tipo, obs }]);
    limpar();
  };

  const editar = (a) => {
    setTitulo(a.titulo);
    setData(a.data);
    setTipo(a.tipo);
    setObs(a.obs || '');
    setEditandoId(a.id);
    setErro('');
  };

  const remover = (id) => {
    if (editandoId === id) limpar();
    salvar(atividades.filter((a) => a.id !== id));
  };

  const hoje = hojeMs();
  const proximas = atividades.filter((a) => paraData(a.data) >= hoje).length;
  const lista = atividades
    .filter((a) => filtroTipo === 'Todas' || a.tipo === filtroTipo)
    .filter((a) => periodo === 'Todas' || (periodo === 'Próximas' ? paraData(a.data) >= hoje : paraData(a.data) < hoje))
    .sort((a, b) => (periodo === 'Passadas' ? -1 : 1) * (paraData(a.data) - paraData(b.data)));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Calendário</Text>
      </View>

      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View style={styles.formAgenda}>
              <TextInput style={styles.input} placeholder="Título da atividade" placeholderTextColor={colors.textSecondary} value={titulo} onChangeText={setTitulo} />
              <TextInput style={styles.input} placeholder="Data (ex: 25/09)" placeholderTextColor={colors.textSecondary} value={data} onChangeText={setData} />
              <Text style={styles.rotulo}>Tipo</Text>
              <Chips opcoes={TIPOS} valor={tipo} onChange={setTipo} />
              <TextInput style={styles.input} placeholder="Observação (opcional)" placeholderTextColor={colors.textSecondary} value={obs} onChangeText={setObs} />
              {erro ? <Text style={styles.erro}>{erro}</Text> : null}
              <TouchableOpacity style={styles.botao} onPress={confirmar}>
                <Text style={styles.botaoTexto}>{editandoId ? 'Salvar alterações' : 'Adicionar'}</Text>
              </TouchableOpacity>
              {editandoId ? (
                <TouchableOpacity style={[styles.botao, styles.botaoCancelar]} onPress={limpar}>
                  <Text style={styles.botaoTexto}>Cancelar edição</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Chips opcoes={['Próximas', 'Passadas', 'Todas']} valor={periodo} onChange={setPeriodo} />
            <Chips opcoes={['Todas', ...TIPOS]} valor={filtroTipo} onChange={setFiltroTipo} />
            <Text style={styles.contador}>{proximas} atividade(s) próxima(s) de {atividades.length}</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.cardDescricao}>Nenhuma atividade aqui.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.dataBox, { backgroundColor: COR_TIPO[item.tipo] || colors.olive }]}>
              <Text style={styles.dataTexto}>{item.data}</Text>
            </View>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => editar(item)}>
              <Text style={styles.cardTitulo}>{item.titulo}</Text>
              {item.obs ? <Text style={styles.cardDescricao}>{item.obs}</Text> : null}
              <Text style={[styles.cardTipo, { color: COR_TIPO[item.tipo] || colors.textSecondary }]}>{item.tipo} · {rotuloDias(item.data)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => remover(item.id)}>
              <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

function TarefaScreen() {
  const [tarefas, salvar] = useLista('tarefas');
  const [titulo, setTitulo] = useState('');
  const [materia, setMateria] = useState('');
  const [prazo, setPrazo] = useState('');
  const [prioridade, setPrioridade] = useState('Média');
  const [editandoId, setEditandoId] = useState(null);
  const [filtro, setFiltro] = useState('Todas');
  const [erro, setErro] = useState('');

  const limpar = () => {
    setTitulo('');
    setMateria('');
    setPrazo('');
    setPrioridade('Média');
    setEditandoId(null);
    setErro('');
  };

  const confirmar = () => {
    if (!titulo || !prazo) return setErro('Preencha o título e o prazo.');
    if (!dataValida(prazo)) return setErro('Prazo inválido. Use dd/mm.');
    if (editandoId) salvar(tarefas.map((t) => (t.id === editandoId ? { ...t, titulo, materia, prazo, prioridade } : t)));
    else salvar([...tarefas, { id: Date.now().toString(), titulo, materia, prazo, prioridade, feita: false }]);
    limpar();
  };

  const editar = (t) => {
    setTitulo(t.titulo);
    setMateria(t.materia || '');
    setPrazo(t.prazo);
    setPrioridade(t.prioridade || 'Média');
    setEditandoId(t.id);
    setErro('');
  };

  const alternar = (id) => salvar(tarefas.map((t) => (t.id === id ? { ...t, feita: !t.feita } : t)));

  const remover = (id) => {
    if (editandoId === id) limpar();
    salvar(tarefas.filter((t) => t.id !== id));
  };

  const limparConcluidas = () => salvar(tarefas.filter((t) => !t.feita));

  const hoje = hojeMs();
  const pendentes = tarefas.filter((t) => !t.feita).length;
  const lista = tarefas
    .filter((t) => filtro === 'Todas' || (filtro === 'Pendentes' ? !t.feita : t.feita))
    .sort((a, b) => a.feita - b.feita || paraData(a.prazo) - paraData(b.prazo));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Tarefas</Text>
        {tarefas.length - pendentes > 0 ? (
          <TouchableOpacity onPress={limparConcluidas}>
            <Text style={styles.sair}>Limpar concluídas</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View style={styles.formAgenda}>
              <TextInput style={styles.input} placeholder="Título da tarefa" placeholderTextColor={colors.textSecondary} value={titulo} onChangeText={setTitulo} />
              <TextInput style={styles.input} placeholder="Matéria (opcional)" placeholderTextColor={colors.textSecondary} value={materia} onChangeText={setMateria} />
              <TextInput style={styles.input} placeholder="Prazo (ex: 15/10)" placeholderTextColor={colors.textSecondary} value={prazo} onChangeText={setPrazo} />
              <Text style={styles.rotulo}>Prioridade</Text>
              <Chips opcoes={PRIORIDADES} valor={prioridade} onChange={setPrioridade} />
              {erro ? <Text style={styles.erro}>{erro}</Text> : null}
              <TouchableOpacity style={styles.botao} onPress={confirmar}>
                <Text style={styles.botaoTexto}>{editandoId ? 'Salvar alterações' : 'Adicionar'}</Text>
              </TouchableOpacity>
              {editandoId ? (
                <TouchableOpacity style={[styles.botao, styles.botaoCancelar]} onPress={limpar}>
                  <Text style={styles.botaoTexto}>Cancelar edição</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Chips opcoes={['Todas', 'Pendentes', 'Concluídas']} valor={filtro} onChange={setFiltro} />
            <Text style={styles.contador}>{pendentes} pendente(s) de {tarefas.length}</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.cardDescricao}>Nenhuma tarefa aqui.</Text>}
        renderItem={({ item }) => {
          const p = item.prioridade || 'Média';
          const atrasada = !item.feita && paraData(item.prazo) < hoje;
          return (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => alternar(item.id)}>
                <Ionicons name={item.feita ? 'checkbox' : 'square-outline'} size={26} color={colors.olive} style={{ marginRight: 12 }} />
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => editar(item)}>
                <Text style={[styles.cardTitulo, item.feita && styles.feita]}>{item.titulo}</Text>
                <Text style={styles.cardDescricao}>{item.materia ? `${item.materia} · ` : ''}Entrega até {item.prazo}</Text>
                <Text style={[styles.cardTipo, { color: atrasada ? ERRO : COR_PRIORIDADE[p] }]}>{atrasada ? 'Atrasada · ' : ''}Prioridade {p}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remover(item.id)}>
                <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

function HorariosScreen() {
  const [horarios, salvar] = useLista('horarios');
  const [materia, setMateria] = useState('');
  const [dia, setDia] = useState('Seg');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [local, setLocal] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [filtro, setFiltro] = useState('Todos');
  const [erro, setErro] = useState('');

  const limpar = () => {
    setMateria('');
    setDia('Seg');
    setInicio('');
    setFim('');
    setLocal('');
    setEditandoId(null);
    setErro('');
  };

  const lista = horarios.map((h) => ({ ...h, inicio: h.inicio ?? h.hora, fim: h.fim ?? '' }));

  const confirmar = () => {
    if (!materia || !inicio || !fim) return setErro('Preencha matéria, início e fim.');
    if (!horaValida(inicio) || !horaValida(fim)) return setErro('Horário inválido. Use hh:mm.');
    if (toMin(fim) <= toMin(inicio)) return setErro('O fim precisa ser depois do início.');
    const conflito = lista.find((h) => h.id !== editandoId && h.dia === dia && toMin(inicio) < toMin(h.fim) && toMin(fim) > toMin(h.inicio));
    if (conflito) return setErro(`Conflito com ${conflito.materia} (${conflito.inicio}–${conflito.fim}).`);
    const novo = { materia, dia, inicio, fim, local };
    if (editandoId) salvar(lista.map((h) => (h.id === editandoId ? { ...h, ...novo } : h)));
    else salvar([...lista, { id: Date.now().toString(), ...novo }]);
    limpar();
  };

  const editar = (h) => {
    setMateria(h.materia);
    setDia(h.dia);
    setInicio(h.inicio);
    setFim(h.fim);
    setLocal(h.local || '');
    setEditandoId(h.id);
    setErro('');
  };

  const remover = (id) => {
    if (editandoId === id) limpar();
    salvar(lista.filter((h) => h.id !== id));
  };

  const hoje = DIAS_SEMANA[new Date().getDay()];
  const aulasHoje = lista.filter((h) => h.dia === hoje).length;
  const exibidos = lista
    .filter((h) => filtro === 'Todos' || h.dia === filtro)
    .sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || toMin(a.inicio) - toMin(b.inicio));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Horários</Text>
      </View>

      <FlatList
        data={exibidos}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View style={styles.formAgenda}>
              <TextInput style={styles.input} placeholder="Matéria" placeholderTextColor={colors.textSecondary} value={materia} onChangeText={setMateria} />
              <Text style={styles.rotulo}>Dia da semana</Text>
              <Chips opcoes={DIAS} valor={dia} onChange={setDia} />
              <TextInput style={styles.input} placeholder="Início (ex: 08:00)" placeholderTextColor={colors.textSecondary} keyboardType="numbers-and-punctuation" value={inicio} onChangeText={setInicio} />
              <TextInput style={styles.input} placeholder="Fim (ex: 09:40)" placeholderTextColor={colors.textSecondary} keyboardType="numbers-and-punctuation" value={fim} onChangeText={setFim} />
              <TextInput style={styles.input} placeholder="Sala ou professor (opcional)" placeholderTextColor={colors.textSecondary} value={local} onChangeText={setLocal} />
              {erro ? <Text style={styles.erro}>{erro}</Text> : null}
              <TouchableOpacity style={styles.botao} onPress={confirmar}>
                <Text style={styles.botaoTexto}>{editandoId ? 'Salvar alterações' : 'Adicionar'}</Text>
              </TouchableOpacity>
              {editandoId ? (
                <TouchableOpacity style={[styles.botao, styles.botaoCancelar]} onPress={limpar}>
                  <Text style={styles.botaoTexto}>Cancelar edição</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Chips opcoes={['Todos', ...DIAS]} valor={filtro} onChange={setFiltro} />
            <Text style={styles.contador}>{lista.length} aula(s) na semana · {aulasHoje} hoje</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.cardDescricao}>Nenhum horário aqui.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.dataBox}>
              <Text style={styles.dataTexto}>{item.dia}</Text>
              <Text style={styles.dataTexto}>{item.inicio}</Text>
            </View>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => editar(item)}>
              <Text style={styles.cardTitulo}>{item.materia}</Text>
              <Text style={styles.cardDescricao}>{item.fim ? `${item.inicio}–${item.fim}` : item.inicio}{item.local ? ` · ${item.local}` : ''}</Text>
              {item.dia === hoje ? <Text style={[styles.cardTipo, { color: colors.olive }]}>Hoje</Text> : null}
            </TouchableOpacity>
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
