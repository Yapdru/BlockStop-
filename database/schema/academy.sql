-- Academy & Training Schema

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  level VARCHAR(50) NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
  instructor VARCHAR(255),
  duration INTEGER, -- minutes
  prerequisites TEXT[],
  tags TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  is_free BOOLEAN DEFAULT FALSE,
  price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR(255) NOT NULL REFERENCES courses(course_id),
  module_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER, -- minutes
  content TEXT,
  video_url VARCHAR(255),
  resources JSONB,
  quiz JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, module_id)
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id VARCHAR(255) NOT NULL UNIQUE,
  student_id VARCHAR(255) NOT NULL,
  course_id VARCHAR(255) NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  completed_modules TEXT[],
  certificate_id VARCHAR(255),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certification_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id VARCHAR(255) NOT NULL UNIQUE,
  certification_type VARCHAR(50) NOT NULL, -- 'BCA', 'BCP', 'BCE', 'BCT'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- minutes
  total_questions INTEGER NOT NULL,
  passing_score INTEGER NOT NULL,
  questions JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id VARCHAR(255) NOT NULL UNIQUE,
  student_id VARCHAR(255) NOT NULL,
  exam_id VARCHAR(255) NOT NULL,
  certification_type VARCHAR(50) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  passed BOOLEAN,
  certificate_id VARCHAR(255),
  answers JSONB,
  time_spent_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blockstop_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id VARCHAR(255) NOT NULL UNIQUE,
  student_id VARCHAR(255) NOT NULL,
  student_name VARCHAR(255),
  certification_type VARCHAR(50) NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  exam_score INTEGER,
  certificate_number VARCHAR(100) NOT NULL UNIQUE,
  credential_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON course_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_exams_type ON certification_exams(certification_type);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON blockstop_certificates(student_id);
