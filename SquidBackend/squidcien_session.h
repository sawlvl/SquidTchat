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

    void setUser_name(QString User_name);
    void add_MP_in_Histroy(QString frome_User_name,QString message);
    void sendMessage(const QString &message);
    void get_autentifier();
private:
    bool m_autentifier;
    QString m_User_name;
    QWebSocket *m_pclient;
    //   Username Liste_message
    QMap <QString,QStringList> m_MP_histroy;
private slots:
        void onMessageReceived(const QString &message);

};

#endif // SQUIDCIEN_SESSION_H
