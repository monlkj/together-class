import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/designSystem';

interface Props {
  record: any;
  onBack: () => void;
}

export const RecordDetailScreen: React.FC<Props> = ({ record, onBack }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← 목록으로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기록 상세보기</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.typeBadge}>{record?.type || '학습 기록'}</Text>
        <Text style={styles.dateText}>저장 일시: {record?.date || '2026-07-25'}</Text>
        <Text style={styles.langText}>언어: {record?.lang || 'RU'}</Text>

        <Text style={styles.sectionTitle}>원문 / 내용</Text>
        <Text style={styles.bodyContent}>{record?.preview || '상세 내용 미리보기 데이터입니다.'}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => alert('음성 다시 듣기(TTS)')}>
            <Text style={styles.actionBtnText}>🔊 음성 듣기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.error }]} onPress={onBack}>
            <Text style={styles.actionBtnText}>🗑️ 기록 삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: { paddingRight: 12 },
  backText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  typeBadge: { fontSize: 14, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 4 },
  dateText: { fontSize: 12, color: COLORS.textSub, marginBottom: 2 },
  langText: { fontSize: 12, color: COLORS.textSub, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  bodyContent: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});
