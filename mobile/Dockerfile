# =========================================================================
# Flutter Web Container for AgriOps Mobile
# Serves the compiled Flutter Web application via lightweight Nginx
# =========================================================================

# Stage 1: Build Flutter Web
FROM ghcr.io/cirruslabs/flutter:stable AS build
WORKDIR /app

COPY pubspec*.yaml ./
RUN flutter pub get

COPY . .
RUN flutter build web --release

# Stage 2: Serve via Nginx
FROM nginx:alpine AS runtime
COPY --from=build /app/build/web /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
