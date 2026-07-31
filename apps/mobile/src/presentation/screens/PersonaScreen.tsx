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
  sender: 'persona' | 'user';
  textKo: string;
  textUser?: string;
  sources?: string[];
}

export const PersonaScreen: React.FC<Props> = ({ selectedLang, onBack }) => {
  const [character, setCharacter] = useState('흥부');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'persona',
      textKo: '허허, 반갑네! 나는 교과서 속 인물 흥부라네. 나에게 궁금한 것이 있다면 무엇이든 물어보게나!',
      textUser: SUPPORTED_LANGUAGES[selectedLang].code === 'ru'
        ? 'Здравствуйте! Я Хынбу из учебника. Спросите меня о чем угодно!'
        : 'Hello! I am Heungbu from your textbook.',
      sources: ['국어 4학년 1학기 2단원 (흥부와 놀부)'],
    },
  ]);

  const api = new EdgeApiClient();

  const handleAsk = async (textToSend?: string) => {
    const question = textToSend || inputText;
    if (!question.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', textKo: question, textUser: question },
    ]);
    setInputText('');

    const res = await api.askPersona({
      personaId: 'p1',
      characterName: character,
      question,
      userLang: selectedLang,
      history: [],
    });

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        sender: 'persona',
        textKo: res.answerKo,
        textUser: res.answerTranslated,
        sources: res.sources,
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
        <Text style={styles.headerTitle}>🎭 교과서 인물 인터뷰 & RAG (F4/F5)</Text>
      </View>

      {/* Character Picker */}
      <View style={styles.charPicker}>
        <Text style={styles.charLabel}>대화 인물 선택:</Text>
        {['흥부', '이순신 장군', '지키미 AI'].map((name) => (
          <TouchableOpacity
            key={name}
            style={[styles.charChip, character === name && styles.charChipActive]}
            onPress={() => setCharacter(name)}
          >
            <Text style={[styles.charChipText, character === name && { color: '#FFF' }]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chat Thread */}
      <ScrollView style={styles.chatThread}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.msgBox, m.sender === 'user' ? styles.msgUser : styles.msgPersona]}>
            <Text style={styles.senderTitle}>{m.sender === 'persona' ? `👤 ${character}` : '🎒 나 (Student)'}</Text>
            <Text style={styles.msgKo}>{m.textKo}</Text>
            {m.textUser && m.textUser !== m.textKo && (
              <Text style={styles.msgTrans}>({m.textUser})</Text>
            )}

            {/* RAG Grounding Citation Badge */}
            {m.sources && m.sources.length > 0 && (
              <View style={styles.ragBadge}>
                <Text style={styles.ragText}>📚 교과서 근거: {m.sources.join(' | ')}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Recommended Questions */}
      <View style={styles.suggestRow}>
        <TouchableOpacity style={styles.suggestChip} onPress={() => handleAsk('왜 놀부 형님을 원망하지 않았나요?')}>
          <Text style={styles.suggestText}>"왜 형님을 원망하지 않았나요?"</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.suggestChip} onPress={() => handleAsk('제비 다리는 왜 고쳐주었나요?')}>
          <Text style={styles.suggestText}>"제비 다리는 왜 고쳐주었나요?"</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={`${character}에게 질문하기...`}
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleAsk()}>
          <Text style={styles.sendBtnText}>질문</Text>
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
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  charPicker: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: '#FFF', padding: 8, borderRadius: 12 },
  charLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSub },
  charChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: COLORS.background },
  charChipActive: { backgroundColor: COLORS.primary },
  charChipText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  chatThread: { flex: 1, marginBottom: 10 },
  msgBox: { padding: 12, borderRadius: 12, marginBottom: 10, maxWidth: '85%' },
  msgPersona: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
  msgUser: { backgroundColor: COLORS.primaryLight, alignSelf: 'flex-end' },
  senderTitle: { fontSize: 11, fontWeight: 'bold', color: COLORS.textSub, marginBottom: 4 },
  msgKo: { fontSize: 14, color: COLORS.text, lineHeight: 18 },
  msgTrans: { fontSize: 12, color: COLORS.primaryDark, marginTop: 4 },
  ragBadge: { backgroundColor: '#FEF3C7', padding: 6, borderRadius: 6, marginTop: 8 },
  ragText: { fontSize: 10, color: '#92400E', fontWeight: 'bold' },
  suggestRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  suggestChip: { backgroundColor: '#CCFBF1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  suggestText: { fontSize: 11, color: COLORS.primaryDark, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, fontSize: 14 },
  sendBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12 },
  sendBtnText: { color: '#FFF', fontWeight: 'bold' },
});
