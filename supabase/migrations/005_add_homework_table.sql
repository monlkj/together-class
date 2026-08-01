-- 숙제/과제 테이블
CREATE TABLE IF NOT EXISTS homework (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = 전체 학생
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

-- 교사: 자신이 낸 숙제 관리
CREATE POLICY "teachers_manage_homework" ON homework
  FOR ALL USING (auth.uid() = teacher_id);

-- 학생: 자신의 숙제 또는 전체 공개 숙제 열람
CREATE POLICY "students_view_homework" ON homework
  FOR SELECT USING (student_id IS NULL OR auth.uid() = student_id);
