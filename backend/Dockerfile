FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000
CMD sh -c "npx prisma migrate deploy && npx ts-node prisma/seed.ts && npm run start:dev"
