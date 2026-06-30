-- 一对一家教平台数据库初始化脚本
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS csnews DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE csnews;

-- 用户基础表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(64) NOT NULL UNIQUE,
  unionid VARCHAR(64) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  nickname VARCHAR(64) DEFAULT NULL,
  avatar_url VARCHAR(512) DEFAULT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 学生信息
CREATE TABLE IF NOT EXISTS student_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  grade VARCHAR(32) DEFAULT NULL COMMENT '年级',
  subjects JSON DEFAULT NULL COMMENT '关注科目',
  learning_goal TEXT DEFAULT NULL,
  city VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 教师信息
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  real_name VARCHAR(32) DEFAULT NULL,
  id_card VARCHAR(32) DEFAULT NULL,
  education VARCHAR(64) DEFAULT NULL COMMENT '学历',
  teaching_years INT DEFAULT 0 COMMENT '教龄',
  bio TEXT DEFAULT NULL COMMENT '简介',
  teaching_style VARCHAR(256) DEFAULT NULL,
  audit_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reject_reason VARCHAR(512) DEFAULT NULL,
  hourly_rate DECIMAL(10,2) DEFAULT 0 COMMENT '默认课时费',
  rating DECIMAL(3,2) DEFAULT 5.00,
  review_count INT DEFAULT 0,
  order_count INT DEFAULT 0,
  city VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_audit_status (audit_status),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 教师资质证书
CREATE TABLE IF NOT EXISTS teacher_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  cert_type ENUM('teacher_qualification', 'education', 'id_card') NOT NULL,
  image_url VARCHAR(512) NOT NULL,
  audit_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 教师授课科目与价格
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  subject VARCHAR(32) NOT NULL,
  grade_level VARCHAR(32) NOT NULL COMMENT '小学/初中/高中',
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  INDEX idx_subject (subject),
  INDEX idx_grade (grade_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 教师可授课时间
CREATE TABLE IF NOT EXISTS teacher_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '0=周日, 1=周一...',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  INDEX idx_teacher_day (teacher_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  teacher_id INT NOT NULL,
  subject VARCHAR(32) NOT NULL,
  grade_level VARCHAR(32) NOT NULL,
  lesson_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lesson_fee DECIMAL(10,2) NOT NULL COMMENT '课时费',
  service_fee DECIMAL(10,2) NOT NULL COMMENT '平台手续费',
  total_amount DECIMAL(10,2) NOT NULL COMMENT '总金额',
  service_fee_rate DECIMAL(4,2) NOT NULL DEFAULT 0.07 COMMENT '手续费率 5%-9%',
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  requirement TEXT DEFAULT NULL COMMENT '学生需求描述',
  cancel_reason VARCHAR(512) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  INDEX idx_student (student_id),
  INDEX idx_teacher (teacher_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 支付记录
CREATE TABLE IF NOT EXISTS order_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  wx_transaction_id VARCHAR(64) DEFAULT NULL,
  prepay_id VARCHAR(64) DEFAULT NULL,
  pay_status ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  profit_sharing_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  student_id INT NOT NULL,
  teacher_id INT NOT NULL,
  rating TINYINT NOT NULL COMMENT '1-5星',
  content TEXT DEFAULT NULL,
  tags JSON DEFAULT NULL,
  is_anonymous TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  INDEX idx_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 站内消息
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('system', 'order', 'audit') NOT NULL DEFAULT 'system',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 种子数据：管理员账号（需通过 openid 绑定）
INSERT INTO users (openid, nickname, role, phone) VALUES
  ('dev_admin_openid_placeholder', '系统管理员', 'admin', '13800000000');

SET FOREIGN_KEY_CHECKS = 1;
