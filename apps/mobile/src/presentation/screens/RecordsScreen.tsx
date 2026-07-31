import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { COLORS, DAMI_MASCOT } from '../theme/designSystem';

interface Props {
  onBack: () => void;
  onSelectRecord: (record: any) => void;
}

export const RecordsScreen: React.FC<Props> = ({ onBack, onSelectRecord }) => {
  const [activeTab, setActiveTab] = useState<'trans' | 'dialog'>('trans');

  const transRecords = [
    { id: 't1', type: '교과서 OCR 번역', preview: '흥부는 마음씨가 착하여...', date: '2026-07-25', lang: 'RU' },
    { id: 't2', type: '가정통신문 번역', preview: '2026학년도 현장체험학습...', date: '2026-07-24', lang: 'ZH' },
  ];

  const dialogRecords = [
    { id: 'd1', type: 'AI 토론 친구', preview: '흥부전: 흥부의 행동은 옳았는가?', date: '2026-07-25', lang: 'VI' },
    { id: 'd2', type: '인물 인터뷰 (흥부)', preview: '제비 다리는 왜 고쳐주었나요?', date: '2026-07-23', lang: 'UZ' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 학습 기록 저장소 (F6)</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trans' && styles.tabActive]}
          onPress={() => setActiveTab('trans')}
        >
          <Text style={[styles.tabText, activeTab === 'trans' && styles.tabTextActive]}>번역 기록</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'dialog' && styles.tabActive]}
          onPress={() => setActiveTab('dialog')}
        >
          <Text style={[styles.tabText, activeTab === 'dialog' && styles.tabTextActive]}>대화/토론 기록</Text>
        </TouchableOpacity>
      </View>

      {/* Record List */}
      <FlatList
        data={activeTab === 'trans' ? transRecords : dialogRecords}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.recordCard} onPress={() => onSelectRecord(item)}>
            <View style={styles.cardHead}>
              <Text style={styles.typeBadge}>{item.type}</Text>
              <Text style={styles.langBadge}>{item.lang}</Text>
            </View>
            <Text style={styles.previewText}>{item.preview}</Text>
            <Text style={styles.dateText}>{item.date}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Review Floating Help Button */}
      <TouchableOpacity style={styles.reviewHelpBtn} onPress={() => alert('AI가 저장된 기록을 바탕으로 복습 어휘 5개를 추천합니다!')}>
        <Text style={styles.reviewHelpText}>💡 AI 맞춤 복습 도움 받기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { paddingRight: 12 },
  backText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  tabRow: { flexDirection: 'row', marginBottom: 14, backgroundColor: '#FFF', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: COLORS.primaryLight },
  tabText: { fontSize: 13, fontWeight: 'bold', color: COLORS.textSub },
  tabTextActive: { color: COLORS.primaryDark },
  recordCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  typeBadge: { fontSize: 11, fontWeight: 'bold', color: COLORS.primaryDark },
  langBadge: { fontSize: 10, fontWeight: 'bold', backgroundColor: COLORS.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  previewText: { fontSize: 13, color: COLORS.text, marginBottom: 6 },
  dateText: { fontSize: 11, color: COLORS.textSub },
  reviewHelpBtn: { backgroundColor: COLORS.accent, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  reviewHelpText: { color: '#78350F', fontSize: 13, fontWeight: 'bold' },
});
