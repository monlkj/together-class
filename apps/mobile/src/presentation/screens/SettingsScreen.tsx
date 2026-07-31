import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/designSystem';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@dahamkke/shared';

interface Props {
  user: { name: string; email: string; role: 'student' | 'teacher' };
  selectedLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<Props> = ({
  user,
  selectedLang,
  onSelectLang,
  onBack,
  onLogout,
}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← 메인으로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ 설정 및 프로필 (Settings)</Text>
      </View>

      {/* User Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>내 계정 정보</Text>
        <Text style={styles.infoLabel}>이름: <Text style={styles.infoVal}>{user.name}</Text></Text>
        <Text style={styles.infoLabel}>이메일: <Text style={styles.infoVal}>{user.email}</Text></Text>
        <Text style={styles.infoLabel}>역할: <Text style={styles.infoVal}>{user.role === 'teacher' ? '교사' : '학생'}</Text></Text>
      </View>

      {/* Language Preferences */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>모국어 / 기본 언어 설정</Text>
        <View style={styles.langGrid}>
          {Object.values(SUPPORTED_LANGUAGES).map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langChip, selectedLang === l.code && styles.langChipActive]}
              onPress={() => onSelectLang(l.code)}
            >
              <Text style={styles.langText}>{l.flagEmoji} {l.nameNative} ({l.nameKo})</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Security & Privacy */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🔒 개인정보 및 데이터 보안</Text>
        <Text style={styles.privacyDesc}>
          · 모든 AI 호출은 백엔드 프록시 서버를 통해 암호화 전달됩니다.{'\n'}
          · 개인정보 및 음성/이미지 기록은 동의 후 안전하게 본인 계정에만 저장됩니다 (RLS 정책 적용).
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>로그아웃 (Log out)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: { paddingRight: 12 },
  backText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  infoLabel: { fontSize: 13, color: COLORS.textSub, marginBottom: 4 },
  infoVal: { color: COLORS.text, fontWeight: 'bold' },
  langGrid: { gap: 6 },
  langChip: { padding: 10, borderRadius: 10, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  langChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  langText: { fontSize: 13, fontWeight: '600' },
  privacyDesc: { fontSize: 12, color: COLORS.textSub, lineHeight: 18 },
  logoutBtn: { backgroundColor: COLORS.error, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  logoutBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});
