#include "squidcien_session.h"
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

Squidcien_session::Squidcien_session(QWebSocket *pclient, QObject *parent){
    m_autentifier=false;
    m_pclient=pclient;
    m_User_name="";
    connect(m_pclient, &QWebSocket::textMessageReceived, this, &Squidcien_session::onMessageReceived);
    //a fix pour le nom user deja utiliser \/


}
void Squidcien_session::onMessageReceived(const QString &message)
{
    // message contient ici le texte envoyé par le client
    qDebug() << "Message reçu du Squid Client :" << message;
    // début trantement JSON
    QString reponc="";
    QString pseudo="";
    QJsonDocument doc = QJsonDocument::fromJson(message.toUtf8());
    if (doc.isNull() || !doc.isObject()) {
        reponc = "Erreur : Le JSON est corrompu ou mal formé ou vide.";
    }else{
        QJsonObject root = doc.object();

        QString type = root["type"].toString();

        // oute pseudo
        if (root.contains("payload") && root["payload"].isObject()) {
            QJsonObject payload = root["payload"].toObject();
            //  Type chec
            if(type == "auth/register"){
                pseudo = payload["pseudo"].toString();

                if (pseudo_autorise(pseudo)) {
                    // SUCCÈS : Le pseudo est bon, on valide l'authentification.
                    qDebug() << "Nouvelle tentative d'inscription acceptee pour :" << pseudo;
                    m_User_name = pseudo;
                    emit signal_autentifier(m_User_name);

                } else {
                    // ÉCHEC : Le pseudo est banni (ex: admin, root). On le rejette.
                    QString reponc = "Erreur : Le nom d'utilisateur n'est pas aux normes de la plateforme";
                    QString type_ack = "auth/ack"; // Renommé pour ne pas écraser la variable 'type' parente
                    QString message = sendError(reponc, type_ack);
                    sendMessage(message);
                }
            }

            if(type == "forum/send"){
                if (m_autentifier){
                //gestion des message pour le forum

                QString message_f = payload["content"].toString();
                //Fonction de raphaelle add_username_for_f

                QString message_f_from = QJsonDocument(QJsonObject{{"type","forum/send"}
                ,{"timestamp",QDateTime::currentDateTimeUtc().toString(Qt::ISODate)},
                {"payload",QJsonObject{{"from",m_User_name},{"content",message_f}}}})
                .toJson(QJsonDocument::Compact);


                emit signal_message_fro_forum(message_f_from);
                }else{
                    QString reponc = "Erreur : autentifier vous au avant";
                    QString type_ack = "forum/send";
                    QString message = sendError(reponc, type_ack);
                    sendMessage(message);
                }
            }
            if (type == "mp/send"){

                if (m_autentifier){

                QString message_mp=payload["content"].toString();
                QString user_name_mptarget=payload["to"].toString();

                QString message_mp_from = QJsonDocument(QJsonObject{{"type","mp/message"},
                {"timestamp",QDateTime::currentDateTimeUtc().toString(Qt::ISODate)},
                {"payload",QJsonObject{{"from",m_User_name},{"content",message_mp}}}}).toJson(QJsonDocument::Compact);

                emit signal_message_for_mp(message_mp_from,user_name_mptarget);

                }else{
                    QString reponc = "Erreur : autentifier vous au avant";
                    QString type_ack = "forum/send";
                    QString message = sendError(reponc, type_ack);
                    sendMessage(message);
                }
            }
        }
    }
}


    void Squidcien_session::user_data_update(bool server_status,QString User_name){
        if (User_name==m_User_name && m_autentifier==false ){
            if(server_status){
                //traiter erreur
                QString reponc="Erreur : le nom d'utilisateur est deja utiliser";
                QString type = "auth/ack";
                QString message = sendError(reponc,type);
                sendMessage(message);
                qDebug() << "L'utilisateur " << m_User_name << "et rejeter car le nom d'utilisateur est deja utiliser ";


            }else{

                m_autentifier=true;
                qDebug() << "L'utilisateur " << m_User_name << " est authentifier";
                QJsonObject payload;
                payload["status"] = "ok";
                payload["pseudo"] = m_User_name;

                QJsonObject root;
                root["type"] = "auth/ack";
                root["timestamp"] = "2026-03-20T14:32:01Z"; // a a changer avec le vrais temps
                root["payload"] = payload;

                QJsonDocument doc(root);
                QString jsonString = QString::fromUtf8(doc.toJson(QJsonDocument::Compact));

                sendMessage(jsonString);
            }
        }
    }

    void Squidcien_session::sendMessage(const QString &message)
    {
        // On vérifie que le pointeur n'est pas nulptr == conextion fermer
        if (m_pclient && m_pclient->isValid()) {
            m_pclient->sendTextMessage(message);
        } else {
            qDebug() << "Erreur : Impossible d'envoyer le message, socket invalide ou déconnecté.";
        }
    }


    bool Squidcien_session::pseudo_autorise(const QString pseudo) {

        const std::vector<QString> interdits = {"admin", "root", "moderateur"};  // Création de la liste interdite

        for (const QString& mot : interdits) { // Comparaison : pseudo / liste interdite

            if (pseudo == mot) return false;

        } // Si la boucle se termine sans correspondance, le pseudo est accepté

        return true;

    }

    QString Squidcien_session::sendError(const QString &source_error, const QString &type) {
        QJsonObject payload;
        payload["status"] = "error";
        payload["reason"] = source_error;

        QJsonObject racine;
        racine["type"] = type;
        racine["timestamp"] = QDateTime::currentDateTimeUtc().toString(Qt::ISODate);
        racine["payload"] = payload;

        QJsonDocument doc(racine);
        return doc.toJson(QJsonDocument::Indented);
    }
