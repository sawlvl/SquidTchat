<div align="center">

![SquidTchat Banner](https://capsule-render.vercel.app/api?type=waving&color=0:1a1a2e,50:6C63FF,100:00BCD4&height=250&section=header&text=%F0%9F%A6%91%20SquidTchat&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Messagerie%20temps%20r%C3%A9el%20%C2%B7%20Client%20%2F%20Serveur%20%C2%B7%20WebSocket&descSize=18&descAlignY=53&descAlign=50)

</div>

<div align="center">

![Status](https://img.shields.io/badge/Status-En%20développement-orange?style=flat-square)
![Platform](https://img.shields.io/badge/Platform-Web-lightgrey?style=flat-square)
![WebSocket](https://img.shields.io/badge/Protocol-WebSocket-6C63FF?style=flat-square)

</div>

## 💬 C'est quoi SquidTchat ?

SquidTchat est une application de messagerie en temps réel développée dans le cadre d'un projet scolaire.

Elle permet à plusieurs utilisateurs connectés sur un même réseau local de communiquer via un tchat général et des messages privés.

Le tout propulsé par une communication WebSocket entre un frontend web et un serveur C++/Qt.

## 🛠 Technologies
<div align="center">

| 🖥 Frontend | ⚙️ Backend | 🔀 Versionnage | 🖊️ IDE | 🐳 Déploiement |
|:---:|:---:|:---:|:---:|:---:|
| [![Frontend](https://skillicons.dev/icons?i=html,css,js)](https://skillicons.dev) | [![Backend](https://skillicons.dev/icons?i=cpp,qt)](https://skillicons.dev) | [![Git](https://skillicons.dev/icons?i=git,github)](https://skillicons.dev) | [![IDE](https://skillicons.dev/icons?i=vscode)](https://skillicons.dev) | [![Docker](https://skillicons.dev/icons?i=docker)](https://skillicons.dev) |

</div>


## 📁 Structure du projet

    SquidTchat/
    ├── SquidFrontend/       # Frontend (HTML, CSS, JavaScript)
    │   ├─config/            #Scripts de configuration (.js)
    │   ├── css/             # Feuilles de style (.css)
    │   ├── font/            # Polices d'écriture
    │   ├── img/             # Images et icônes
    │   ├── javascript/      # Scripts JavaScript (.js)
    │   └── pages/           # Pages HTML (.html)
    │
    ├── SquidBackend/        # Backend (C++/Qt)
    │   └── src/             # Code source C++ (.cpp, .h, .pro)
    │
    ├── docker/              # Configuration Docker (Dockerfile, .yml)
    ├── docs/                # Documentation du projet (.pdf)
    ├── planning/            # Journaux d'activité individuels (.xlsx)
    ├── .gitignore
    └── README.md

## 🌿 Structure des branches

    SquidTchat/
    ├── main          # Branche principale de développement
    └── main-backup   # Sauvegarde de la branche main

## 🌐 Architecture réseau

<details>
  <summary>Voir le schéma</summary>
  <div align="center">
    <img src="SquidFrontend/img/architecture_reseau.png" alt="Architecture réseau SquidTchat" width="1000"/>
  </div>
</details>

## 🔧 Installation

### Prérequis
Assurez-vous d'avoir installé sur votre machine :
- [Git](https://git-scm.com/downloads)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Cloner le dépôt
```bash
git clone https://github.com/m0bley-git/SquidTchat.git
cd SquidTchat
```

### Lancer le projet
> ⚠️ En cours de développement — pas encore fonctionnel.

| Action | Commande |
|:---|:---|
| Lancer le projet | `docker-compose -f docker/docker-compose.yml up` |
| Lancer en arrière-plan | `docker-compose -f docker/docker-compose.yml up -d` |
| Arrêter le projet | `docker-compose -f docker/docker-compose.yml down` |

### Accéder à l'application
Ouvrir un navigateur et aller sur :
```
http://localhost:80
```

## 👨‍💻 Développeurs
<div align="center">
<table>
  <tr>
    <td align="center">
      <a href="https://github.com/m0bley-git" style="text-decoration: none;">
        <img src="https://github.com/m0bley-git.png" width="100px;" alt="m0bley-git"/><br />
        <sub><b>Wilstan</b></sub><br/>
        <sub>Dev Frontend</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/jr534" style="text-decoration: none;">
        <img src="https://github.com/jr534.png" width="100px;" alt="jr534"/><br />
        <sub><b>Jean</b></sub><br/>
        <sub>Dev Backend</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/raphaelmariet" style="text-decoration: none;">
        <img src="https://github.com/raphaelmariet.png" width="100px;" alt="raphaelmariet"/><br />
        <sub><b>Raphael</b></sub><br/>
        <sub>Dev Backend</sub>
      </a>
    </td>
  </tr>
</table>
</div>

---

<div align="center">
2025 — 2026 · Groupe 8 · CIEL 1 · Campus St Félix-La Salle, Nantes
</div>
