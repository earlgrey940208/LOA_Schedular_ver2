# Lost Ark 스케줄러 Docker 정지 스크립트
# PowerShell에서 실행: .\stop-docker.ps1

Write-Host "Lost Ark 스케줄러 Docker 환경 정지..." -ForegroundColor Yellow

# Docker Compose 정지 및 볼륨 제거
docker-compose down -v

# 사용되지 않는 이미지 정리 (선택사항)
Write-Host "사용되지 않는 Docker 이미지 정리..." -ForegroundColor Cyan
docker image prune -f

Write-Host "Docker 환경이 정상적으로 정지되었습니다." -ForegroundColor Green
