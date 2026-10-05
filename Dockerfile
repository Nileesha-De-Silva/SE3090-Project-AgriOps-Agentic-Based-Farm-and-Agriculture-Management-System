# ==========================================
# Stage 1: Build & Publish
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project definitions for optimized Docker caching
COPY ["AgriOps.sln", "./"]
COPY ["backend/src/AgriOps.Core/AgriOps.Core.csproj", "backend/src/AgriOps.Core/"]
COPY ["backend/src/AgriOps.Infrastructure/AgriOps.Infrastructure.csproj", "backend/src/AgriOps.Infrastructure/"]
COPY ["backend/src/AgriOps.Api/AgriOps.Api.csproj", "backend/src/AgriOps.Api/"]
COPY ["backend/tests/AgriOps.Tests/AgriOps.Tests.csproj", "backend/tests/AgriOps.Tests/"]
COPY ["backend/tests/AgriOps.IntegrationTests/AgriOps.IntegrationTests.csproj", "backend/tests/AgriOps.IntegrationTests/"]

# Restore packages
RUN dotnet restore "AgriOps.sln"

# Copy source code and build
COPY . .
WORKDIR "/src/backend/src/AgriOps.Api"
RUN dotnet publish "AgriOps.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ==========================================
# Stage 2: Runtime
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose default HTTP port
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "AgriOps.Api.dll"]
