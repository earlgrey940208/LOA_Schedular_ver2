# Copilot Instructions for LOA Scheduler v2

## Project Overview
This is a **Lost Ark raid scheduler** with drag-and-drop functionality to manage character assignments across weekly raids. The application uses Vue 3 + Spring Boot architecture with MariaDB.

## Architecture & Key Patterns

### Full-Stack Structure
- **Frontend**: Vue 3 (Composition API) + Vite at `/front_end/`
- **Backend**: Spring Boot 3.2.2 + JPA + MariaDB at `/back_end/`
- **API Communication**: RESTful APIs with centralized service layer

### Frontend Patterns
- **Monolithic Component**: `App.vue` (913 lines) contains all UI logic - this is intentional for simplicity
- **Composables**: Only `useApi.js` and `useDragDrop.js` for reusable logic
- **Services**: All API calls centralized in `services/api.js` with dedicated modules (raidApi, characterApi, scheduleApi)
- **State Management**: Reactive refs/reactive objects, no Pinia/Vuex

### Backend Patterns
- **Entity Naming**: Uses "Charactors" (typo intentional) for character entity
- **JPA Configuration**: `ddl-auto=update` with MariaDB dialect
- **Validation**: Jakarta validation on entities with Korean error messages

## Critical Development Workflows

### Database Setup
```bash
# Start MariaDB container
cd back_end && docker-compose up -d

# Backend expects database 'loa_scheduler' with user 'user_app'
# Connection: jdbc:mariadb://192.168.219.103:19012/loa_scheduler
```

### Running Services
```bash
# Frontend (port 5174)
cd front_end && npm start

# Backend (port 8080) 
cd back_end && ./gradlew bootRun
```

### API Error Handling Pattern
Frontend gracefully falls back to hardcoded sample data when backend is unavailable:
```javascript
// In useApi.js - always provide fallback data
return handleError(err, ['베히모스', '하기르', '노브', '노르둠'])
```

## Business Logic Constraints

### Character Assignment Rules (in App.vue)
1. **3-Raid Limit**: `isCharacterMaxed()` prevents characters from joining >3 raids
2. **Same-User Restriction**: Users can't put multiple characters in same raid cell
3. **Single Raid Assignment**: Characters can only be in one party per raid
4. **Visual Feedback**: Disabled characters show as grayscale with `opacity: 0.5`

### Drag & Drop System
- **4 Drag Types**: 'character', 'raid', 'party', 'character-order' (see `useDragDrop.js`)
- **Schedule Key Format**: `${party}-${raid}` for schedule storage
- **Right-click**: Removes characters from schedule

## Data Structures

### Frontend Character Object
```javascript
{
  name: "캐릭터명",      // Primary identifier
  isSupporter: boolean,  // Visual indicator (underline)
  userId: "유저ID"       // For color coding
}
```

### Backend Entity Mismatch
- Frontend uses `isSupporter: boolean`
- Backend entity uses `isSupporter: String` - **conversion needed**

### User Color Mapping
```javascript
const userColors = {
  '혀니': '#9d4edd',
  '샷건': '#f4d03f', 
  '도당': '#85c1e9'
}
```

## Integration Points

### API Endpoints
- `/api/Raid` - Raid management (note: capital R)
- `/api/Charactors` - Character management (note: typo)
- `/api/Schedule` - Schedule management

### Cross-Component Communication
- No event bus - direct prop passing and emits
- Drag state managed globally in `useDragDrop` composable
- API loading states shared via `useApi` composable

## Korean Language Context
- UI labels, validation messages, and sample data are in Korean
- Character names, raid names use Korean game terminology
- Error messages should maintain Korean language consistency
