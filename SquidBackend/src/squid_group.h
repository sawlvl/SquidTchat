#ifndef SQUID_GROUP_H
#define SQUID_GROUP_H
#include <QStringList>
#include <QObject>
#include <QObject>
#include <QWebSocketServer>
#include <QMap>
#include <QString>
#include <QList>
#include <QPointer>
#include <QJsonDocument>   // Pour manipuler le document global
#include <QJsonObject>     // Pour les structures { "cle": "valeur" }
#include <QJsonArray>      // Si tu as des listes [ ... ]
#include <QJsonValue>      // Pour manipuler une donnée précise
#include <QJsonParseError> // TRES important pour savoir pourquoi ça crash
#include <QStringList>
#include "squidcien_session.h"
class squid_group : public QObject
{
    Q_OBJECT
public:
        explicit squid_group(const QString &nom, Squidcien_session* admin, const QList<Squidcien_session*> &members, QObject *parent = nullptr);

    QString get_name();
    Squidcien_session* get_p_admin();
    QList <Squidcien_session*> get_p_member();
    QStringList  get_b_words();
    void add_b_words(QString b_word);
    void dell_b_words(QString b_word);
    void dell_member(Squidcien_session* user);

private:
    QList<Squidcien_session*> m_member;
    QStringList  b_words_list;
    Squidcien_session* m_admin;
    QString m_nom;



signals:
};

#endif // SQUID_GROUP_H
