# Kubernetes: Anwendungskonfiguration mit ConfigMaps & Secrets

Dieses Projekt demonstriert die Verwendung von ConfigMaps und Secrets in Kubernetes zur externen Konfiguration einer einfachen Node.js-Anwendung.

## Ziel

Ziel war es, eine Anwendung zu deployen, die ihre nicht-sensible Konfiguration aus einer ConfigMap und sensible Daten aus einem Secret bezieht, sowohl über Umgebungsvariablen als auch über gemountete Dateien. Die erfolgreiche Übernahme der Konfiguration wurde durch die Log-Ausgaben der Anwendung verifiziert.

## Enthaltene Dateien

*   **`k8s-config-app/`**: Enthält die einfache Node.js-Anwendung (`app.js`), ihr `Dockerfile` und `package.json`.
*   **`kubernetes/`**:
    *   `app-configmap.yaml`: Definition der Kubernetes ConfigMap.
    *   `app-secret.yaml`: Definition des Kubernetes Secrets. **Hinweis:** Die in diesem Repository versionierte `app-secret.yaml` ist in der .gitignore. Für ein funktionsfähiges Deployment müssen echte Werte und natürlich die die secrets.yaml selbst (welche hier fehlt) verwendet werden, vorzugsweise durch `kubectl create secret generic ... --from-literal`.
    *   `app-deployment.yaml`: Definition des Kubernetes Deployments für die Node.js-Anwendung, das ConfigMap und Secret referenziert.
    *   `app-service.yaml`: Definition des Kubernetes Service (Typ NodePort) für die Anwendung.
    *   `k8s-configmap-secret-reflection.md`: Schriftliche Antworten auf die Reflexionsfragen.
    *   [![Anwendung läuft](assets)](assets) Screenshots, die das Deployment und die Funktionsweise belegen.

## Anleitung zum Deployment

1.  **Voraussetzungen:**
    *   Ein laufendes lokales Kubernetes-Cluster (z.B. Docker Desktop Kubernetes).
    *   `kubectl` konfiguriert, um auf dieses Cluster zu zeigen.
    *   Docker Hub Account (oder andere Registry) und das Anwendungs-Image (`DEIN_DOCKERHUB_BENUTZERNAME/my-config-app:latest`) dorthin gepusht.

2.  **Image bauen und pushen:**
    ```bash
    cd k8s-config-app
    docker build -t DEIN_DOCKERHUB_BENUTZERNAME/my-config-app:latest .
    docker push DEIN_DOCKERHUB_BENUTZERNAME/my-config-app:latest
    cd .. 
    ```
    Ersetze `DEIN_DOCKERHUB_BENUTZERNAME`.

3.  **Secret erstellen (sichere Methode):**
    Ersetze die Platzhalter mit deinen gewünschten sensiblen Werten.
    ```bash
    kubectl create secret generic my-app-secret \
      --from-literal=DB_PASSWORD='DeinSuperGeheimesPasswort123!' \
      --from-literal=API_KEY='DeinSuperGeheimerApiKeyABCXYZ' \
      --from-file=credentials.txt=./kubernetes/sample-credentials.txt 
     
    ```
   

4.  **Ressourcen anwenden:**
    Navigiere in den `kubernetes/` Ordner.
    ```bash
    kubectl apply -f app-configmap.yaml
    # kubectl apply -f app-secret.yaml 
    kubectl apply -f app-deployment.yaml 
    kubectl apply -f app-service.yaml
    ```

5.  **Verifizieren:**
    *   `kubectl get pods -l app=my-config-app -w` (warte auf Running 1/1)
    *   `kubectl logs <pod-name>` (überprüfe die geloggten Konfigurationswerte; Passwörter sollten als "[GESETZT]" erscheinen)
    *   `kubectl get service my-config-app-service` (finde den NodePort)
    *   Greife auf die Anwendung im Browser zu: `http://localhost:<NodePort>`
    *   Überprüfe die Endpunkte `/config-file` und `/secret-file`.

6.  **Aufräumen:**
    ```bash
    kubectl delete -f kubernetes/app-deployment.yaml
    kubectl delete -f kubernetes/app-service.yaml
    kubectl delete -f kubernetes/app-configmap.yaml
    kubectl delete secret my-app-secret 
    ```
## Screenshots als Nachweis

*   [![Anwendung läuft](assets)](assets)
