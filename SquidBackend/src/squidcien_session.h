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
signals:
    void signal_autentifier(QString user_name );
    void signal_message_fro_forum(QString message_f);
    void signal_message_for_mp (QString message_mp,QString user_name_mptarget);
    void signal_recherche (QString research);
    void signal_disconnected(QString user_name);
    void signal_group_make(QString admin,QStringList  memebre_user_name,QString name);

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
