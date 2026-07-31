import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/designSystem';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@dahamkke/shared';
import { EdgeApiClient } from '../../infrastructure/apiClient';

interface Props {
  selectedLang: LanguageCode;
  onBack: () => void;
}

interface ChatLog {
  id: string;
  speaker: 'ko' | 'user';
  original: string;
  translated: string;
}

export const InterpretScreen: React.FC<Props> = ({ selectedLang, onBack }) => {
  const [logs, setLogs] = useState<ChatLog[]>([
    {
      id: '1',
      speaker: 'ko',
      original: '안녕하세요! 토의에 참여해 주셔서 감사합니다.',
      translated: SUPPORTED_LANGUAGES[selectedLang].code === 'ru' ? 'Здравствуйте! Спасибо за участие в дискуссии.' : 'Hello! Thank you for joining debate.',
    },
  ]);
  const [isRecording, setIsRecording] = useState<'ko' | 'user' | null>(null);

  const api = new EdgeApiClient();

  const handleSpeak = async (speaker: 'ko' | 'user') => {
    setIsRecording(speaker);
    setTimeout(async () => {
      const fromLang = speaker === 'ko' ? 'ko' : selectedLang;
      const toLang = speaker === 'ko' ? selectedLang : 'ko';

      const sampleSpeech = speaker === 'ko' 
        ? '저는 흥부의 마음씨가 따뜻하다고 생각합니다.'
        : 'Я тоже так считаю. Мы должны помогать другим.';

      const res = await api.interpret({ text: sampleSpeech, fromLang, toLang });
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          speaker,
          original: res.sourceText,
          translated: res.resultText,
        },
      ]);
      setIsRecording(null);
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎙️ 실시간 음성 통역 (F2)</Text>
      </View>

      <Text style={styles.subTitle}>
        한국어 짝 ↔ 내 언어({SUPPORTED_LANGUAGES[selectedLang].nameKo}) 순차 통역
      </Text>

      {/* Chat Logs */}
      <ScrollView style={styles.logList} contentContainerStyle={{ paddingVertical: 10 }}>
        {logs.map((item) => (
          <View
            key={item.id}
            style={[
              styles.bubble,
              item.speaker === 'ko' ? styles.bubbleLeft : styles.bubbleRight,
            ]}
          >
            <Text style={styles.speakerTag}>
              {item.speaker === 'ko' ? '🇰🇷 한국어 학생' : `${SUPPORTED_LANGUAGES[selectedLang].flagEmoji} 내 언어 학생`}
            </Text>
            <Text style={styles.originalText}>{item.original}</Text>
            <Text style={styles.transText}>➡️ {item.translated}</Text>
            <TouchableOpacity style={styles.ttsBtn} onPress={() => alert('음성 재생(TTS)')}>
              <Text style={styles.ttsIcon}>🔊 음성 다시 듣기</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Big Dual Mic Buttons */}
      <View style={styles.micBar}>
        <TouchableOpacity
          style={[styles.micBtn, styles.micBtnKo, isRecording === 'ko' && styles.recordingPulse]}
          onPress={() => handleSpeak('ko')}
        >
          <Text style={styles.micEmoji}>🎙️</Text>
          <Text style={styles.micLabel}>{isRecording === 'ko' ? '듣는 중...' : '한국어 말하기'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.micBtn, styles.micBtnUser, isRecording === 'user' && styles.recordingPulse]}
          onPress={() => handleSpeak('user')}
        >
          <Text style={styles.micEmoji}>🎤</Text>
          <Text style={styles.micLabel}>
            {isRecording === 'user' ? '듣는 중...' : `${SUPPORTED_LANGUAGES[selectedLang].flagEmoji} 내 언어 말하기`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  backBtn: { paddingRight: 12 },
  backText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  subTitle: { fontSize: 12, color: COLORS.textSub, marginBottom: 12 },
  logList: { flex: 1, marginBottom: 16 },
  bubble: { padding: 12, borderRadius: 14, marginBottom: 10, maxWidth: '85%' },
  bubbleLeft: { backgroundColor: '#E0F2FE', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  bubbleRight: { backgroundColor: '#CCFBF1', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  speakerTag: { fontSize: 11, fontWeight: 'bold', color: COLORS.textSub, marginBottom: 4 },
  originalText: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  transText: { fontSize: 13, color: COLORS.primaryDark, marginTop: 4 },
  ttsBtn: { marginTop: 6, alignSelf: 'flex-start' },
  ttsIcon: { fontSize: 11, color: COLORS.textSub, fontWeight: 'bold' },
  micBar: { flexDirection: 'row', gap: 12, justifyContent: 'center', paddingBottom: 10 },
  micBtn: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  micBtnKo: { backgroundColor: '#3B82F6' },
  micBtnUser: { backgroundColor: COLORS.primary },
  micEmoji: { fontSize: 28, color: '#FFF' },
  micLabel: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  recordingPulse: { opacity: 0.6, borderWidth: 3, borderColor: COLORS.accent },
});
