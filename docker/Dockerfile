# Image de base Debian légère
FROM debian:bullseye-slim

# ============================================================

# --- Qt 6 (actif) ---
RUN apt-get update && apt-get install -y \
    qt6-base-dev \
    qt6-websockets-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# --- Qt 5.9 (inactif) ---
# RUN apt-get update && apt-get install -y \
#     qt5-qmake \
#     qtbase5-dev \
#     libqt5websockets5-dev \
#     build-essential \
#     && rm -rf /var/lib/apt/lists/*

# ============================================================

# Copie le code source dans le conteneur
COPY SquidBackend/ /app/

# Se place dans le dossier de travail
WORKDIR /app

# Compile le projet
# Pour Qt 6 : qmake6
# Pour Qt 5 : qmake
RUN qmake6 SquidTchat.pro && make

# Expose le port WebSocket
EXPOSE 1234

# Lance le serveur au démarrage
CMD ["./SquidTchat"]