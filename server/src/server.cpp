#include "server.h"

bool pseudo_autorise(std::string username) { //Modif de Raphaël
    // Pour l'instant, on accepte tout par défaut 
    // afin de ne pas bloquer le site pendant le développement.
    return true; 
}

