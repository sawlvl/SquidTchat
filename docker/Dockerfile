# ============================================================
# PROJECT : SquidTchat
# AUTHOR  : W.Sanquer
# DATE    : 2026
# ============================================================

FROM debian:11

# Installation des dépendances Qt + build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    make \
    qt5-qmake \
    qtbase5-dev \
    libqt5websockets5-dev \
    qtchooser \
    libqt5core5a \
    libqt5network5 \
    libqt5websockets5 \
    && rm -rf /var/lib/apt/lists/*

# Définition du répertoire de travail
WORKDIR /app

# Copie du projet
COPY SquidBackend/src/ /app/

# --- CORRECTIFS AUTOMATIQUES ---

# Correctif 1 : Ambiguïté QStringList {}
RUN sed -i 's/b_words_list = {};/b_words_list.clear();/g' squid_group.cpp

# Correctif 2 : Comparaison impossible entre QString et QJsonValue
# On transforme 'value' en 'value.toString()'
RUN sed -i 's/m_User_name == value/m_User_name == value.toString()/g' squidcien_session.cpp

# --- COMPILATION ---

RUN qmake -spec linux-g++ SquidBackend.pro && make

# Commande par défaut (Vérifiez que le nom du binaire est bien SquidBackend)
CMD ["./SquidBackend"]