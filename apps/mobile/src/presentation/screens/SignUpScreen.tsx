import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/designSystem';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@dahamkke/shared';

interface Props {
  onSignUpSuccess: () => void;
  onNavigateLogin: () => void;
}

export const SignUpScreen: React.FC<Props> = ({ onSignUpSuccess, onNavigateLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nativeLang, setNativeLang] = useState<LanguageCode>('ru');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>회원가입 / Sign Up</Text>
      <Text style={styles.subtitle}>다함께 교실 학습 생태계에 모국어를 선택하고 가입하세요.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>이름 / Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="이서준 (Seojun)" />

        <Text style={styles.label}>이메일 / Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="student@school.es.kr" keyboardType="email-address" />

        <Text style={styles.label}>비밀번호 / Password (8자 이상)</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

        <Text style={styles.label}>모국어 선택 / Native Language</Text>
        <View style={styles.langGrid}>
          {Object.values(SUPPORTED_LANGUAGES).map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langOption, nativeLang === l.code && styles.langOptionActive]}
              onPress={() => setNativeLang(l.code)}
            >
              <Text style={styles.langOptionText}>{l.flagEmoji} {l.nameNative} ({l.nameKo})</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={onSignUpSuccess}>
          <Text style={styles.submitBtnText}>가입하기 / Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={onNavigateLogin}>
          <Text style={styles.backBtnText}>이미 계정이 있으신가요? 로그인</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: COLORS.background, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textSub, textAlign: 'center', marginBottom: 20, marginTop: 4 },
  form: { backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 14 },
  langGrid: { gap: 8, marginBottom: 20 },
  langOption: { borderWidth: 1, borderColor: COLORS.border, padding: 10, borderRadius: 10, backgroundColor: '#FAFAFA' },
  langOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  langOptionText: { fontSize: 13, fontWeight: '600' },
  submitBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  backBtn: { alignItems: 'center', padding: 8 },
  backBtnText: { color: COLORS.primaryDark, fontSize: 13 },
});
