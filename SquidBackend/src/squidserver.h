#ifndef SQUIDSERVER_H
#define SQUIDSERVER_H
#include <QObject>
#include <QWebSocketServer>
#include <QWebSocket>
#include <QMap>
#include <QString>
#include "squidcien_session.h"
#include "squid_group.h"
#include <QList>


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
    void research(QString recherche);
    void group_maker(const QString& admin, const QStringList& member_usernames, const QString& name);
    void group_user_cleaner(Squidcien_session* session);
    void on_group_leave_requested(QString user_name, QString group_name, Squidcien_session* session);
    void brodcast_message_group(QString message_g,QString group,Squidcien_session* session);
    void add_b_word(QString b_word,QString group_name,Squidcien_session* session);
    void dell_b_word(QString b_word,QString group_name,Squidcien_session* session);
    void kick_user(QString taget_user,QString group_name,Squidcien_session* session);
    void grp_info (QString group_name,Squidcien_session* session);
    void grp_admin_info (QString group_name,Squidcien_session* session);


    QWebSocketServer *m_pserver;
    Squidcien_session *m_pnewclient;
    squid_group *m_p_groupe;
    int porte;
    QMap<QString, Squidcien_session*> User_autentifier;
    QList<Squidcien_session*> User_No_autentifier;

    //nom group | pointeur
    QMap<QString,squid_group*> Group;


private slots:
    void New_Connection();
    void client_disconnected(QString user_name);

};

#endif // SQUIDSERVER_H
