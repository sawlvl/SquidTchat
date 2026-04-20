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

    //connect pour les gesiton de deco TCP close
    connect(m_pclient, &QWebSocket::disconnected, this, &Squidcien_session::Disconnected);

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
                    QString reponc = "Erreur : autentifier vous avant";
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
                                                                        {"payload",QJsonObject{{"from",m_User_name},
                                                                                                {"content",message_mp}}}}).toJson(QJsonDocument::Compact);

                    emit signal_message_for_mp(message_mp_from,user_name_mptarget);

                }else{
                    QString reponc = "Erreur : autentifier vous avant";
                    QString type_ack = "forum/send";
                    QString message = sendError(reponc, type_ack);
                    sendMessage(message);
                }}
            if (type == "users/list"){

                if (m_autentifier){

                    QString research=payload["research"].toString();
                    emit signal_recherche(research);


                }else{
                    QString reponc = "Erreur : autentifier vous au avant";
                    QString type_ack = "users/list";
                    QString message = sendError(reponc, type_ack);
                    sendMessage(message);
                }
            }
            if (type.contains("grp/")){
                if (m_autentifier){
                    if (type == "grp/create"){



                        QString group_name=payload["group_name"].toString();

                        // Extraction du tableau "members"
                        QJsonArray membersArray = payload["members"].toArray();
                        QStringList membersList;

                        for (const QJsonValue &value :  std::as_const(membersArray)) {
                            if (m_User_name == value) {
                                // eviter avoir 2 vois l'admin dans la liste de membre
                                continue;
                            }
                            membersList << value.toString();

                        }

                        emit signal_group_make(m_User_name,membersList,group_name);



                    }
                    if (type=="grp/leave"){

                        QString group_name=payload["group_name"].toString();

                        emit signal_group_leave(m_User_name,group_name,this);

                    }

                    if (type=="grp/close"){

                        QString group_name=payload["group_name"].toString();

                        emit signal_group_leave(m_User_name,group_name,this);

                    }

                    if (type=="grp/send"){
                        QString group_name=payload["group_name"].toString();
                        QString message_g=payload["content"].toString();

                        emit signal_message_for_groupe (message_g,group_name,this);

                    }

                    if (type=="grp/add_b_word"){
                        QString b_words=payload["word"].toString();
                        QString group_name=payload["group_name"].toString();

                        emit signal_add_b_word(b_words,group_name,this);
                    }

                    if (type=="grp/dell_b_word"){
                        QString b_words=payload["word"].toString();
                        QString group_name=payload["group_name"].toString();

                        emit signal_dell_b_word(b_words,group_name,this);
                    }

                    if (type=="grp/kick"){
                        QString taget_user=payload["taget_user"].toString();
                        QString group_name=payload["group_name"].toString();

                        emit signal_kick_user_grp(taget_user,group_name,this);
                    }
                    if (type=="grp/info"){
                        QString group_name=payload["group_name"].toString();

                        emit signal_info(group_name,this);

                    }
                    if (type=="grp/admin_info"){
                        QString group_name=payload["group_name"].toString();

                        emit signal_admin_info(group_name,this);
                    }


                }else{
                    QString reponc = "Erreur : autentifier vous au avant";
                    QString type_ack = "users/list";
                    QString message = sendError(reponc, type_ack);
                    sendMessage(message);
                }
            }
        }
    }

}
void Squidcien_session::Disconnected(){
    QJsonObject payload;
    payload["pseudo"] = m_User_name;

    QJsonObject root;
    root["type"] = "presence/left";
    root["timestamp"] = QDateTime::currentDateTimeUtc().toString(Qt::ISODate);
    root["payload"] = payload;

    QJsonDocument doc(root);
    QString jsonString = QString::fromUtf8(doc.toJson(QJsonDocument::Compact));
    emit signal_message_fro_forum(jsonString);
    qDebug() << "Squid Client déconnecté :" << (m_User_name.isEmpty() ? "(non authentifié)" : m_User_name);
    emit signal_disconnected(m_User_name); // signial pour la suprestion des liste
    m_pclient->deleteLater(); // libère le QWebSocket proprement

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
            root["timestamp"] = QDateTime::currentDateTimeUtc().toString(Qt::ISODate);
            root["payload"] = payload;

            QJsonDocument doc(root);
            QString jsonString = QString::fromUtf8(doc.toJson(QJsonDocument::Compact));


            sendMessage(jsonString);

            send_f_presencecome();//send the notif to the forum hi am heer
        }
    }
}
void Squidcien_session::send_f_presencecome(){
    if (m_autentifier==true){
        QJsonObject payload;
        payload["pseudo"] = m_User_name;

        QJsonObject root;
        root["type"] = "presence/come";
        root["timestamp"] = QDateTime::currentDateTimeUtc().toString(Qt::ISODate);
        root["payload"] = payload;

        QJsonDocument doc(root);
        QString jsonString = QString::fromUtf8(doc.toJson(QJsonDocument::Compact));
        emit signal_message_fro_forum(jsonString);
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

QString Squidcien_session::sendInfo_S(const QString &source_error, const QString &status,QString group_name) {
    QJsonObject payload;
    payload["status"] = status;
    payload["raison"] = source_error;
    payload["group_name"] = group_name;

    QJsonObject racine;
    racine["type"] = "grp/system_info";
    racine["timestamp"] = QDateTime::currentDateTimeUtc().toString(Qt::ISODate);
    racine["payload"] = payload;

    QJsonDocument doc(racine);
    return doc.toJson(QJsonDocument::Indented);
}

void Squidcien_session::recherche_rep(QStringList resulta){
    QJsonObject payload;
    payload["users"] = QJsonArray::fromStringList(resulta);

    QJsonObject root;
    root["type"] = "users/list";
    root["timestamp"] = QDateTime::currentDateTimeUtc().toString(Qt::ISODate);
    root["payload"] = payload;

    QJsonDocument doc(root);
    QString jsonString = QString::fromUtf8(doc.toJson(QJsonDocument::Compact));

    sendMessage(jsonString);
}

QString Squidcien_session::get_user_name()
{
    return m_User_name;
}
