
if ! command -v docker-compose &> /dev/null
then
    docker compose  up -d
else
    docker-compose  up -d
fi

docker exec keycloak /bin/sh -c "cd /opt/keycloak/bin;./kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin;...;./kcadm.sh update realms/master -s sslRequired=NONE"