# Procedure d'installation - SquidTchat

## Table des matieres

1. [Objectif du document](#1-objectif-du-document)
2. [Prerequis](#2-prerequis)
3. [Installer Git](#3-installer-git)
4. [Installer Docker Desktop](#4-installer-docker-desktop)
5. [Demarrer Docker Desktop avant les conteneurs](#5-demarrer-docker-desktop-avant-les-conteneurs)
6. [Recuperer le projet SquidTchat](#6-recuperer-le-projet-squidtchat)
7. [Configurer le projet avant le lancement](#7-configurer-le-projet-avant-le-lancement)
8. [Lancer SquidTchat avec Docker](#8-lancer-squidtchat-avec-docker)
9. [Acceder a l'application](#9-acceder-a-lapplication)
10. [Arreter le projet](#10-arreter-le-projet)
11. [Depannage rapide](#11-depannage-rapide)
12. [Liens utiles](#12-liens-utiles)

Version du document : 5 avril 2026

## 1. Objectif du document

Cette procedure explique comment installer Git, installer Docker Desktop, verifier que Docker Desktop est bien demarre, puis lancer le projet SquidTchat avec Docker sous Windows.

Le document a ete concu pour etre suivi pas a pas par une personne qui installe l'environnement pour la premiere fois.

## 2. Prerequis

- Un ordinateur sous Windows 10 ou Windows 11.
- Une connexion Internet pour telecharger Git, Docker Desktop et le depot du projet.
- Les droits necessaires pour installer des logiciels sur la machine.
- Le projet SquidTchat recupere localement ou accessible depuis GitHub.
- Important : pour pouvoir lancer les conteneurs du projet, Docker Desktop doit etre ouvert et completement demarre avant l'execution des commandes Docker.

## 3. Installer Git

Git permet de cloner le depot du projet et de recuperer les mises a jour.

- Ouvrir le site officiel de Git pour Windows : <https://git-scm.com/download/win>
- Telecharger l'installateur puis l'executer.
- Conserver les options par defaut si vous n'avez pas de besoin particulier.
- Valider l'installation jusqu'a la fin de l'assistant.

Verification conseillee :

```powershell
git --version
```

## 4. Installer Docker Desktop

Docker Desktop permet de construire et lancer les conteneurs utilises par SquidTchat.

- Ouvrir la page officielle Docker Desktop : <https://www.docker.com/products/docker-desktop/>
- Consulter au besoin la documentation Windows : <https://docs.docker.com/desktop/setup/install/windows-install/>
- Telecharger l'installateur Docker Desktop pour Windows.
- Lancer l'installation puis suivre l'assistant jusqu'a la fin.
- Si l'assistant le demande, accepter l'utilisation de WSL 2 et redemarrer la machine si necessaire.

Une fois l'installation terminee, ne passez pas directement aux commandes Docker : il faut d'abord ouvrir Docker Desktop et attendre que le moteur soit pret.

## 5. Demarrer Docker Desktop avant les conteneurs

- Ouvrir l'application Docker Desktop depuis le menu Demarrer.
- Attendre la fin du chargement de l'application.
- Verifier que Docker Desktop indique qu'il est en cours d'execution.

Cette etape est indispensable : si Docker Desktop n'est pas lance, la commande de demarrage des conteneurs du projet echouera.

## 6. Recuperer le projet SquidTchat

Si le projet n'est pas deja present sur la machine, il peut etre clone depuis GitHub avec le terminal.

```powershell
git clone https://github.com/sawlvl/SquidTchat.git
cd SquidTchat
```

## 7. Configurer le projet avant le lancement

Avant de demarrer SquidTchat, il faut verifier le fichier `docker/docker-compose.yml`.

Le service `frontend` utilise une variable nommee `WS_HOST` pour construire l'URL WebSocket du backend. Cette valeur doit correspondre a l'adresse IP de la machine qui heberge le projet sur le reseau local.

```yml
environment:
  WS_HOST: "IP DE LA MACHINE"
```

## 8. Lancer SquidTchat avec Docker

Depuis la racine du projet, executer la commande suivante :

```powershell
docker compose -f docker/docker-compose.yml up --build
```

Pour lancer le projet en arriere-plan :

```powershell
docker compose -f docker/docker-compose.yml up -d --build
```

## 9. Acceder a l'application

Quand les conteneurs sont demarres, ouvrir un navigateur Web et acceder a :

```text
http://ip de la machine:8080
```

## 10. Arreter le projet

```powershell
docker compose -f docker/docker-compose.yml down
```

## 11. Depannage rapide

- Si la commande `docker` n'est pas reconnue, verifier que Docker Desktop est bien installe et lance.
- Si les conteneurs ne demarrent pas, relancer Docker Desktop puis reexecuter la commande de lancement.
- Si le port `8080` ou `1234` est deja utilise, liberer le port concerne avant de relancer le projet.
- Si l'application ne se connecte pas au backend sur le reseau local, verifier l'adresse IP renseignee dans `WS_HOST`.

## 12. Liens utiles

- [Telechargement Git pour Windows](https://git-scm.com/download/win)
- [Telechargement Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Documentation Docker Desktop pour Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Depot GitHub de SquidTchat](https://github.com/m0bley-git/SquidTchat)
