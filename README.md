# gongsaeng

세 개의 앱으로 구성된 모노 저장소입니다.

| 폴더 | 스택 | 포트 |
|---|---|---|
| `frontend/` | React + Vite + TypeScript | `5180` |
| `admin/` | React + Vite + TypeScript | `5181` |
| `backend/` | Go + Gin + GORM (MySQL), Air 핫 리로드 | `8080` |

## 사전 요구 사항

- **Node.js** 20 이상 (`node --version`)
- **npm** 10 이상 (`npm --version`)
- **Go** 1.26 이상 (`go version`)
- **MySQL** (로컬 또는 원격)
- **Air** (Go 핫 리로드 도구)

설치:

```bash
# macOS (Homebrew)
brew install node go mysql

# Air 설치
go install github.com/air-verse/air@latest
```

> Air 바이너리는 `$(go env GOPATH)/bin/air`에 설치됩니다. `start.sh`는 이 경로를 직접 참조하므로 `PATH` 설정은 필요 없습니다.

## 최초 1회 설정

```bash
git clone https://github.com/hierolabs/gongsaeng.git
cd gongsaeng

# frontend
cd frontend && npm install && cp .env.example .env && cd ..

# admin
cd admin && npm install && cp .env.example .env && cd ..

# backend
cd backend && go mod tidy && cp .env.example .env && cd ..
# → backend/.env의 DATABASE_DSN을 본인 환경에 맞게 수정
```

각 `.env` 형식:

```env
# backend/.env
PORT=8080
DATABASE_DSN=user:password@tcp(127.0.0.1:3306)/gongsaeng?charset=utf8mb4&parseTime=True&loc=Local

# frontend/.env
VITE_API_URL=http://localhost:8080

# admin/.env
VITE_API_URL=http://localhost:8080/admin
```

## API 라우팅 구조

| 클라이언트 | 호출 베이스 URL | Backend 라우트 그룹 |
|---|---|---|
| frontend | `http://localhost:8080` | `/` (공개 라우트) |
| admin | `http://localhost:8080/admin` | `/admin` 그룹 (admin 전용) |

각 앱은 `src/lib/api.ts`의 `api()` 헬퍼를 통해 호출합니다:

```ts
import { api } from "./lib/api";
const data = await api<{ status: string }>("/health");
```

## 실행 (전체 한 번에)

```bash
./start.sh   # 세 서비스를 백그라운드로 시작
./stop.sh    # 모두 종료
```

서비스별 정보:

| 서비스 | URL | 로그 |
|---|---|---|
| backend | http://localhost:8080/health | `.run/backend.log` |
| frontend | http://localhost:5180 | `.run/frontend.log` |
| admin | http://localhost:5181 | `.run/admin.log` |

로그 실시간 확인:

```bash
tail -f .run/*.log
```

PID 파일과 로그는 `.run/` 디렉토리에 저장되며 `.gitignore`로 제외됩니다.

## 개별 실행 (선택)

전체 스크립트 대신 개별로 띄우려면:

```bash
# backend (Air 핫 리로드)
cd backend && air

# frontend
cd frontend && npm run dev

# admin
cd admin && npm run dev
```

## 빌드

```bash
# 프론트엔드 정적 빌드 → dist/
cd frontend && npm run build
cd admin && npm run build

# Go 바이너리 → backend/backend
cd backend && go build .
```
