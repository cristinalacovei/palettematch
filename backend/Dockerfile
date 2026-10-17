# Build the Spring Boot application with Java 21 and Maven.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

# Run the packaged application on a lightweight Java 21 runtime.
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/palettematch-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
