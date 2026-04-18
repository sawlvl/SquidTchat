#include "squid_group.h"
#include "squidcien_session.h"

squid_group::squid_group(const QString &nom, Squidcien_session* admin, const QList<Squidcien_session*> &members, QObject *parent)
    : QObject{parent}
{
    m_nom = nom;
    m_admin = admin;
    m_member = members;
    b_words_list = {};

    qDebug() << " le group " << m_nom << " a comme admin " << m_admin->get_user_name() << " et a " << m_member.length() << " memebers";
}

QString squid_group::get_name()
{
    return m_nom;
}

Squidcien_session* squid_group::get_p_admin()
{
    return m_admin ;
}

QList<Squidcien_session *> squid_group::get_p_member()
{
    return m_member;
}

QStringList squid_group::get_b_words()
{
    return b_words_list;
}

void squid_group::add_b_words(QString b_word)
{
    b_words_list.append(b_word);
}

void squid_group::dell_b_words(QString b_word)
{
    b_words_list.removeOne(b_word);
}

void squid_group::dell_member(Squidcien_session * user)
{
    m_member.removeOne(user);
}

