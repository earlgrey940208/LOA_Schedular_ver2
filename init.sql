-- Lost Ark 스케줄러 데이터베이스 초기화
-- 이 파일은 MariaDB 컨테이너 최초 실행시 자동으로 실행됩니다.

-- 기본 유저 데이터 삽입
INSERT IGNORE INTO user (name, color) VALUES
('혀니', '#9d4edd'),
('샷건', '#f4d03f'),
('도당', '#85c1e9');

-- 기본 레이드 데이터 삽입
INSERT IGNORE INTO raid (name, seq) VALUES
('베히모스', 1),
('하기르', 2),
('노브', 3),
('노르둠', 4);

-- 기본 캐릭터 데이터 삽입
INSERT IGNORE INTO charactors (name, user_id, is_supporter, seq) VALUES
('비내', '혀니', 'N', 1),
('메딕', '혀니', 'Y', 2),
('샷건', '샷건', 'N', 1),
('마리', '샷건', 'N', 2),
('붓먹', '샷건', 'Y', 3),
('포우', '도당', 'N', 1),
('포포', '도당', 'N', 2);
