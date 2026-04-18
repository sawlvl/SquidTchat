#include "squidserver.h"
#include "squid_group.h"

#include <QObject>
#include <QWebSocketServer>
#include <QMap>
#include <QString>
#include <QList>
#include <QPointer>


SquidServer::SquidServer(QObject *parent): QObject(parent), m_pserver(nullptr)
{

}

void SquidServer::start_SquidServer(int porte)
{
    m_pserver = new QWebSocketServer(QStringLiteral("SquidChat"),QWebSocketServer::NonSecureMode);

    // C'est ici qu'on connecte le serveur à ton slot New_Connection
    connect(m_pserver, &QWebSocketServer::newConnection,this, &SquidServer::New_Connection);




    if (m_pserver->listen(QHostAddress::Any, porte)) {
        qDebug() << "Serveur lancé sur le port" << porte;
    }else{
        qDebug() << "Erreur: Le port" << porte << "est probablement en cours d'utilisation par un autre processus.";
    }
}

void SquidServer::New_Connection()
{
    QWebSocket *pSocket = m_pserver->nextPendingConnection();

    if (pSocket){
        qDebug() << "nouvaux Squid Client";
        m_pnewclient = new Squidcien_session(pSocket);

        // connect pour les pseudo deja utiliser  et +
        connect(m_pnewclient,&Squidcien_session::signal_autentifier,this,&SquidServer::user_name_already_use);

        // connect de réponce pour les pseudo deja utiliser et +
        connect(this, &SquidServer::signal_user_name_status,
                m_pnewclient, &Squidcien_session::user_data_update);

        // connect pour les message pour le forum général
        connect(m_pnewclient,&Squidcien_session::signal_message_fro_forum,this,&SquidServer::brodcast_message_f);

        // connect pour les message pour les mp
        connect(m_pnewclient,&Squidcien_session::signal_message_for_mp,this,&SquidServer::mp_message);

        // connect research
        connect(m_pnewclient,&Squidcien_session::signal_recherche,this,&SquidServer::research);

        // connect gestion de la deconextion sortie des liste
        connect(m_pnewclient, &Squidcien_session::signal_disconnected,this, &SquidServer::client_disconnected);

        // connect creation de group
        connect(m_pnewclient, &Squidcien_session::signal_group_make,this, &SquidServer::group_maker);

        User_No_autentifier.append(m_pnewclient);
        qDebug() << "Le nouvaux est passer dans la fille d'attant";
    }
}
void SquidServer::user_name_already_use (QString User_name){
    bool value = false;
    if (User_autentifier.contains(User_name))
    {
        // Cas 1 : USER NAME déjà utilisée
        // puis renvoyer une erreur au client
        value = true;
        emit(signal_user_name_status(value,User_name));
    }
    else
    {
        // Cas 2 : USER NAME introuvable → nouveau user, on peut l'enregistrer
        // puis créer la session et l'insérer dans la map
        Squidcien_session* client_actuel = qobject_cast<Squidcien_session*>(sender());

        if (client_actuel) {
            User_autentifier.insert(User_name, client_actuel);
        }

        emit(signal_user_name_status(value,User_name));


    }
}

void SquidServer::research(QString recherche){
    QStringList resultats;
    QList<QString> all_user_name = User_autentifier.keys();

    for (const QString &user_name : std::as_const(all_user_name)) {
        if (user_name.contains(recherche)) {
            resultats.append(user_name);
        }
    }
    Squidcien_session* client_actuel = qobject_cast<Squidcien_session*>(sender());
    qDebug() << resultats;
    client_actuel->recherche_rep(resultats);

}

void SquidServer::brodcast_message_f(QString message_f)
{
    qDebug() << "Broadcast du message forum :" << message_f;

    // On parcourt tous les objets Squidcien_session stockés dans la Map
    for (Squidcien_session* session : User_autentifier.values()) {

        // On vérifie toujours que le pointeur n'est pas nul (sécurité enfant)
        if (session) {
            session->sendMessage(message_f);
        }
    }
}

void SquidServer::client_disconnected(QString user_name){
    Squidcien_session* session = qobject_cast<Squidcien_session*>(sender());
    //securiter pour ne pas sup 2 fois
    if (!user_name.isEmpty()) {
        // Utilisateur authentifié → on le retire de la map principale
        User_autentifier.remove(user_name);
        qDebug() << "Utilisateur retiré :" << user_name;
    }

    if (session) {
        // arrache tous les connect avec la mort pur est simple
        disconnect(this, nullptr, session, nullptr);

        // supprestion de l'user dans les grp et des grp ou il est admin
        group_user_cleaner(session);

        // Dans tous les cas → retirer de la file d'attente (authentifié ou non)
        User_No_autentifier.removeAll(session);
        session->deleteLater(); // libère la session proprement
    }
}
// constriction  de grp optmiser pour ne pas copier les élemnt qui ne sont pas modifier
void SquidServer::group_maker(const QString& admin, const QStringList& member_usernames, const QString& name)
{
// rappel les return dans un void c'est un nuke de la fonction
    if (!User_autentifier.contains(admin))
        return;

    Squidcien_session* sender_session = qobject_cast<Squidcien_session*>(sender());
    if (!sender_session)
        return;

    Squidcien_session* admin_session = User_autentifier.value(admin);
    QList<Squidcien_session*> member_sessions;
    QStringList unknown_members;

    // connectés vs hors ligne
    for (const QString& username : member_usernames) {
        if (User_autentifier.contains(username))
            member_sessions.append(User_autentifier.value(username));
        else
            unknown_members.append(username);
    }

    // aucun membre connecté
    if (member_sessions.isEmpty()) {
        QString error = "Erreur : Au moins un membre connecté requis (hors créateur).";
        sender_session->sendMessage(sender_session->sendError(error, "grp/create_error"));
        return;
    }

    // nom de groupe déjà pris
    if (Group.contains(name)) {
        QString error = "Erreur : Le nom du groupe est déjà pris.";
        sender_session->sendMessage(sender_session->sendError(error, "grp/create_error"));
        return;
    }

    // Création du groupe — l'admin est inclus comme membre
    member_sessions.prepend(admin_session);
    m_p_groupe = new squid_group(name, admin_session, member_sessions);
    Group.insert(name, m_p_groupe);

    // certains membres étaient hors ligne
    if (!unknown_members.isEmpty()) {
        QString warn = "Groupe créé, mais ces utilisateurs sont hors ligne : "
                       + unknown_members.join(", ");
        sender_session->sendMessage(sender_session->sendError(warn, "grp/create_warn"));
        return;
    }

    // ACK succès complet
    QJsonObject payload;
    payload["group_name"] = name;
    payload["status"]     = "ok";

    QJsonObject root;
    root["type"]      = "grp/create_ack";
    root["timestamp"] = QDateTime::currentDateTimeUtc().toString(Qt::ISODate);
    root["payload"]   = payload;

    sender_session->sendMessage(QJsonDocument(root).toJson(QJsonDocument::Compact));
}

void SquidServer::group_user_cleaner(Squidcien_session *session)
{
    QList <squid_group*> Grp_dell;
    for (squid_group* groupe : Group.values()) {
        if (groupe){
            Squidcien_session* p_admin = groupe->get_p_admin();
            for (Squidcien_session* user : groupe->get_p_member()) {
                if (user==session){
                    qDebug() << "le membre " << session->get_user_name() << " vas etre suprimer du grp " << groupe->get_name() ;
                    groupe->dell_member(session);
                    break;
                }
            }

            if  (p_admin==session){
                Grp_dell.append(groupe);
            }
        }
    }
    if (!Grp_dell.isEmpty()){
        for (squid_group* groupe : Grp_dell) {
            Group.remove(groupe->get_name());
            qDebug() << "le group " << groupe->get_name() << " vas etre suprimer.";
            groupe->deleteLater();

        }
    }
}
void SquidServer::mp_message(QString message_mp, QString user_name_mptarget)
{
    // 2. Recherche optimisée (ne parcourt l'arbre qu'une seule fois)
    auto it = User_autentifier.constFind(user_name_mptarget);

    // 3. Vérification de l'existence
    if (it != User_autentifier.constEnd()) {
        // Succès : on récupère le pointeur
        Squidcien_session* session = it.value();

        // Vérification point n'est pas a nul PTR
        if (session) {
            session->sendMessage(message_mp);
        }
    } else {
        // Échec : l'user n'est pas la
        Squidcien_session* client_actuel = qobject_cast<Squidcien_session*>(sender());
        // Vérification point n'est pas a nul PTR
        if (client_actuel) {
            QString reponc = "Erreur : utilisateur non trouver";
            QString type_ack = "mp/error";
            client_actuel->sendMessage(client_actuel->sendError(reponc,type_ack));
        }
    }
}
