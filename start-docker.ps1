# Lost Ark 스케줄러 Docker 실행 스크립트
# PowerShell에서 실행: .\start-docker.ps1

Write-Host "Lost Ark 스케줄러 Docker 환경 시작..." -ForegroundColor Green

# 1. 백엔드 JAR 파일 빌드
Write-Host "백엔드 JAR 파일 빌드 중..." -ForegroundColor Yellow
Set-Location back_end
.\gradlew.bat bootJar
if ($LASTEXITCODE -ne 0) {
    Write-Host "백엔드 빌드 실패!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 2. Docker Compose 실행
Write-Host "Docker 컨테이너 시작 중..." -ForegroundColor Yellow
docker-compose down -v
docker-compose up --build -d

# 3. 서비스 상태 확인
Write-Host "서비스 상태 확인 중..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# MariaDB 상태 확인
Write-Host "MariaDB 상태 확인..." -ForegroundColor Cyan
docker-compose logs mariadb | Select-Object -Last 5

# 백엔드 상태 확인
Write-Host "백엔드 상태 확인..." -ForegroundColor Cyan
docker-compose logs backend | Select-Object -Last 5

# 프론트엔드 상태 확인
Write-Host "프론트엔드 상태 확인..." -ForegroundColor Cyan
docker-compose logs frontend | Select-Object -Last 5

Write-Host "" -ForegroundColor White
Write-Host "=== 서비스 접속 정보 ===" -ForegroundColor Green
Write-Host "프론트엔드: http://localhost:5173" -ForegroundColor Cyan
Write-Host "백엔드 API: http://localhost:19013/api" -ForegroundColor Cyan
Write-Host "MariaDB: localhost:19012" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "서비스 중지: docker-compose down" -ForegroundColor Yellow
