import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { COLORS, DAMI_MASCOT } from '../theme/designSystem';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@dahamkke/shared';
import { EdgeApiClient } from '../../infrastructure/apiClient';

interface Props {
  selectedLang: LanguageCode;
  onBack: () => void;
}

export const TranslateScreen: React.FC<Props> = ({ selectedLang, onBack }) => {
  const [extractedText, setExtractedText] = useState(
    '흥부는 마음씨가 착하여 부모님이 돌아가신 후 형 놀부의 행패에도 원망하지 않고 착하게 살았습니다.'
  );
  const [targetLang, setTargetLang] = useState<LanguageCode>(selectedLang);
  const [translatedResult, setTranslatedResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const api = new EdgeApiClient();

  const handleRunTranslate = async () => {
    setIsLoading(true);
    const res = await api.translate({ text: extractedText, targetLang });
    setTranslatedResult(res.resultText);
    setIsLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📸 교과서 OCR 번역 (F1)</Text>
      </View>

      {/* Camera / Image Pick Simulation */}
      <View style={styles.cameraBox}>
        <Text style={styles.cameraIcon}>📷</Text>
        <Text style={styles.cameraText}>교과서 페이지 촬영 또는 이미지 선택</Text>
        <View style={styles.cameraBtnRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>사진 촬영</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}>
            <Text style={styles.actionBtnText}>갤러리 업로드</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Extracted Text (Editable) */}
      <Text style={styles.sectionLabel}>1. 추출된 한국어 원문 (수정 가능)</Text>
      <TextInput
        style={styles.textInput}
        multiline
        value={extractedText}
        onChangeText={setExtractedText}
      />

      {/* Target Language Selection */}
      <Text style={styles.sectionLabel}>2. 번역할 모국어 선택</Text>
      <View style={styles.langGrid}>
        {Object.values(SUPPORTED_LANGUAGES).map((l) => (
          <TouchableOpacity
            key={l.code}
            style={[styles.langChip, targetLang === l.code && styles.langChipActive]}
            onPress={() => setTargetLang(l.code)}
          >
            <Text style={styles.langChipText}>{l.flagEmoji} {l.nameNative}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Execute Button */}
      <TouchableOpacity style={styles.translateBtn} onPress={handleRunTranslate} disabled={isLoading}>
        <Text style={styles.translateBtnText}>{isLoading ? '번역 실행 중...' : '✨ AI 번역하기'}</Text>
      </TouchableOpacity>

      {/* Result Display (Original & Translation Stacked Card) */}
      {translatedResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultBoxTitle}>✨ 번역 결과 (원문/번역 병렬)</Text>
          
          <View style={styles.cardKo}>
            <Text style={styles.cardTag}>🇰🇷 한국어 원문</Text>
            <Text style={styles.cardContent}>{extractedText}</Text>
          </View>

          <View style={styles.cardTrans}>
            <Text style={styles.cardTag}>{SUPPORTED_LANGUAGES[targetLang].flagEmoji} {SUPPORTED_LANGUAGES[targetLang].nameKo} 번역</Text>
            <Text style={styles.cardContent}>{translatedResult}</Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={() => alert('학습 기록에 저장되었습니다!')}>
            <Text style={styles.saveBtnText}>⭐ 학습 기록 저장</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { paddingRight: 12 },
  backText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  cameraBox: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', marginBottom: 16 },
  cameraIcon: { fontSize: 40, marginBottom: 6 },
  cameraText: { fontSize: 13, color: COLORS.textSub, marginBottom: 12 },
  cameraBtnRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 6, marginTop: 4 },
  textInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 70, marginBottom: 14 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  langChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border },
  langChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  langChipText: { fontSize: 12, fontWeight: '600' },
  translateBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  translateBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  resultBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: COLORS.primaryLight },
  resultBoxTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 12 },
  cardKo: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, marginBottom: 10 },
  cardTrans: { backgroundColor: '#CCFBF1', padding: 12, borderRadius: 10, marginBottom: 12 },
  cardTag: { fontSize: 11, fontWeight: 'bold', color: COLORS.textSub, marginBottom: 4 },
  cardContent: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  saveBtn: { backgroundColor: COLORS.secondary, padding: 10, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
});
