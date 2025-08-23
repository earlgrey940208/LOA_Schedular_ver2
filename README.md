# 로스트아크 스케줄러 ver.2

로스트아크 유저가 보유한 캐릭터들을 주간 레이드 스케줄에 맞춰 손쉽게 관리할 수 있는 **웹 기반 드래그 앤 드롭 방식 스케줄러**

## 프로젝트 개요

### 목표
- 로스트아크 캐릭터들의 주간 레이드 스케줄을 드래그 앤 드롭으로 관리
- 파티 구성과 중복/누락 여부를 한눈에 확인 가능

### 핵심 가치
- 시각적 일정표 + 캐릭터 관리표
- 드래그 & 드롭 방식으로 직관적인 UX 제공

## 주요 기능

### 현재 구현된 기능
- **드래그 앤 드롭**: 캐릭터를 레이드 테이블에 배치
- **Validation 규칙**:
  - 한 캐릭터는 동일한 레이드의 한 파티에만 배치 가능
  - 한 캐릭터당 최대 3개 레이드에만 배치 가능
  - 한 유저의 캐릭터는 같은 셀에 한 번만 배치 가능
- **캐릭터 관리**: 
  - 3개 레이드에 배치된 캐릭터는 자동 비활성화 처리
  - 우클릭으로 배치된 캐릭터 삭제
  - 새 캐릭터 추가 기능
- **시각적 구분**: 유저별 색상, 서포터 밑줄 표시

## 기술 스택

### Frontend
- **Vue.js 3** - Composition API 사용
- **Vite** - 빌드 도구
- **CSS** - 스코프드 스타일

### 데이터 구조
```javascript
// 캐릭터 구조
{
  name: "캐릭터명",      // PK
  isSupporter: boolean,  // 서포터 유무
  userId: "유저ID"       // FK
}

// 레이드 구조
{
  name: "레이드명"       // PK
}

// 스케줄 구조
{
  scheduleId: "스케줄ID", // PK
  raidName: "레이드명",   // FK
  characterName: "캐릭터명", // FK
  partyName: "파티명"
  isFinish: boolean // 스케줄 완료 여부
}
```

## 실행 방법

### 개발 환경 실행
```bash
cd front_end
npm install
npm start
```

브라우저에서 `http://localhost:5174/` 접속

## 프로젝트 구조

### Frontend (Vue.js)
```
front_end/
├── src/
│   ├── components/
│   │   ├── AppHeader.vue              # 헤더 컴포넌트
│   │   ├── ScheduleSection.vue        # 스케줄 관리 (모든 로직 포함)
│   │   ├── CharacterSection.vue       # 캐릭터 관리 (모든 로직 포함)
│   │   └── ui/
│   │       ├── LoadingSpinner.vue     # 로딩 스피너
│   │       └── ErrorMessage.vue       # 에러 메시지
│   ├── composables/
│   │   ├── useApi.js                  # API 관련 로직
│   │   └── useDragDrop.js            # 드래그앤드롭 로직
│   ├── services/
│   │   └── api.js                    # API 서비스 (raidApi, characterApi, scheduleApi)
│   ├── utils/
│   │   └── constants.js              # 상수들 (userColors, defaultData 등)
│   ├── App.vue                       # 메인 조합 컴포넌트 (173줄)
│   └── main.js                       # 엔트리 포인트
├── package.json
└── vite.config.js
```

### Backend (Spring Boot)
```
back_end/
├── src/
│   └── main/
│       ├── java/com/loa/scheduler/
│       │   ├── SchedulerApplication.java
│       │   ├── controller/            # REST API 컨트롤러
│       │   ├── entity/               # JPA 엔티티 (Charactors, Raid, Schedule)
│       │   └── repository/           # JPA 리포지토리
│       └── resources/
│           └── application.properties # DB 연결 설정
├── docker-compose.yml               # MariaDB 컨테이너 설정
└── build.gradle
```

### 아키텍처 특징
- **컴포넌트 기반**: 기능별로 적절히 분리된 Vue 컴포넌트
- **중앙집중식 API**: services/api.js에서 모든 API 관리
- **재사용 가능한 로직**: composables로 드래그앤드롭, API 로직 분리
- **상수 관리**: utils/constants.js에서 색상, 기본값 등 관리
- **RESTful API**: Spring Boot로 구현된 백엔드 API

## 개발 워크플로우

### 데이터베이스 설정
```bash
# MariaDB 컨테이너 시작
cd back_end && docker-compose up -d
```

### 서비스 실행
```bash
# Frontend (port 5174)
cd front_end && npm start

# Backend (port 8080) 
cd back_end && ./gradlew bootRun
```

## 향후 계획
- [x] 백엔드 API 개발 (Spring Boot)
- [x] 데이터베이스 연동
- [x] 저장/불러오기 기능 구현
- [ ] 사용자 인증 시스템
- [x] 외부PC 접근 가능 구현

## 개발자
정현희 (JHH)
