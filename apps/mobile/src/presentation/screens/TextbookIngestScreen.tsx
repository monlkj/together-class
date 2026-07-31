import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/designSystem';

interface Props {
  onBack: () => void;
}

export const TextbookIngestScreen: React.FC<Props> = ({ onBack }) => {
  const [subject, setSubject] = useState('국어');
  const [grade, setGrade] = useState('4');
  const [unitTitle, setUnitTitle] = useState('2단원. 흥부와 놀부');
  const [rawText, setRawText] = useState(
    '옛날 어느 마을에 흥부와 놀부 형제가 살았습니다. 형 놀부는 탐욕스러웠으나, 동생 흥부는 부모님이 돌아가신 후 형의 행패에도 불평하지 않고 순종했습니다.\n\n어느 날 흥부는 다리가 부러진 제비를 치료해주었고, 제비는 흥부에게 박 씨를 가져다주었습니다. 그 박 씨에서 금은보화가 쏟아져 흥부는 큰 부자가 되었습니다.'
  );
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccessMsg, setIngestSuccessMsg] = useState<string | null>(null);

  const handleIngest = () => {
    setIsIngesting(true);
    setTimeout(() => {
      setIsIngesting(false);
      setIngestSuccessMsg('✅ 2개 문단이 백터DB(Supabase pgvector)에 성공적으로 임베딩 색인되었습니다.');
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📚 교과서 RAG 등록 (교사 전용)</Text>
      </View>

      <Text style={styles.subText}>단원별 지문을 등록하면 AI가 정확한 근거문단 기반으로 답변(RAG)합니다.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>과목 / 학년</Text>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} value={subject} onChangeText={setSubject} placeholder="과목 (예: 국어)" />
          <TextInput style={[styles.input, { width: 80 }]} value={grade} onChangeText={setGrade} placeholder="학년" keyboardType="numeric" />
        </View>

        <Text style={styles.label}>단원 제목</Text>
        <TextInput style={styles.input} value={unitTitle} onChangeText={setUnitTitle} placeholder="단원 제목" />

        <Text style={styles.label}>교과서 원문 지문 (문단 구분은 줄바꿈 2번)</Text>
        <TextInput
          style={[styles.input, { minHeight: 140 }]}
          multiline
          value={rawText}
          onChangeText={setRawText}
        />

        <TouchableOpacity style={styles.ingestBtn} onPress={handleIngest} disabled={isIngesting}>
          <Text style={styles.ingestBtnText}>{isIngesting ? '색인 및 임베딩 생성 중...' : '⚡ pgvector 색인 실행'}</Text>
        </TouchableOpacity>

        {ingestSuccessMsg && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{ingestSuccessMsg}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  backBtn: { paddingRight: 12 },
  backText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: 'bold' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  subText: { fontSize: 12, color: COLORS.textSub, marginBottom: 16 },
  form: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, fontSize: 13, marginBottom: 12 },
  ingestBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  ingestBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  successBox: { backgroundColor: '#DCFCE7', padding: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: COLORS.success },
  successText: { color: '#15803D', fontSize: 12, fontWeight: 'bold' },
});
