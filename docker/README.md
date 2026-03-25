# Docker

Ce dossier contient les fichiers de configuration Docker pour lancer le projet.


## Lancer le projet

Depuis la racine du projet :
```bash
docker-compose -f docker/docker-compose.yml up
```

Pour lancer en arrière-plan :
```bash
docker-compose -f docker/docker-compose.yml up -d
```

Pour arrêter :
```bash
docker-compose -f docker/docker-compose.yml down
```

## Prérequis

- Avoir [Docker](https://www.docker.com/products/docker-desktop) installé sur la machine

> Les fichiers Docker sont fonctionnels une fois le projet finalisé.