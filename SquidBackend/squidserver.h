#ifndef SQUIDSERVER_H
#define SQUIDSERVER_H
#include <QObject>
#include <QWebSocketServer>
#include <QWebSocket>
#include <QMap>
#include <QString>
#include "squidcien_session.h"
#include <QList>


class SquidServer : public QObject
{
    Q_OBJECT
public:
    explicit SquidServer(QObject *parent = nullptr);
    void start_SquidServer (int porte);
private:
    QWebSocketServer *m_pserver;
    Squidcien_session *m_pnewclient;
    int porte;
    QMap<QString, Squidcien_session*> User_autentifier;
    QList<Squidcien_session*> User_No_autentifier;
private slots:
    void New_Connection();

};

#endif // SQUIDSERVER_H
