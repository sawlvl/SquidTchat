#ifndef SQUIDSERVER_H
#define SQUIDSERVER_H
#include <QObject>
#include <QWebSocketServer>
#include <QWebSocket>
#include <QMap>
#include <QString>
#include "squidcien_session.h"
#include <QList>
#include <QRegularExpression> // --- Filtre message----//


class SquidServer : public QObject
{
    Q_OBJECT
public:
    explicit SquidServer(QObject *parent = nullptr);
    void start_SquidServer (int porte);
signals:
    void signal_user_name_status(bool status ,QString User_name);
    //void signal_message_mp()
private:
    void user_name_already_use (QString User_name);
    void brodcast_message_f(QString message_f);
    void mp_message(QString message_mp,QString user_name_mptarget);

    QString filtrerMessage(const QString &message); // --- Filtre message----//

    QWebSocketServer *m_pserver;
    Squidcien_session *m_pnewclient;
    int porte;
    QMap<QString, Squidcien_session*> User_autentifier;
    QList<Squidcien_session*> User_No_autentifier;

private slots:
    void New_Connection();

};

#endif // SQUIDSERVER_H
