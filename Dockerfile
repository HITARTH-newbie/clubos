
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY clubos-backend/pom.xml ./pom.xml
COPY clubos-backend/src ./src

RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /workspace/target/clubos-backend-1.0.0.jar app.jar

EXPOSE 8080

CMD ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
