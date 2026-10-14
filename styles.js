import { StyleSheet } from 'react-native';

export const colors = {
  background: '#F5F1E8',
  surface: '#FFFFFF',
  olive: '#6B7A3A',
  tan: '#B89B72',
  text: '#2B2B2B',
  textSecondary: '#8A8578',
  border: '#E0D9C8',
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: colors.text },
  subtitulo: { fontSize: 15, color: colors.textSecondary, marginBottom: 24 },
  secaoTitulo: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
  saudacao: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  emailUsuario: { fontSize: 13, color: colors.textSecondary },
  sair: { fontSize: 15, color: colors.olive, fontWeight: '600' },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 12 },
  botao: { backgroundColor: colors.olive, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  botaoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  link: { color: colors.olive, textAlign: 'center', marginTop: 16, fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardTitulo: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardDescricao: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardTipo: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  formAgenda: { marginBottom: 16 },
  dataBox: { backgroundColor: colors.olive, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginRight: 12 },
  erro: { color: '#B3261E', fontSize: 13, marginBottom: 12 },
  feita: { textDecorationLine: 'line-through', opacity: 0.5 },
  dataTexto: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
});
