import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, DAMI_MASCOT } from '../theme/designSystem';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@dahamkke/shared';

interface Props {
  user: { name: string; email: string; role: 'student' | 'teacher' };
  selectedLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export const MainScreen: React.FC<Props> = ({
  user,
  selectedLang,
  onSelectLang,
  onNavigate,
  onLogout,
}) => {
  const currentLangInfo = SUPPORTED_LANGUAGES[selectedLang];

  return (
    <ScrollView style={styles.container}>
      {/* Top Banner */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.greeting}>환영합니다, {user.name}님!</Text>
          <Text style={styles.roleBadge}>{user.role === 'teacher' ? '👨‍🏫 교사 (Teacher)' : '🎒 학생 (Student)'}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => onNavigate('settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Language Bar Selector */}
      <View style={styles.langSelectorCard}>
        <Text style={styles.sectionTitle}>현재 학습/표시 언어</Text>
        <View style={styles.langChips}>
          {Object.values(SUPPORTED_LANGUAGES).map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langChip, selectedLang === l.code && styles.langChipActive]}
              onPress={() => onSelectLang(l.code)}
            >
              <Text style={styles.langChipText}>{l.flagEmoji} {l.nameNative}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Feature Grid (2 large top, 4 lower) */}
      <Text style={styles.gridHeader}>주요 교육 기능 (Key Features)</Text>
      
      <View style={styles.topFeatures}>
        <TouchableOpacity style={[styles.largeCard, { backgroundColor: '#E6FFFA' }]} onPress={() => onNavigate('translate')}>
          <Text style={styles.cardEmoji}>📸</Text>
          <Text style={styles.cardTitle}>교과서 OCR 번역</Text>
          <Text style={styles.cardDesc}>카메라 촬영 텍스트 번역 (F1)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.largeCard, { backgroundColor: '#FFF5F5' }]} onPress={() => onNavigate('interpret')}>
          <Text style={styles.cardEmoji}>🎙️</Text>
          <Text style={styles.cardTitle}>실시간 음성 통역</Text>
          <Text style={styles.cardDesc}>수업 토의/토론 실시간 통역 (F2)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subGrid}>
        <TouchableOpacity style={styles.smallCard} onPress={() => onNavigate('debate')}>
          <Text style={styles.smallEmoji}>💬</Text>
          <Text style={styles.smallTitle}>토론 친구 AI</Text>
          <Text style={styles.smallDesc}>가상 한국인 학생 (F3)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallCard} onPress={() => onNavigate('persona')}>
          <Text style={styles.smallEmoji}>🎭</Text>
          <Text style={styles.smallTitle}>인물 인터뷰</Text>
          <Text style={styles.smallDesc}>교과서 페르소나 (F4/F5)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallCard} onPress={() => onNavigate('notice')}>
          <Text style={styles.smallEmoji}>📄</Text>
          <Text style={styles.smallTitle}>가정통신문 번역</Text>
          <Text style={styles.smallDesc}>요약 및 QR 공유 (F7)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallCard} onPress={() => onNavigate('records')}>
          <Text style={styles.smallEmoji}>📊</Text>
          <Text style={styles.smallTitle}>학습 기록</Text>
          <Text style={styles.smallDesc}>번역/대화 모아보기 (F6)</Text>
        </TouchableOpacity>
      </View>

      {/* Teacher Only Section */}
      {user.role === 'teacher' && (
        <View style={styles.teacherAdminBox}>
          <Text style={styles.teacherAdminTitle}>👨‍🏫 교사 전용 관리 (Teacher Console)</Text>
          <View style={styles.teacherBtnRow}>
            <TouchableOpacity style={styles.teacherBtn} onPress={() => onNavigate('textbookIngest')}>
              <Text style={styles.teacherBtnText}>📚 교과서 RAG 색인</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.teacherBtn} onPress={() => onNavigate('personaAdmin')}>
              <Text style={styles.teacherBtnText}>🎭 페르소나 등록</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Mascot Footer */}
      <View style={styles.mascotBanner}>
        <Text style={styles.mascotBannerIcon}>{DAMI_MASCOT.icon}</Text>
        <Text style={styles.mascotBannerText}>
          다미 로봇이 언제나 곁에서 {currentLangInfo.nameKo}({currentLangInfo.flagEmoji}) 학습을 도울게요!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  roleBadge: { fontSize: 13, color: COLORS.primaryDark, marginTop: 2, fontWeight: '600' },
  settingsBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  settingsIcon: { fontSize: 18 },
  langSelectorCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 14, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.textSub, marginBottom: 8 },
  langChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  langChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.background },
  langChipActive: { backgroundColor: COLORS.primary, color: '#FFF' },
  langChipText: { fontSize: 12, fontWeight: 'bold' },
  gridHeader: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  topFeatures: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  largeCard: { flex: 1, padding: 16, borderRadius: 16, borderLeftWidth: 5, borderLeftColor: COLORS.primary },
  cardEmoji: { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  cardDesc: { fontSize: 11, color: COLORS.textSub, marginTop: 4 },
  subGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  smallCard: { width: '48%', backgroundColor: '#FFF', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  smallEmoji: { fontSize: 24, marginBottom: 6 },
  smallTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  smallDesc: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
  teacherAdminBox: { backgroundColor: '#FEF3C7', padding: 14, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.accent },
  teacherAdminTitle: { fontSize: 14, fontWeight: 'bold', color: '#92400E', marginBottom: 10 },
  teacherBtnRow: { flexDirection: 'row', gap: 10 },
  teacherBtn: { flex: 1, backgroundColor: '#FFF', padding: 10, borderRadius: 10, alignItems: 'center' },
  teacherBtnText: { fontSize: 12, fontWeight: 'bold', color: '#B45309' },
  mascotBanner: { backgroundColor: '#FFF', padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40 },
  mascotBannerIcon: { fontSize: 28 },
  mascotBannerText: { fontSize: 12, color: COLORS.text, flex: 1 },
});
