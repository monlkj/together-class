import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { LanguageCode } from '@dahamkke/shared';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { SignUpScreen } from './src/presentation/screens/SignUpScreen';
import { MainScreen } from './src/presentation/screens/MainScreen';
import { TranslateScreen } from './src/presentation/screens/TranslateScreen';
import { InterpretScreen } from './src/presentation/screens/InterpretScreen';
import { DebateScreen } from './src/presentation/screens/DebateScreen';
import { PersonaScreen } from './src/presentation/screens/PersonaScreen';
import { NoticeScreen } from './src/presentation/screens/NoticeScreen';
import { RecordsScreen } from './src/presentation/screens/RecordsScreen';
import { RecordDetailScreen } from './src/presentation/screens/RecordDetailScreen';
import { TextbookIngestScreen } from './src/presentation/screens/TextbookIngestScreen';
import { PersonaAdminScreen } from './src/presentation/screens/PersonaAdminScreen';
import { SettingsScreen } from './src/presentation/screens/SettingsScreen';

type ScreenState =
  | 'login'
  | 'signup'
  | 'main'
  | 'translate'
  | 'interpret'
  | 'debate'
  | 'persona'
  | 'notice'
  | 'records'
  | 'recordDetail'
  | 'textbookIngest'
  | 'personaAdmin'
  | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('login');
  const [user, setUser] = useState<{ name: string; email: string; role: 'student' | 'teacher' } | null>(null);
  const [selectedLang, setSelectedLang] = useState<LanguageCode>('ru');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const handleLoginSuccess = (userData: { name: string; email: string; role: 'student' | 'teacher' }) => {
    setUser(userData);
    setCurrentScreen('main');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {currentScreen === 'login' && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateSignUp={() => setCurrentScreen('signup')}
          selectedLang={selectedLang}
          onSelectLang={setSelectedLang}
        />
      )}

      {currentScreen === 'signup' && (
        <SignUpScreen
          onSignUpSuccess={() => setCurrentScreen('login')}
          onNavigateLogin={() => setCurrentScreen('login')}
        />
      )}

      {currentScreen === 'main' && user && (
        <MainScreen
          user={user}
          selectedLang={selectedLang}
          onSelectLang={setSelectedLang}
          onNavigate={(screen) => setCurrentScreen(screen as ScreenState)}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'translate' && (
        <TranslateScreen selectedLang={selectedLang} onBack={() => setCurrentScreen('main')} />
      )}

      {currentScreen === 'interpret' && (
        <InterpretScreen selectedLang={selectedLang} onBack={() => setCurrentScreen('main')} />
      )}

      {currentScreen === 'debate' && (
        <DebateScreen selectedLang={selectedLang} onBack={() => setCurrentScreen('main')} />
      )}

      {currentScreen === 'persona' && (
        <PersonaScreen selectedLang={selectedLang} onBack={() => setCurrentScreen('main')} />
      )}

      {currentScreen === 'notice' && (
        <NoticeScreen selectedLang={selectedLang} onBack={() => setCurrentScreen('main')} />
      )}

      {currentScreen === 'records' && (
        <RecordsScreen
          onBack={() => setCurrentScreen('main')}
          onSelectRecord={(rec) => {
            setSelectedRecord(rec);
            setCurrentScreen('recordDetail');
          }}
        />
      )}

      {currentScreen === 'recordDetail' && (
        <RecordDetailScreen record={selectedRecord} onBack={() => setCurrentScreen('records')} />
      )}

      {currentScreen === 'textbookIngest' && (
        <TextbookIngestScreen onBack={() => setCurrentScreen('main')} />
      )}

      {currentScreen === 'personaAdmin' && (
        <PersonaAdminScreen onBack={() => setCurrentScreen('main')} />
      )}

      {currentScreen === 'settings' && user && (
        <SettingsScreen
          user={user}
          selectedLang={selectedLang}
          onSelectLang={setSelectedLang}
          onBack={() => setCurrentScreen('main')}
          onLogout={handleLogout}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
});
