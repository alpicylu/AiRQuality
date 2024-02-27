#!/bin/sh

#The purpose of this script is to initialise the container with 4 registered sensors

# docker compose up -d

#Db: "mongodb://admin:password@mongo1:27017/AiRQtest?authSource=admin"

# docker exec webapp-mongo1-1 mongod

mongosh --username admin --password password --authenticationDatabase admin \
    --eval "use AiRQtest" \
    --eval "db.Sensor.insertMany( 
            [
                {
                    name: 'C2 108',
                    iqrfId: '0100'
                },
                {
                    name: 'C2 110',
                    iqrfId: '0200'
                },
                {
                    name: 'C2 218',
                    iqrfId: '0400'
                },
                {
                    name: 'C2 310',
                    iqrfId: '0500'
                }
            ]
        )"