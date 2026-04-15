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

void squid_group::dell_member(Squidcien_session * user)
{
    m_member.removeOne(user);
}

