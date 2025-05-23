# Reflexion: Anwendungskonfiguration mit ConfigMaps & Secrets

## 1. Warum ist es eine Best Practice, Konfiguration und sensible Daten in Kubernetes getrennt von den Docker Images zu speichern?

Ganz einfach: Man will flexibel und sicher bleiben. Wenn ich meine Konfiguration direkt ins Docker-Image packe, muss ich für jede kleine Einstellungsänderung (z.B. für eine Test- vs. Produktionsumgebung) ein komplett neues Image bauen. Das ist total umständlich. Außerdem gehören sensible Dinge wie Passwörter oder API-Keys auf keinen Fall in ein Image, das vielleicht in einer Registry liegt, wo mehrere Leute draufschauen können.

Die Trennung, wie es auch die "12-Factor App"-Philosophie vorschlägt, erlaubt mir, ein und dasselbe Image in verschiedenen Umgebungen mit unterschiedlichen Einstellungen zu betreiben. Und für Secrets gibt's dann nochmal extra Mechanismen in Kubernetes, um sie sicherer zu handhaben als normale Konfigurationswerte. So bleibt mein Image schlank und universell einsetzbar, und die Konfiguration kann je nach Bedarf angepasst werden, ohne den Code oder das Image anzufassen.

## 2. Was ist der Hauptunterschied im Zweck zwischen einer ConfigMap und einem Secret?

Der Hauptunterschied ist, wofür sie gedacht sind und wie "geheim" die Daten darin sein müssen:

*   **ConfigMap:** Die ist für ganz normale, **nicht-sensible Konfigurationsdaten**. Denk an Dinge wie eine URL zu einem anderen Service, ein Log-Level (debug, info, etc.), oder den Text für eine Willkommensnachricht. Diese Infos sind nicht geheim und können ruhig im Klartext stehen.
*   **Secret:** Wie der Name schon sagt, ist das für **sensible, geheime Daten**. Hier kommen Datenbankpasswörter, API-Schlüssel, TLS-Zertifikate und Ähnliches rein. Kubernetes behandelt Secrets mit etwas mehr Vorsicht, auch wenn die Daten darin erstmal nur base64-kodiert sind (was keine echte Verschlüsselung ist). Wichtiger ist, dass K8s Mechanismen für strengere Zugriffskontrollen und potenziell auch für Verschlüsselung im Ruhezustand bietet.

Kurz: ConfigMap für "normale" Einstellungen, Secret für alles, was nicht jeder sehen soll.

## 3. Beschreibe die zwei Hauptarten, wie du Konfiguration (sowohl aus ConfigMaps als auch Secrets) für einen Container in einem Pod bereitstellen kannst.

Ich kann die Daten aus ConfigMaps und Secrets auf zwei Wegen in meine Container bekommen:

1.  **Als Umgebungsvariablen:**
    Ich kann einzelne Werte aus einer ConfigMap oder einem Secret direkt als Umgebungsvariablen für meinen Container definieren. Meine Anwendung liest diese dann ganz normal aus dem Environment (z.B. `process.env.MEINE_VAR` in Node.js).
    In der YAML-Datei für mein Deployment sieht das z.B. so aus:
    ```yaml
    env:
      - name: GREETING_MESSAGE_FROM_ENV
        valueFrom:
          configMapKeyRef:
            name: my-app-config # Name der ConfigMap
            key: GREETING_MESSAGE # Welcher Schlüssel daraus
      - name: DB_PASSWORD_FROM_ENV
        valueFrom:
          secretKeyRef:
            name: my-app-secret # Name des Secrets
            key: DB_PASSWORD   # Welcher Schlüssel daraus
    ```

2.  **Als Dateien in einem gemounteten Volume:**
    Ich kann den gesamten Inhalt einer ConfigMap oder eines Secrets als Dateien in ein Verzeichnis innerhalb meines Containers mounten. Jeder Schlüssel aus der ConfigMap/Secret wird dann zu einer Datei in diesem Verzeichnis. Meine Anwendung liest die Konfiguration dann einfach aus diesen Dateien.
    YAML-Beispiel:
    ```yaml
    volumeMounts:
      - name: config-volume
        mountPath: /etc/app-config # Hier landen die ConfigMap-Dateien
    # ... und für Secrets analog ...
    volumes:
      - name: config-volume
        configMap:
          name: my-app-config # Die ConfigMap, die gemountet wird
    # ... und für Secrets analog ...
    ```
    Das ist praktisch, wenn man z.B. ganze Konfigurationsdateien hat oder die Anwendung erwartet, ihre Einstellungen aus Dateien zu lesen.

## 4. Welchen Weg (ENV Var oder gemountete Datei) würdest du für ein kritisches Datenbank-Passwort in Produktion bevorzugen und warum?

Für ein kritisches Datenbank-Passwort in Produktion würde ich **immer die Methode mit der gemounteten Datei aus einem Secret bevorzugen.**

Warum? Umgebungsvariablen sind zwar bequem, aber sie haben ein paar Nachteile bei sensiblen Daten:
*   Sie sind oft für alle Prozesse sichtbar, die innerhalb des Containers laufen, auch für Kindprozesse.
*   Es besteht ein höheres Risiko, dass sie versehentlich geloggt werden (z.B. wenn die App bei einem Fehler alle Umgebungsvariablen ausgibt).

Wenn das Passwort als Datei in einem Volume gemountet wird, ist der Zugriff etwas kontrollierter. Die Datei liegt im Dateisystem des Containers, und idealerweise hat nur der Hauptprozess der Anwendung die Berechtigung, sie zu lesen. Das reduziert die Angriffsfläche ein wenig. Außerdem gibt es in Kubernetes Mechanismen, gemountete Secrets zu aktualisieren, ohne gleich den ganzen Pod neu starten zu müssen (die Anwendung muss das dann aber auch mitbekommen). Es fühlt sich einfach etwas sicherer an, Passwörter nicht direkt im "Environment" herumschwirren zu haben.

## 5. Deine Secret YAML Datei sollte nicht in einem öffentlichen Git-Repository eingecheckt werden. Warum ist das Feld `stringData:` in der Secret-Definition zwar praktisch, aber auch ein Grund für diese Vorsicht?

Genau, eine Secret-YAML-Datei, die `stringData:` benutzt, gehört absolut nicht in ein öffentliches Git-Repo (und eigentlich auch nicht in ein privates, wenn es nicht extrem gut geschützt ist).

Das `stringData:`-Feld ist super praktisch, weil ich meine geheimen Werte (Passwörter, API-Keys) direkt im Klartext in die YAML-Datei schreiben kann. Kubernetes kümmert sich dann beim Anwenden darum, diese Werte base64 zu kodieren und als Secret zu speichern.

Der Haken ist aber genau dieser **Klartext in der YAML-Datei**. Wenn diese Datei so ins Git kommt:
*   Ist das Geheimnis für jeden sichtbar, der das Repo klonen oder einsehen kann.
*   Es landet in der Git-Historie und bleibt dort, selbst wenn ich es später ändere oder die Datei lösche (es sei denn, ich betreibe Aufwand, die Historie umzuschreiben).
*   Ein versehentlicher Push in ein öffentliches Repo, und mein Geheimnis ist weltweit bekannt.

Auch wenn Kubernetes die Werte dann base64-kodiert, was oft fälschlicherweise für Verschlüsselung gehalten wird (ist es aber nicht, nur eine andere Darstellung), ist das Problem der Klartext in der Quelldatei. Deshalb: Entweder `stringData:` nur für ganz lokale Tests nutzen und die Datei nie committen, oder Secrets direkt mit `kubectl create secret ... --from-literal` oder `--from-file` erstellen, oder fortgeschrittenere Methoden wie verschlüsselte Secrets (z.B. mit Sealed Secrets oder SOPS) verwenden, wenn man sie doch versionieren will. Für diese Übung ist `stringData` okay, solange man sich der Gefahr bewusst ist und die Datei aus `.gitignore` nicht vergisst.