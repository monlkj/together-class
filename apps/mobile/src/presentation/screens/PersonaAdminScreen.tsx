import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/designSystem';

interface Props {
  onBack: () => void;
}

export const PersonaAdminScreen: React.FC<Props> = ({ onBack }) => {
  const [charName, setCharName] = useState('흥부');
  const [prompt, setPrompt] = useState(
    '너는 초등학교 국어 교과서 속 인물 흥부야. 1인칭("나")으로 어린 학생들의 눈높이에 맞추어 친절하게 대답해줘. 교과서에 없는 내용은 상상이라고 솔직히 밝히렴.'
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎭 페르소나 설정 (교사 전용)</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>인물 캐릭터 이름</Text>
        <TextInput style={styles.input} value={charName} onChangeText={setCharName} placeholder="인물 이름" />

        <Text style={styles.label}>시스템 프롬프트 (성격, 시대, 말투 제약)</Text>
        <TextInput
          style={[styles.input, { minHeight: 120 }]}
          multiline
          value={prompt}
          onChangeText={setPrompt}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={() => alert('페르소나 설정이 저장되었습니다!')}>
          <Text style={styles.saveBtnText}>💾 페르소나 저장</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: { paddingRight: 12 },
  backText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: 'bold' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  form: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, fontSize: 13, marginBottom: 14 },
  saveBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
