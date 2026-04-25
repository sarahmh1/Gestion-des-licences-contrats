# Stage 1: Build the application
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copy the built jar from the build stage
COPY --from=build /app/target/projet2024-0.0.1-SNAPSHOT.jar app.jar
# Create the uploads directory inside the container
RUN mkdir -p /app/uploads

EXPOSE 8089
ENTRYPOINT ["java", "-jar", "app.jar"]
