import { LanguageCode } from '@dahamkke/shared';

export type UserRole = 'student' | 'teacher' | 'parent';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  nativeLanguage: LanguageCode;
  createdAt: string;
}
