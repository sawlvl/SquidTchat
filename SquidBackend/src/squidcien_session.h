#ifndef SQUIDCIEN_SESSION_H
#define SQUIDCIEN_SESSION_H
#include <QObject>
#include <QWebSocket>
#include <QMap>
#include <QString>
#include <QJsonDocument>   // Pour manipuler le document global
#include <QJsonObject>     // Pour les structures { "cle": "valeur" }
#include <QJsonArray>      // Si tu as des listes [ ... ]
#include <QJsonValue>      // Pour manipuler une donnée précise
#include <QJsonParseError> // TRES important pour savoir pourquoi ça crash

class Squidcien_session : public QObject
{
    Q_OBJECT


public:
    explicit Squidcien_session(QWebSocket *socket, QObject *parent = nullptr);
    bool pseudo_autorise(const QString pseudo);
    void setUser_name(QString User_name);
    void add_MP_in_Histroy(QString frome_User_name,QString message);
    void sendMessage(const QString &message);
    void get_autentifier();
    QString sendError(const QString &source_error, const QString &type);
    void recherche_rep(QStringList resulta);
    QString get_user_name();
    QString sendInfo_S(const QString &source_error, const QString &status,QString group_name);
signals:
    void signal_autentifier(QString user_name );
    void signal_message_fro_forum(QString message_f);
    void signal_message_for_mp (QString message_mp,QString user_name_mptarget);
    void signal_recherche (QString research);
    void signal_disconnected(QString user_name);
    void signal_group_make(QString admin,QStringList  memebre_user_name,QString name);
    void signal_group_leave(QString user_name,QString groupe_name,Squidcien_session* p_session);
    void signal_message_for_groupe(QString message_g,QString groupe,Squidcien_session* session);
    void signal_add_b_word(QString b_words,QString group_name,Squidcien_session* session);
    void signal_dell_b_word(QString b_words,QString group_name,Squidcien_session* session);
    void signal_kick_user_grp(QString taget_user,QString group_name,Squidcien_session* session);
    void signal_info(QString group_name,Squidcien_session* session);
    void signal_admin_info(QString group_name,Squidcien_session* session);

private:
    void send_f_presencecome();
    bool m_autentifier;
    QString m_User_name;
    QWebSocket *m_pclient;


private slots:
    void onMessageReceived(const QString &message);
    void Disconnected();

public slots:
    void user_data_update(bool server_status,QString User_name);
};

#endif // SQUIDCIEN_SESSION_H
