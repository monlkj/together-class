import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/designSystem';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@dahamkke/shared';
import { EdgeApiClient } from '../../infrastructure/apiClient';

interface Props {
  selectedLang: LanguageCode;
  onBack: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  textKo: string;
  textUser?: string;
}

export const DebateScreen: React.FC<Props> = ({ selectedLang, onBack }) => {
  const [topic, setTopic] = useState('흥부전: 흥부의 행동은 옳았는가?');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      textKo: '안녕! 나는 AI 토론 친구 민준이야. 흥부가 형 놀부에게 쫓겨나면서도 원망하지 않은 것은 올바른 행동이었을까?',
      textUser: SUPPORTED_LANGUAGES[selectedLang].code === 'ru'
        ? 'Привет! Я твоя подруга по дискуссиям. Правильно ли поступил Хынбу?'
        : 'Hello! I am your AI debate partner.',
    },
  ]);

  const api = new EdgeApiClient();

  const handleSendMessage = async (textToSend?: string) => {
    const msg = textToSend || inputText;
    if (!msg.trim()) return;

    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', textKo: msg, textUser: msg },
    ]);
    setInputText('');

    const res = await api.debate({
      topic,
      message: msg,
      userLang: selectedLang,
      history: [],
    });

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        textKo: res.replyKo,
        textUser: res.replyUser,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 AI 토론 친구 (F3)</Text>
      </View>

      {/* Topic Card */}
      <View style={styles.topicBox}>
        <Text style={styles.topicLabel}>📌 토론 주제</Text>
        <Text style={styles.topicText}>{topic}</Text>
      </View>

      {/* ChatThread */}
      <ScrollView style={styles.chatThread}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.msgBox, m.sender === 'user' ? styles.msgUser : styles.msgAi]}>
            <Text style={styles.senderTitle}>{m.sender === 'ai' ? '👦 AI 친구 민준' : '🎒 나 (Student)'}</Text>
            <Text style={styles.msgKo}>{m.textKo}</Text>
            {m.textUser && m.textUser !== m.textKo && (
              <Text style={styles.msgTrans}>({m.textUser})</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Suggested Quick Replies */}
      <View style={styles.suggestRow}>
        <TouchableOpacity style={styles.suggestChip} onPress={() => handleSendMessage('흥부는 형제애를 중요하게 생각했어.')}>
          <Text style={styles.suggestText}>"흥부는 형제애를 강조했어"</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.suggestChip} onPress={() => handleSendMessage('놀부의 행동을 그냥 참는 건 무조건 옳지 않아.')}>
          <Text style={styles.suggestText}>"무작정 참는 건 안 좋아"</Text>
        </TouchableOpacity>
      </View>

      {/* Input Field */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="토론 의견을 적어보세요..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSendMessage()}>
          <Text style={styles.sendBtnText}>전송</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backBtn: { paddingRight: 12 },
  backText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  topicBox: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.accent },
  topicLabel: { fontSize: 11, fontWeight: 'bold', color: '#B45309' },
  topicText: { fontSize: 14, fontWeight: 'bold', color: '#78350F', marginTop: 2 },
  chatThread: { flex: 1, marginBottom: 10 },
  msgBox: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '85%' },
  msgAi: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
  msgUser: { backgroundColor: COLORS.primaryLight, alignSelf: 'flex-end' },
  senderTitle: { fontSize: 11, fontWeight: 'bold', color: COLORS.textSub, marginBottom: 2 },
  msgKo: { fontSize: 14, color: COLORS.text },
  msgTrans: { fontSize: 12, color: COLORS.primaryDark, marginTop: 4, fontStyle: 'italic' },
  suggestRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  suggestChip: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  suggestText: { fontSize: 11, color: '#0369A1', fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, fontSize: 14 },
  sendBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12 },
  sendBtnText: { color: '#FFF', fontWeight: 'bold' },
});
