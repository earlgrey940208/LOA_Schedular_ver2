# Lost Ark 스케줄러 v2 - Docker 환경

## 개요
Lost Ark 레이드 스케줄러를 Docker 환경에서 실행하기 위한 설정입니다.

## 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   MariaDB       │
│   (Vue + Vite)  │    │   (Spring Boot) │    │   Database      │
│   Port: 5173    │    │   Port: 19013   │    │   Port: 19012   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 포트 구성
- **프론트엔드**: 5173 (Vite 기본 포트 - 절대 변경 금지)
- **백엔드**: 19013 (보안을 위해 8080에서 변경)
- **MariaDB**: 19012 (외부 접근) / 3306 (컨테이너 내부)

## 사전 요구사항
- Docker Desktop
- Docker Compose
- PowerShell (Windows)
- Java 17+ (개발 환경용)
- Node.js 20+ (개발 환경용)

## Docker 환경 실행

### 빠른 시작
```powershell
# PowerShell에서 실행
.\start-docker.ps1
```

### 수동 실행
```powershell
# 1. 백엔드 JAR 빌드
cd back_end
.\gradlew.bat bootJar
cd ..

# 2. Docker Compose 실행
docker-compose up --build
```

### 서비스 정지
```powershell
.\stop-docker.ps1
# 또는
docker-compose down
```

## 접속 URL
- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:19013/api
- **데이터베이스**: localhost:19012

## 개발 환경 실행
Docker를 사용하지 않고 개발 환경에서 실행:

```powershell
# 백엔드 (터미널 1)
cd back_end
.\gradlew.bat bootRun

# 프론트엔드 (터미널 2)
cd front_end
npm start
```

## 트러블슈팅

### 포트 충돌
```powershell
# 사용 중인 포트 확인
netstat -an | findstr :5173
netstat -an | findstr :19013
netstat -an | findstr :19012
```

### 로그 확인
```powershell
# 전체 로그
docker-compose logs

# 특정 서비스 로그
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mariadb
```

### 컨테이너 상태 확인
```powershell
docker-compose ps
```

### 데이터베이스 초기화
```powershell
# 볼륨 포함 완전 삭제 후 재시작
docker-compose down -v
docker-compose up --build
```

## 파일 구조
```
├── docker-compose.yml          # Docker Compose 설정
├── init.sql                   # 데이터베이스 초기화
├── start-docker.ps1           # Docker 시작 스크립트
├── stop-docker.ps1            # Docker 정지 스크립트
├── back_end/
│   ├── Dockerfile            # 백엔드 Docker 이미지
│   └── src/main/resources/
│       ├── application.properties         # 개발 환경 설정
│       └── application-docker.properties  # Docker 환경 설정
└── front_end/
    ├── Dockerfile            # 프론트엔드 Docker 이미지
    ├── nginx.conf           # Nginx 설정
    └── vite.config.js       # Vite 설정 (포트 5173 고정)
```

## 환경 변수
Docker 환경에서는 다음 환경 변수가 자동으로 설정됩니다:
- `SPRING_PROFILES_ACTIVE=docker`
- `SERVER_PORT=19013`
- `SPRING_DATASOURCE_URL=jdbc:mariadb://mariadb:3306/loa_scheduler`

## API 테스트
```powershell
# 유저 목록 조회
curl http://localhost:19013/api/user

# 레이드 목록 조회  
curl http://localhost:19013/api/raid
```
