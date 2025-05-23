# k8s-config-app/Dockerfile
FROM node:lts-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY app.js .

# Die App wird auf dem Port lauschen, der über die PORT Umgebungsvariable kommt
# EXPOSE wird hier nicht zwingend benötigt, da der containerPort im K8s Manifest das steuert,
# aber es ist gute Doku.
# EXPOSE 3000 

# Standard-Port, falls PORT nicht gesetzt ist (wird aber in K8s gesetzt)
ENV PORT 3000 

CMD [ "node", "app.js" ]