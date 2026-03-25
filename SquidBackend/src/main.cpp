#include <QCoreApplication>
#include "squidserver.h"

int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);
    // 1. Instanciation (le 'a' sert de parent pour gérer la mémoire)
    SquidServer server(&a);
    server.start_SquidServer(1234);
    return a.exec();
}
