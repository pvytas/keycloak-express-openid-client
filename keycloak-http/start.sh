t
if ! command -v docker-compose &> /dev/null
then
    docker compose  up -d
else
    docker-compose  up -d
fi

# sleep 1
# docker exec -it keycloak /bin/bash -c 'cd /opt/keycloak/bin; ./kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin; ./kcadm.sh update realms/master -s sslRequired=NONE'
sleep 5
docker exec -it keycloak /opt/keycloak/utils/disable_https.sh
