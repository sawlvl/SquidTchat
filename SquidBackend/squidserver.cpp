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
    connect(m_pserver, &QWebSocketServer::newConnection,
            this, &SquidServer::New_Connection);

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
    connect(m_pnewclient,&Squidcien_session::signal_autentifier,this,&sortir_attente);
    User_No_autentifier.append(m_pnewclient);
    qDebug() << "Le nouvaux est passer dans la fille d'attant";
    }
}

void SquidServer::sortir_attente (QString User_name){
    qDebug() <<  User_name;
}
