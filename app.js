const express = require('express');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', 
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

const app = express();
const PORT = process.env.PORT || 3000; 


const greetingMessage = process.env.GREETING_MESSAGE || "Hallo Welt (Default)!";
const dbPassword = process.env.DB_PASSWORD; 
const apiKey = process.env.API_KEY;         


const configFilePath = '/etc/app/config/app.properties';
const secretFilePath = '/etc/app/secrets/credentials.txt';

let fileConfigContent = "Nicht gefunden oder nicht gemountet.";
try {
  if (fs.existsSync(configFilePath)) {
    fileConfigContent = fs.readFileSync(configFilePath, 'utf8');
  }
} catch (err) {
  logger.warn(`Konnte Konfigurationsdatei nicht lesen: ${configFilePath}`, { error: err.message });
}

let secretFileContent = "Nicht gefunden oder nicht gemountet.";
try {
  if (fs.existsSync(secretFilePath)) {
    secretFileContent = fs.readFileSync(secretFilePath, 'utf8');
  }
} catch (err) {
  logger.warn(`Konnte Secret-Datei nicht lesen: ${secretFilePath}`, { error: err.message });
}


logger.info("===== Anwendungskonfiguration Geladen =====");
logger.info(`PORT: ${PORT}`);
logger.info(`LOG_LEVEL: ${process.env.LOG_LEVEL || 'info (default)'}`);
logger.info(`GREETING_MESSAGE (aus ENV): ${greetingMessage}`);


if (dbPassword) {
  logger.info("DB_PASSWORD (aus ENV): [GESETZT]"); 
} else {
  logger.warn("DB_PASSWORD (aus ENV): [NICHT GESETZT]");
}
if (apiKey) {
  logger.info("API_KEY (aus ENV): [GESETZT]"); 
} else {
  logger.warn("API_KEY (aus ENV): [NICHT GESETZT]");
}

logger.info(`Inhalt von ${configFilePath} (aus Volume):`);
fileConfigContent.split('\n').forEach(line => logger.info(`  ${line.trim()}`));

logger.info(`Inhalt von ${secretFilePath} (aus Volume):`);

secretFileContent.split('\n').forEach(line => logger.info(`  ${line.trim()}`));
logger.info("==========================================");


app.get('/', (req, res) => {
  res.send(`${greetingMessage} - App läuft auf Port ${PORT}. DB Passwort ist ${dbPassword ? 'gesetzt' : 'NICHT gesetzt'}. API Key ist ${apiKey ? 'gesetzt' : 'NICHT gesetzt'}.`);
});

app.get('/config-file', (req, res) => {
  res.type('text/plain').send(`Inhalt von ${configFilePath}:\n\n${fileConfigContent}`);
});

app.get('/secret-file', (req, res) => {
  res.type('text/plain').send(`Inhalt von ${secretFilePath}:\n\n${secretFileContent}`);
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Einfache Konfig-App gestartet und lauscht auf Port ${PORT}`);
});
