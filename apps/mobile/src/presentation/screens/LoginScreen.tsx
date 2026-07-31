import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, DAMI_MASCOT } from '../theme/designSystem';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@dahamkke/shared';

interface Props {
  onLoginSuccess: (user: { name: string; email: string; role: 'student' | 'teacher' }) => void;
  onNavigateSignUp: () => void;
  selectedLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
}

export const LoginScreen: React.FC<Props> = ({
  onLoginSuccess,
  onNavigateSignUp,
  selectedLang,
  onSelectLang,
}) => {
  const [email, setEmail] = useState('student@school.es.kr');
  const [password, setPassword] = useState('password123');

  const handleLogin = () => {
    const isTeacher = email.includes('teacher');
    onLoginSuccess({
      name: isTeacher ? '김선생님 (Teacher)' : '이서준 (Seojun)',
      email,
      role: isTeacher ? 'teacher' : 'student',
    });
  };

  return (
    <View style={styles.container}>
      {/* Language Bar */}
      <View style={styles.langBar}>
        {Object.values(SUPPORTED_LANGUAGES).map((l) => (
          <TouchableOpacity
            key={l.code}
            style={[styles.langChip, selectedLang === l.code && styles.langChipActive]}
            onPress={() => onSelectLang(l.code)}
          >
            <Text style={styles.langText}>{l.flagEmoji} {l.code.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mascot & Header */}
      <View style={styles.header}>
        <Text style={styles.mascotIcon}>{DAMI_MASCOT.icon}</Text>
        <Text style={styles.title}>다함께 교실</Text>
        <Text style={styles.subtitle}>{DAMI_MASCOT.tagline}</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>이메일 / Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@school.es.kr"
          autoCapitalize="none"
        />

        <Text style={styles.label}>비밀번호 / Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>로그인 / Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signupBtn} onPress={onNavigateSignUp}>
          <Text style={styles.signupBtnText}>회원가입 / Sign up</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>교사 계정 테스트: teacher@school.es.kr</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, justifyContent: 'center' },
  langBar: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 6 },
  langChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.border },
  langChipActive: { backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary },
  langText: { fontSize: 12, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 30 },
  mascotIcon: { fontSize: 60, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSub, marginTop: 4 },
  form: { backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 14 },
  loginBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  signupBtn: { backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  signupBtnText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: 'bold' },
  helpText: { textAlign: 'center', fontSize: 12, color: COLORS.textSub },
});
