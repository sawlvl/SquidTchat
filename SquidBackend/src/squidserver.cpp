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

        // connect creation de groupe
        connect(m_pnewclient, &Squidcien_session::signal_group_make,this, &SquidServer::group_maker);

        // connect sortie groupe
        connect(m_pnewclient, &Squidcien_session::signal_group_leave,this, &SquidServer::on_group_leave_requested);

        // connect pour l'est envois de message dans les groupe
        connect(m_pnewclient, &Squidcien_session::signal_message_for_groupe,this, &SquidServer::brodcast_message_group);

        //connect pour l'ajout de mot bloquer dans les grp
        connect(m_pnewclient, &Squidcien_session::signal_add_b_word,this, &SquidServer::add_b_word);

        //connect pour sup des mot bloquer dans les grp
        connect(m_pnewclient, &Squidcien_session::signal_dell_b_word,this, &SquidServer::dell_b_word);

        //connect qu'un admin kick un user d'un grp
        connect(m_pnewclient, &Squidcien_session::signal_kick_user_grp,this, &SquidServer::kick_user);


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

    for (Squidcien_session* session : User_autentifier.values()) {

        if (session) {
            session->sendMessage(message_f);
        }
    }
}

void SquidServer::brodcast_message_group(QString message_g,QString group,Squidcien_session* session)
{
    QString message_g_from_bloked_word;
        squid_group* groupe=Group.value(group);
    if (!groupe){
        qDebug() << "le groupe a etaite detrue ou n'a jamais exister .donc il est imposible d'envoyer un message dans le group " ;
        return;
    }
    if(!(session==groupe->get_p_admin())){
        for (const QString &b_word : groupe->get_b_words()) {
            message_g.replace(b_word, QString(b_word.length(), '*'), Qt::CaseInsensitive);
        }

        message_g_from_bloked_word = QJsonDocument(QJsonObject{
                                                       {"type",      "grp/send"},
                                                       {"timestamp", QDateTime::currentDateTimeUtc().toString(Qt::ISODate)},
                                                       {"payload",   QJsonObject{
                                                                       {"from",       session->get_user_name()},
                                                                       {"group_name", group},
                                                                       {"content",    message_g}
                                                                   }}
                                                   }).toJson(QJsonDocument::Compact);

    }else{
        message_g_from_bloked_word = QJsonDocument(QJsonObject{
                                                       {"type",      "grp/send"},
                                                       {"timestamp", QDateTime::currentDateTimeUtc().toString(Qt::ISODate)},
                                                       {"payload",   QJsonObject{
                                                                       {"from",       session->get_user_name()},
                                                                       {"group_name", group},
                                                                       {"content",    message_g}
                                                                   }}
                                                   }).toJson(QJsonDocument::Compact);

    }

    if (groupe->get_p_member().contains(session)){
        qDebug() << "envois du message  :" << message_g_from_bloked_word << " dans le groupe "<< groupe->get_name() << " .";

        for (Squidcien_session* destinataire : groupe->get_p_member()) {

            if (destinataire) {
                destinataire->sendMessage(message_g_from_bloked_word);
            }
        }
    }

}


void SquidServer::client_disconnected(QString user_name){
    Squidcien_session* session = qobject_cast<Squidcien_session*>(sender());
    if (!user_name.isEmpty()) {
        User_autentifier.remove(user_name);
        qDebug() << "Utilisateur retiré :" << user_name;
    }

    if (session) {
        disconnect(this, nullptr, session, nullptr);

        group_user_cleaner(session);

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

    //nom grp est pas comforme
    if (name.trimmed().isEmpty() || name.contains(QRegularExpression("[A-Z]")) ) {
        QString error = "Erreur : Le nom du groupe n'est pas au norme de la platforme.";
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
            if  (p_admin==session){
                QString warn ="Erreur : L'administrateur a fermé le groupe.";
                QString status= "group_closed";
                brodcast_message_group(session->sendInfo_S(warn,status,groupe->get_name()),groupe->get_name(),session);
                Grp_dell.append(groupe);
            }else{
                for (Squidcien_session* user : groupe->get_p_member()) {



                    if (user==session){
                        qDebug() << "le membre " << session->get_user_name() << " vas etre suprimer du grp " << groupe->get_name() ;
                        QString warn ="Erreur : L'utilisateur "+session->get_user_name()+" a quitté le groupe.";
                        QString status= "user_leave";
                        brodcast_message_group(session->sendInfo_S(warn,status,groupe->get_name()),groupe->get_name(),session);
                        groupe->dell_member(session);
                        break;
                    }}
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
void SquidServer::on_group_leave_requested(QString user_name, QString group_name, Squidcien_session* session)
{
    // if nulptr
    if (!session) {
        qDebug() << "Erreur : Tentative de quitter le groupe avec une session nulle.";
        return;
    }

    squid_group* groupe = Group.value(group_name, nullptr);
    // if nulptr
    if (!groupe) {
        qDebug() << "Erreur : Le groupe" << group_name << "n'existe pas.";
        return;
    }

    if (groupe->get_p_admin() == session) {
        qDebug() << "L'admin" << user_name << "quitte le groupe" << group_name << "-> Dissolution.";

        Group.remove(group_name);
        groupe->deleteLater();
    }
    else {
        qDebug() << "Le membre" << user_name << "quitte le groupe" << group_name;
        groupe->dell_member(session);
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

void SquidServer::add_b_word(QString b_word,QString group_name,Squidcien_session* session){

    if (!session){
        qDebug() << "L'user a l'inistiative de la demande de add_b_word c'est déconecter la demande a donc etais anuler";
        return;
    }
    squid_group* p_groupe=Group.value(group_name);
    if (!p_groupe){
        qDebug() << "le groupe a etaite detrue ou n'a jamais exister .donc il est imposible d'envoyer un message dans le group";
        return;
    }
    if (session==p_groupe->get_p_admin()){
        p_groupe->add_b_words(b_word);
        QString warn ="L'admin a ajouter "+b_word+" de la liste des contenue bloquer";
        QString status= "word_blocked";
        brodcast_message_group(session->sendInfo_S(warn,status,p_groupe->get_name()),p_groupe->get_name(),session);
    }else{
        QString reponc = "Erreur : Vous devez avoir les droits admin pour faire cela.";
        QString type_ack = "grp/no_permit";
        session->sendMessage(session->sendError(reponc,type_ack));
    }
}

void SquidServer::dell_b_word(QString b_word,QString group_name,Squidcien_session* session){

    if (!session){
        qDebug() << "L'user a l'inistiative de la demande de dell_b_word c'est déconecter la demande a donc etais anuler";
        return;
    }
    squid_group* p_groupe=Group.value(group_name);
    if (!p_groupe){
        qDebug() << "le groupe a etaite detrue ou n'a jamais exister .donc il est imposible d'envoyer un message dans le group";
        return;
    }
    if (session==p_groupe->get_p_admin()){
        p_groupe->dell_b_words(b_word);
        QString warn ="L'admin a suprimée "+b_word+" de la liste des contenue bloquer";
        QString status= "word_unblocked";
        brodcast_message_group(session->sendInfo_S(warn,status,p_groupe->get_name()),p_groupe->get_name(),session);
    }else{
        QString reponc = "Erreur : Vous devez avoir les droits admin pour faire cela.";
        QString type_ack = "grp/user_not_found";
        session->sendMessage(session->sendError(reponc,type_ack));
    }
}

void SquidServer::kick_user(QString taget_user, QString group_name, Squidcien_session *session)
{
    if (!session){
        qDebug() << "L'user a l'inistiative de la demande de kick c'est déconecter la demande pour " << group_name << " a donc etais anuler";
        return;
    }
    squid_group* p_groupe=Group.value(group_name);
    if (!p_groupe){
        qDebug() << "le groupe a etaite detrue ou n'a jamais exister .donc il est imposible d'envoyer un message dans le group";
        return;
    }


    Squidcien_session* p_taget_user=User_autentifier.value(taget_user);

    if (!p_taget_user){
        qDebug() << "le groupe a etaite detrue ou n'a jamais exister .donc il est imposible d'envoyer un message dans le group";
        QString reponc = "Erreur : Vous devez avoir les droits admin pour faire cela.";
        QString type_ack = "grp/no_permit";
        session->sendMessage(session->sendError(reponc,type_ack));
        return;
    }
    if (session==p_groupe->get_p_admin()){
        p_groupe->dell_member(p_taget_user);
        QString warn ="L'utilisateur "+taget_user+" a été expulsé par l'admin.";
        QString status= "user_kicked";
        brodcast_message_group(session->sendInfo_S(warn,status,p_groupe->get_name()),p_groupe->get_name(),session);
    }else{
        QString reponc = "Erreur : Vous devez avoir les droits admin pour faire cela.";
        QString type_ack = "grp/no_permit";
        session->sendMessage(session->sendError(reponc,type_ack));
    }
}
