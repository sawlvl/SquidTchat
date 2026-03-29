#include "squidserver.h"
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
