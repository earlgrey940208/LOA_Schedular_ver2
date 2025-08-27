FROM openjdk:17-jdk-slim

# 작업 디렉토리 설정
WORKDIR /app

# 헬스체크용 도구 설치 (최적화된 버전)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# JAR 파일 복사
COPY build/libs/*.jar app.jar

# 포트 노출 (현재 설정 기준)
EXPOSE 19013

# JVM 옵션 최적화와 함께 실행
ENTRYPOINT ["java", "-Xmx512m", "-Xms256m", "-jar", "app.jar"]