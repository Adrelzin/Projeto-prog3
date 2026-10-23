import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, FlatList, Platform, Modal, Animated, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Calendar from 'expo-calendar';
import { Ionicons } from '@expo/vector-icons';
import { colors, styles } from './styles';

const ERRO = '#B3261E';
const StyleSheetAbsolute = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA = ['Dom', ...DIAS];
const PRIORIDADES = ['Baixa', 'Média', 'Alta'];
const COR_PRIORIDADE = { Baixa: colors.olive, Média: colors.tan, Alta: ERRO };
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

const mascaraData = (v) => {
  const n = v.replace(/\D/g, '').slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
};

const mascaraHora = (v) => {
  const n = v.replace(/\D/g, '').slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}:${n.slice(2)}` : n;
};

const toMin = (s) => {
  const [h, m] = (s || '0:0').split(':').map(Number);
  return h * 60 + m;
};

const rotuloDias = (data) => {
  const n = Math.round((paraData(data) - hojeMs()) / 86400000);
  return n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : n > 1 ? `Em ${n} dias` : 'Já passou';
};

const corNota = (n) => (n >= 7 ? colors.olive : n >= 5 ? colors.tan : ERRO);

function getApiUrl() {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = debuggerHost?.split(':')[0];
  if (host) return `http://${host}:3000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}
export const API_URL = getApiUrl();

const dataHora = (data, hora = '0:0') => {
  const [d, m] = data.split('/').map(Number);
  const [h, mi] = hora.split(':').map(Number);
  return new Date(new Date().getFullYear(), m - 1, d, h, mi);
};

async function calendarioPadrao() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return null;
  const cals = (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).filter((c) => c.allowsModifications);
  const google = cals.find((c) => /google|gmail/i.test(`${c.source?.name} ${c.source?.type}`));
  return google || cals.find((c) => c.isPrimary) || cals[0] || null;
}

async function sincronizarEvento(eventoId, evento) {
  try {
    const cal = await calendarioPadrao();
    if (!cal) {
      Alert.alert('Agenda', 'Não foi possível acessar a agenda. Verifique a permissão e se há uma conta Google no celular.');
      return eventoId || null;
    }
    const dados = { ...evento, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    if (eventoId) {
      try {
        await Calendar.updateEventAsync(eventoId, dados);
        return eventoId;
      } catch {}
    }
    return await Calendar.createEventAsync(cal.id, dados);
  } catch (e) {
    Alert.alert('Erro ao sincronizar', String(e?.message || e));
    return eventoId || null;
  }
}

async function apagarEvento(eventoId) {
  if (!eventoId) return;
  try {
    await Calendar.deleteEventAsync(eventoId);
  } catch {}
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
function useForm(inicial) {
  const [campos, setCampos] = useState(inicial);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const set = (k) => (v) => setCampos((c) => ({ ...c, [k]: v }));
  const limpar = () => { setCampos(inicial); setEditandoId(null); setErro(''); };
  const editar = (item) => {
    setCampos(Object.fromEntries(Object.keys(inicial).map((k) => [k, String(item[k] ?? inicial[k])])));
    setEditandoId(item.id);
    setErro('');
  };
  return { campos, set, editandoId, erro, setErro, limpar, editar };
}
function useCrud(chave, inicial) {
  const [itens, salvar] = useLista(chave);
  const f = useForm(inicial);
  const gravar = (novo, extra = {}) => {
    salvar(f.editandoId
      ? itens.map((x) => (x.id === f.editandoId ? { ...x, ...novo } : x))
      : [...itens, { id: Date.now().toString(), ...extra, ...novo }]);
    f.limpar();
  };
  const remover = (id) => {
    apagarEvento(itens.find((x) => x.id === id)?.eventoId);
    if (f.editandoId === id) f.limpar();
    salvar(itens.filter((x) => x.id !== id));
  };
  const alterar = (id, fn) => salvar(itens.map((x) => (x.id === id ? { ...x, ...fn(x) } : x)));
  return { itens, salvar, f, gravar, remover, alterar };
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

function Filtro({ opcoes, valor, onChange }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <TouchableOpacity style={[styles.chip, styles.chipAtivo, { flexDirection: 'row', alignItems: 'center' }]} onPress={() => setAberto(true)}>
        <Ionicons name="funnel-outline" size={16} color="#fff" />
        <Text style={[styles.chipTexto, styles.chipTextoAtivo, { marginLeft: 6 }]}>{valor}</Text>
      </TouchableOpacity>
      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setAberto(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 }}>
          <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 8 }}>
            {opcoes.map((o) => (
              <TouchableOpacity key={o} style={styles.menuItem} onPress={() => { onChange(o); setAberto(false); }}>
                <Text style={[styles.menuTexto, o === valor && { color: colors.olive, fontWeight: 'bold' }]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const Seletor = ({ rotulo, ...p }) => (
  <>
    <Text style={styles.rotulo}>{rotulo}</Text>
    <Chips {...p} />
  </>
);

const Campo = ({ f, k, ph, mask, ...p }) => (
  <TextInput
    style={styles.input}
    placeholder={ph}
    placeholderTextColor={colors.textSecondary}
    value={f.campos[k]}
    onChangeText={(v) => f.set(k)(mask ? mask(v) : v)}
    {...p}
  />
);

const Check = ({ on, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <Ionicons name={on ? 'checkbox' : 'square-outline'} size={26} color={colors.olive} style={{ marginRight: 12 }} />
  </TouchableOpacity>
);

const Card = ({ esq, extra, onPress, onRemover, children }) => (
  <View style={styles.card}>
    {esq}
    <TouchableOpacity style={{ flex: 1 }} onPress={onPress}>{children}</TouchableOpacity>
    {extra}
    <TouchableOpacity onPress={onRemover}>
      <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
    </TouchableOpacity>
  </View>
);
function Tela({ titulo, acao, dados, f, onSubmit, campos, resumo, vazio, renderItem }) {
  return (
    <View style={styles.container}>
      {titulo && (
        <View style={styles.header}>
          <Text style={styles.titulo}>{titulo}</Text>
          {acao}
        </View>
      )}
      <FlatList
        data={dados}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View style={styles.formAgenda}>
              {campos}
              {f.erro ? <Text style={styles.erro}>{f.erro}</Text> : null}
              <TouchableOpacity style={styles.botao} onPress={onSubmit}>
                <Text style={styles.botaoTexto}>{f.editandoId ? 'Salvar alterações' : 'Adicionar'}</Text>
              </TouchableOpacity>
              {f.editandoId ? (
                <TouchableOpacity style={[styles.botao, styles.botaoCancelar]} onPress={f.limpar}>
                  <Text style={styles.botaoTexto}>Cancelar edição</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {resumo}
          </View>
        }
        ListEmptyComponent={<Text style={styles.cardDescricao}>{vazio}</Text>}
        renderItem={renderItem}
      />
    </View>
  );
}

function NotasScreen() {
  const { itens, f, gravar, remover } = useCrud('notas', { materia: '', avaliacao: '', nota: '' });
  const [filtro, setFiltro] = useState('Todas');
  const { materia, avaliacao, nota } = f.campos;

  const confirmar = () => {
    const n = parseFloat(nota.replace(',', '.'));
    if (!materia || !avaliacao || !nota) return f.setErro('Preencha matéria, avaliação e nota.');
    if (isNaN(n) || n < 0 || n > 10) return f.setErro('Nota inválida. Use de 0 a 10.');
    gravar({ materia, avaliacao, nota: n });
  };

  const materias = [...new Set(itens.map((x) => x.materia))];
  const lista = itens.filter((x) => filtro === 'Todas' || x.materia === filtro);
  const media = lista.length ? (lista.reduce((s, x) => s + x.nota, 0) / lista.length).toFixed(1) : '–';

  return (
    <Tela
      dados={lista} f={f} onSubmit={confirmar} vazio="Nenhuma nota aqui."
      campos={<>
        <Campo f={f} k="materia" ph="Matéria" />
        <Campo f={f} k="avaliacao" ph="Avaliação (ex: Prova 1)" />
        <Campo f={f} k="nota" ph="Nota (0 a 10)" keyboardType="numbers-and-punctuation" />
      </>}
      resumo={<>
        <View style={styles.chips}>
          <Filtro opcoes={['Todas', ...materias]} valor={filtro} onChange={setFiltro} />
        </View>
        <Text style={styles.contador}>Média {media} · {lista.length} nota(s)</Text>
      </>}
      renderItem={({ item }) => (
        <Card
          esq={<View style={[styles.dataBox, { backgroundColor: corNota(item.nota) }]}><Text style={styles.dataTexto}>{item.nota.toFixed(1)}</Text></View>}
          onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
        >
          <Text style={styles.cardTitulo}>{item.materia}</Text>
          <Text style={styles.cardDescricao}>{item.avaliacao}</Text>
        </Card>
      )}
    />
  );
}

function MetasScreen() {
  const { itens, f, gravar, remover, alterar } = useCrud('metas', { titulo: '', alvo: '' });
  const { titulo, alvo } = f.campos;

  const confirmar = () => {
    const h = parseInt(alvo, 10);
    if (!titulo || !alvo) return f.setErro('Preencha o título e as horas.');
    if (isNaN(h) || h < 1) return f.setErro('Horas inválidas. Use um número maior que 0.');
    gravar({ titulo, alvo: h }, { feito: 0 });
  };

  const concluidas = itens.filter((m) => m.feito >= m.alvo).length;

  return (
    <Tela
      dados={itens} f={f} onSubmit={confirmar} vazio="Nenhuma meta aqui."
      campos={<>
        <Campo f={f} k="titulo" ph="Meta (ex: Estudar Cálculo)" />
        <Campo f={f} k="alvo" ph="Horas a estudar (ex: 10)" keyboardType="numeric" />
      </>}
      resumo={<Text style={styles.contador}>{concluidas} de {itens.length} meta(s) concluída(s)</Text>}
      renderItem={({ item }) => {
        const pct = Math.min(100, Math.round((item.feito / item.alvo) * 100));
        const ajustar = (d) => alterar(item.id, (m) => ({ feito: Math.max(0, m.feito + d) }));
        return (
          <Card
            onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
            extra={<>
              <TouchableOpacity onPress={() => ajustar(-1)}>
                <Ionicons name="remove-circle-outline" size={26} color={colors.textSecondary} style={{ marginRight: 8 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => ajustar(1)}>
                <Ionicons name="add-circle-outline" size={26} color={colors.olive} style={{ marginRight: 8 }} />
              </TouchableOpacity>
            </>}
          >
            <Text style={styles.cardTitulo}>{item.titulo}</Text>
            <Text style={styles.cardDescricao}>{item.feito}/{item.alvo}h</Text>
            <Text style={[styles.cardTipo, { color: pct >= 100 ? colors.olive : colors.tan }]}>{pct}%</Text>
          </Card>
        );
      }}
    />
  );
}

function LembretesScreen() {
  const { itens, f, gravar, remover, alterar } = useCrud('lembretes', { titulo: '', data: '', hora: '' });
  const [filtro, setFiltro] = useState('Pendentes');
  const { titulo, data, hora } = f.campos;

  const confirmar = async () => {
    if (!titulo || !data || !hora) return f.setErro('Preencha título, data e hora.');
    if (!dataValida(data)) return f.setErro('Data inválida. Use dd/mm.');
    if (!horaValida(hora)) return f.setErro('Horário inválido. Use hh:mm.');
    const inicio = dataHora(data, hora);
    const eventoId = await sincronizarEvento(itens.find((x) => x.id === f.editandoId)?.eventoId, {
      title: titulo,
      startDate: inicio,
      endDate: new Date(inicio.getTime() + 3600000),
      alarms: [{ relativeOffset: -30 }],
    });
    gravar({ titulo, data, hora, eventoId }, { feito: false });
  };

  const hoje = hojeMs();
  const pendentes = itens.filter((l) => !l.feito).length;
  const lista = itens
    .filter((l) => filtro === 'Todos' || !l.feito)
    .sort((a, b) => a.feito - b.feito || paraData(a.data) - paraData(b.data) || toMin(a.hora) - toMin(b.hora));

  return (
    <Tela
      titulo="Lembretes" dados={lista} f={f} onSubmit={confirmar} vazio="Nenhum lembrete aqui."
      campos={<>
        <Campo f={f} k="titulo" ph="Lembrete (ex: Prova de Física)" />
        <Campo f={f} k="data" ph="Data (ex: 2509)" mask={mascaraData} keyboardType="number-pad" />
        <Campo f={f} k="hora" ph="Hora (ex: 0800)" mask={mascaraHora} keyboardType="number-pad" />
      </>}
      resumo={<>
        <View style={styles.chips}>
          <Filtro opcoes={['Pendentes', 'Todos']} valor={filtro} onChange={setFiltro} />
        </View>
        <Text style={styles.contador}>{pendentes} pendente(s) de {itens.length}</Text>
      </>}
      renderItem={({ item }) => {
        const atrasado = !item.feito && paraData(item.data) < hoje;
        return (
          <Card
            esq={<Check on={item.feito} onPress={() => alterar(item.id, (l) => ({ feito: !l.feito }))} />}
            onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
          >
            <Text style={[styles.cardTitulo, item.feito && styles.feita]}>{item.titulo}</Text>
            <Text style={[styles.cardTipo, { color: atrasado ? ERRO : colors.olive }]}>{item.data} às {item.hora} · {atrasado ? 'Atrasado' : rotuloDias(item.data)}</Text>
          </Card>
        );
      }}
    />
  );
}

function CalendarioScreen() {
  const { itens, f, gravar, remover } = useCrud('atividades', { titulo: '', data: '', tipo: 'Tarefa', obs: '' });
  const [filtroTipo, setFiltroTipo] = useState('Todas');
  const [periodo, setPeriodo] = useState('Próximas');
  const { titulo, data, tipo, obs } = f.campos;

  const confirmar = async () => {
    if (!titulo || !data) return f.setErro('Preencha o título e a data.');
    if (!dataValida(data)) return f.setErro('Data inválida. Use dd/mm.');
    const inicio = dataHora(data);
    const eventoId = await sincronizarEvento(itens.find((x) => x.id === f.editandoId)?.eventoId, {
      title: `${tipo}: ${titulo}`,
      notes: obs,
      startDate: inicio,
      endDate: new Date(inicio.getTime() + 86399000),
      allDay: true,
    });
    gravar({ titulo, data, tipo, obs, eventoId });
  };

  const hoje = hojeMs();
  const proximas = itens.filter((a) => paraData(a.data) >= hoje).length;
  const lista = itens
    .filter((a) => filtroTipo === 'Todas' || a.tipo === filtroTipo)
    .filter((a) => periodo === 'Todas' || (periodo === 'Próximas' ? paraData(a.data) >= hoje : paraData(a.data) < hoje))
    .sort((a, b) => (periodo === 'Passadas' ? -1 : 1) * (paraData(a.data) - paraData(b.data)));

  return (
    <Tela
      titulo="Calendário" dados={lista} f={f} onSubmit={confirmar} vazio="Nenhuma atividade aqui."
      campos={<>
        <Campo f={f} k="titulo" ph="Título da atividade" />
        <Campo f={f} k="data" ph="Data (ex: 2509)" mask={mascaraData} keyboardType="number-pad" />
        <Seletor rotulo="Tipo" opcoes={TIPOS} valor={tipo} onChange={f.set('tipo')} />
        <Campo f={f} k="obs" ph="Observação (opcional)" />
      </>}
      resumo={<>
        <View style={styles.chips}>
          <Filtro opcoes={['Próximas', 'Passadas', 'Todas']} valor={periodo} onChange={setPeriodo} />
          <Filtro opcoes={['Todas', ...TIPOS]} valor={filtroTipo} onChange={setFiltroTipo} />
        </View>
        <Text style={styles.contador}>{proximas} atividade(s) próxima(s) de {itens.length}</Text>
      </>}
      renderItem={({ item }) => (
        <Card
          esq={<View style={[styles.dataBox, { backgroundColor: COR_TIPO[item.tipo] || colors.olive }]}><Text style={styles.dataTexto}>{item.data}</Text></View>}
          onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
        >
          <Text style={styles.cardTitulo}>{item.titulo}</Text>
          {item.obs ? <Text style={styles.cardDescricao}>{item.obs}</Text> : null}
          <Text style={[styles.cardTipo, { color: COR_TIPO[item.tipo] || colors.textSecondary }]}>{item.tipo} · {rotuloDias(item.data)}</Text>
        </Card>
      )}
    />
  );
}

function TarefaScreen() {
  const { itens, salvar, f, gravar, remover, alterar } = useCrud('tarefas', { titulo: '', materia: '', prazo: '', prioridade: 'Média' });
  const [filtro, setFiltro] = useState('Todas');
  const { titulo, materia, prazo, prioridade } = f.campos;

  const confirmar = () => {
    if (!titulo || !prazo) return f.setErro('Preencha o título e o prazo.');
    if (!dataValida(prazo)) return f.setErro('Prazo inválido. Use dd/mm.');
    gravar({ titulo, materia, prazo, prioridade }, { feita: false });
  };

  const hoje = hojeMs();
  const pendentes = itens.filter((t) => !t.feita).length;
  const lista = itens
    .filter((t) => filtro === 'Todas' || (filtro === 'Pendentes' ? !t.feita : t.feita))
    .sort((a, b) => a.feita - b.feita || paraData(a.prazo) - paraData(b.prazo));

  return (
    <Tela
      titulo="Tarefas" dados={lista} f={f} onSubmit={confirmar} vazio="Nenhuma tarefa aqui."
      acao={itens.length - pendentes > 0 ? (
        <TouchableOpacity onPress={() => salvar(itens.filter((t) => !t.feita))}>
          <Text style={styles.sair}>Limpar concluídas</Text>
        </TouchableOpacity>
      ) : null}
      campos={<>
        <Campo f={f} k="titulo" ph="Título da tarefa" />
        <Campo f={f} k="materia" ph="Matéria (opcional)" />
        <Campo f={f} k="prazo" ph="Prazo (ex: 1510)" mask={mascaraData} keyboardType="number-pad" />
        <Seletor rotulo="Prioridade" opcoes={PRIORIDADES} valor={prioridade} onChange={f.set('prioridade')} />
      </>}
      resumo={<>
        <View style={styles.chips}>
          <Filtro opcoes={['Todas', 'Pendentes', 'Concluídas']} valor={filtro} onChange={setFiltro} />
        </View>
        <Text style={styles.contador}>{pendentes} pendente(s) de {itens.length}</Text>
      </>}
      renderItem={({ item }) => {
        const p = item.prioridade || 'Média';
        const atrasada = !item.feita && paraData(item.prazo) < hoje;
        return (
          <Card
            esq={<Check on={item.feita} onPress={() => alterar(item.id, (t) => ({ feita: !t.feita }))} />}
            onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
          >
            <Text style={[styles.cardTitulo, item.feita && styles.feita]}>{item.titulo}</Text>
            <Text style={styles.cardDescricao}>{item.materia ? `${item.materia} · ` : ''}Entrega até {item.prazo}</Text>
            <Text style={[styles.cardTipo, { color: atrasada ? ERRO : COR_PRIORIDADE[p] }]}>{atrasada ? 'Atrasada · ' : ''}Prioridade {p}</Text>
          </Card>
        );
      }}
    />
  );
}

function HorariosScreen() {
  const { itens, f, gravar, remover } = useCrud('horarios', { materia: '', dia: 'Seg', inicio: '', fim: '', local: '' });
  const [filtro, setFiltro] = useState('Todos');
  const { materia, dia, inicio, fim, local } = f.campos;

  const confirmar = () => {
    if (!materia || !inicio || !fim) return f.setErro('Preencha matéria, início e fim.');
    if (!horaValida(inicio) || !horaValida(fim)) return f.setErro('Horário inválido. Use hh:mm.');
    if (toMin(fim) <= toMin(inicio)) return f.setErro('O fim precisa ser depois do início.');
    const c = itens.find((h) => h.id !== f.editandoId && h.dia === dia && toMin(inicio) < toMin(h.fim) && toMin(fim) > toMin(h.inicio));
    if (c) return f.setErro(`Conflito com ${c.materia} (${c.inicio}–${c.fim}).`);
    gravar({ materia, dia, inicio, fim, local });
  };

  const hoje = DIAS_SEMANA[new Date().getDay()];
  const aulasHoje = itens.filter((h) => h.dia === hoje).length;
  const exibidos = itens
    .filter((h) => filtro === 'Todos' || h.dia === filtro)
    .sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || toMin(a.inicio) - toMin(b.inicio));

  return (
    <Tela
      titulo="Horários" dados={exibidos} f={f} onSubmit={confirmar} vazio="Nenhum horário aqui."
      campos={<>
        <Campo f={f} k="materia" ph="Matéria" />
        <Seletor rotulo="Dia da semana" opcoes={DIAS} valor={dia} onChange={f.set('dia')} />
        <Campo f={f} k="inicio" ph="Início (ex: 0800)" mask={mascaraHora} keyboardType="number-pad" />
        <Campo f={f} k="fim" ph="Fim (ex: 0940)" mask={mascaraHora} keyboardType="number-pad" />
        <Campo f={f} k="local" ph="Sala ou professor (opcional)" />
      </>}
      resumo={<>
        <View style={styles.chips}>
          <Filtro opcoes={['Todos', ...DIAS]} valor={filtro} onChange={setFiltro} />
        </View>
        <Text style={styles.contador}>{itens.length} aula(s) na semana · {aulasHoje} hoje</Text>
      </>}
      renderItem={({ item }) => (
        <Card
          esq={<View style={styles.dataBox}><Text style={styles.dataTexto}>{item.dia}</Text><Text style={styles.dataTexto}>{item.inicio}</Text></View>}
          onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
        >
          <Text style={styles.cardTitulo}>{item.materia}</Text>
          <Text style={styles.cardDescricao}>{item.inicio}–{item.fim}{item.local ? ` · ${item.local}` : ''}</Text>
          {item.dia === hoje ? <Text style={[styles.cardTipo, { color: colors.olive }]}>Hoje</Text> : null}
        </Card>
      )}
    />
  );
}

function Auth({ navigation, cadastro }) {
  const [c, setC] = useState({ nome: '', email: '', senha: '' });
  const [carregando, setCarregando] = useState(false);
  const set = (k) => (v) => setC((x) => ({ ...x, [k]: v }));

  const enviar = async () => {
    if (!c.email || !c.senha || (cadastro && !c.nome)) return Alert.alert('Atenção', 'Preencha todos os campos.');
    if (cadastro && c.senha.length < 6) return Alert.alert('Atenção', 'A senha precisa ter pelo menos 6 caracteres.');
    try {
      setCarregando(true);
      const res = await fetch(`${API_URL}/${cadastro ? 'cadastro' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cadastro ? c : { email: c.email, senha: c.senha }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error();
      await AsyncStorage.setItem('usuario', JSON.stringify(dados));
      navigation.replace('Main', { screen: 'Home', params: { usuario: dados } });
    } catch {
      Alert.alert(cadastro ? 'Erro ao cadastrar' : 'Erro ao entrar', cadastro ? 'Verifique os dados e tente novamente.' : 'E-mail ou senha inválidos.');
    } finally {
      setCarregando(false);
    }
  };

  const input = (k, ph, p) => (
    <TextInput style={styles.input} placeholder={ph} placeholderTextColor={colors.textSecondary} value={c[k]} onChangeText={set(k)} {...p} />
  );

  return (
    <View style={[styles.container, { paddingTop: 50 }]}>
      <Text style={styles.titulo}>{cadastro ? 'Criar conta' : 'Rotina Escolar'}</Text>
      <Text style={styles.subtitulo}>{cadastro ? 'Comece a organizar sua rotina escolar' : 'Entre para continuar'}</Text>
      {cadastro && input('nome', 'Nome')}
      {input('email', 'E-mail', { autoCapitalize: 'none', keyboardType: 'email-address' })}
      {input('senha', cadastro ? 'Senha (mín. 6 caracteres)' : 'Senha', { secureTextEntry: true })}

      <TouchableOpacity style={styles.botao} onPress={enviar} disabled={carregando}>
        <Text style={styles.botaoTexto}>{carregando ? (cadastro ? 'Cadastrando...' : 'Entrando...') : cadastro ? 'Cadastrar' : 'Entrar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.botao, { backgroundColor: colors.tan, marginTop: 10 }]} onPress={() => navigation.navigate('Main')}>
        <Text style={styles.botaoTexto}>{cadastro ? 'Entrar sem cadastro (Modo Demo)' : 'Entrar sem login (Modo Demo)'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate(cadastro ? 'Login' : 'Cadastro')}>
        <Text style={styles.link}>{cadastro ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastre-se'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const LoginScreen = (p) => <Auth {...p} />;
const CadastroScreen = (p) => <Auth {...p} cadastro />;

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MENU = [
  { nome: 'Home', rotulo: 'Início', icone: 'home-outline', aba: true },
  { nome: 'Tarefa', rotulo: 'Tarefas', icone: 'clipboard-outline', aba: true },
  { nome: 'Calendario', rotulo: 'Calendário', icone: 'calendar-number-outline', aba: true },
  { nome: 'Horarios', rotulo: 'Horários', icone: 'time-outline', aba: true },
  { nome: 'Lembretes', rotulo: 'Lembretes', icone: 'notifications-outline' },
  { nome: 'Notas', rotulo: 'Notas e Desempenho', icone: 'bar-chart-outline' },
  { nome: 'Metas', rotulo: 'Metas de Estudo', icone: 'flag-outline' },
];
const ICONES = Object.fromEntries(MENU.map((m) => [m.nome, m.icone]));

function Tabs({ navigation }) {
  const [menu, setMenu] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const LARGURA = Math.min(320, Dimensions.get('window').width * 0.78);

  const abrir = () => {
    setMenu(true);
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const fechar = (depois) => {
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setMenu(false);
      if (depois) depois();
    });
  };

  const ir = (item) => fechar(() => {
    if (item.aba) navigation.navigate('Main', { screen: item.nome });
    else navigation.navigate(item.nome);
  });

  const sair = async () => {
    await AsyncStorage.removeItem('usuario');
    fechar(() => navigation.replace('Login'));
  };

  const linha = { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 };
  const caixaIcone = { width: 28, alignItems: 'center' };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          headerTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerLeft: () => (
            <TouchableOpacity onPress={abrir} style={{ marginLeft: 16 }}>
              <Ionicons name="menu" size={28} color={colors.text} />
            </TouchableOpacity>
          ),
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

      <Modal visible={menu} transparent animationType="none" onRequestClose={() => fechar()}>
        <View style={{ flex: 1 }}>
          <Animated.View style={{ ...StyleSheetAbsolute, backgroundColor: 'rgba(0,0,0,0.4)', opacity: anim }}>
            <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => fechar()} />
          </Animated.View>

          <Animated.View
            style={{
              width: LARGURA,
              flex: 1,
              backgroundColor: colors.background,
              paddingTop: (Constants.statusBarHeight || 0) + 24,
              paddingHorizontal: 12,
              elevation: 8,
              transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-LARGURA, 0] }) }],
            }}
          >
            <TouchableOpacity onPress={() => fechar()} style={[linha, { marginBottom: 8 }]}>
              <View style={caixaIcone}>
                <Ionicons name="menu" size={28} color={colors.text} style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
            </TouchableOpacity>

            {MENU.map((item) => (
              <TouchableOpacity key={item.nome} style={linha} onPress={() => ir(item)}>
                <View style={caixaIcone}>
                  <Ionicons name={item.icone} size={22} color={colors.olive} />
                </View>
                <Text style={[styles.menuTexto, { marginLeft: 14 }]}>{item.rotulo}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

            <TouchableOpacity style={linha} onPress={sair}>
              <View style={caixaIcone}>
                <Ionicons name="log-out-outline" size={22} color={ERRO} />
              </View>
              <Text style={[styles.menuTexto, { marginLeft: 14, color: ERRO }]}>Sair</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Main" component={Tabs} />
        <Stack.Screen name="Lembretes" component={LembretesScreen} options={{ headerShown: true, title: 'Lembretes' }} />
        <Stack.Screen name="Notas" component={NotasScreen} options={{ headerShown: true, title: 'Notas e Desempenho' }} />
        <Stack.Screen name="Metas" component={MetasScreen} options={{ headerShown: true, title: 'Metas de Estudo' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
