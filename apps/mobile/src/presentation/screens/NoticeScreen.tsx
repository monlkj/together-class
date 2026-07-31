import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/designSystem';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@dahamkke/shared';
import { EdgeApiClient } from '../../infrastructure/apiClient';

interface Props {
  selectedLang: LanguageCode;
  onBack: () => void;
}

export const NoticeScreen: React.FC<Props> = ({ selectedLang, onBack }) => {
  const [noticeData, setNoticeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const api = new EdgeApiClient();

  const handleProcessNotice = async () => {
    setIsLoading(true);
    const res = await api.translateNotice({ targetLangs: ['ru', 'zh', 'vi', 'uz', 'kk', 'ko'] });
    setNoticeData(res);
    setIsLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📄 가정통신문 번역 (F7)</Text>
      </View>

      <Text style={styles.subText}>가정통신문 사진/PDF 업로드 후 다국어 요약 및 열람 QR을 생성합니다.</Text>

      {/* Upload Zone */}
      <View style={styles.uploadZone}>
        <Text style={styles.uploadIcon}>📑</Text>
        <Text style={styles.uploadTitle}>학교 가정통신문 사진/PDF 선택</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleProcessNotice} disabled={isLoading}>
          <Text style={styles.uploadBtnText}>{isLoading ? '분석 및 다국어 번역 중...' : '가정통신문 분석 및 번역'}</Text>
        </TouchableOpacity>
      </View>

      {noticeData && (
        <View style={styles.resultContainer}>
          {/* Key Summary Cards */}
          <Text style={styles.summaryTitle}>📌 학부모용 핵심 요약 (Key Summary)</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>📌 제목</Text>
              <Text style={styles.summaryVal}>{noticeData.summary.title}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>📅 일시</Text>
              <Text style={styles.summaryVal}>{noticeData.summary.date}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>🎒 준비물</Text>
              <Text style={styles.summaryVal}>{noticeData.summary.itemsToBring}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>⏳ 제출 기한</Text>
              <Text style={styles.summaryVal}>{noticeData.summary.dueDate}</Text>
            </View>
          </View>

          {/* Multilingual Full Text */}
          <Text style={styles.summaryTitle}>🌐 선택 언어({SUPPORTED_LANGUAGES[selectedLang].nameKo}) 번역문</Text>
          <View style={styles.transBox}>
            <Text style={styles.transText}>
              {noticeData.translations[selectedLang] || noticeData.translations['ko']}
            </Text>
          </View>

          {/* QR Share Button */}
          <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQR(!showQR)}>
            <Text style={styles.qrBtnText}>📱 학부모 열람용 QR / 공유 링크 생성</Text>
          </TouchableOpacity>

          {showQR && (
            <View style={styles.qrModalBox}>
              <Text style={styles.qrIcon}>📱 [QR CODE]</Text>
              <Text style={styles.qrText}>학부모 스마트폰 카메라로 스캔하면 모국어로 열람할 수 있습니다.</Text>
              <Text style={styles.qrLink}>https://dahamkke.app/notice/share?id=notice_20261015</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  backBtn: { paddingRight: 12 },
  backText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  subText: { fontSize: 12, color: COLORS.textSub, marginBottom: 16 },
  uploadZone: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  uploadIcon: { fontSize: 36, marginBottom: 6 },
  uploadTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  uploadBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  uploadBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  resultContainer: { marginBottom: 30 },
  summaryTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  summaryGrid: { backgroundColor: '#FEF3C7', padding: 14, borderRadius: 14, gap: 8, marginBottom: 16 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryIcon: { fontSize: 12, fontWeight: 'bold', color: '#92400E' },
  summaryVal: { fontSize: 12, fontWeight: 'bold', color: '#78350F' },
  transBox: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  transText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  qrBtn: { backgroundColor: COLORS.secondary, padding: 12, borderRadius: 12, alignItems: 'center' },
  qrBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  qrModalBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: COLORS.primary },
  qrIcon: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginBottom: 6 },
  qrText: { fontSize: 12, color: COLORS.textSub, textAlign: 'center', marginBottom: 6 },
  qrLink: { fontSize: 11, color: COLORS.primaryDark, textDecorationLine: 'underline' },
});
