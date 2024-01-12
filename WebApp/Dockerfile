FROM node:20.11-alpine

WORKDIR /app 

COPY ./package*.json ./

RUN npm install 

# establish the DB schema and generate the client
RUN npx prisma db push 
RUN npx prisma generate

RUN npx nuxt build

CMD ["node", ".output/server/index.mjs"]

