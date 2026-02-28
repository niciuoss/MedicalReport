FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000
# Bibliotecas de fontes necessárias para QuestPDF/SkiaSharp no Linux
RUN apt-get update \
    && apt-get install -y --no-install-recommends fontconfig fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MedicalReports.API.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Pasta para as logos (será montada como volume)
RUN mkdir -p /app/wwwroot/images
ENTRYPOINT ["dotnet", "MedicalReports.API.dll"]