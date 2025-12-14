# n8n LifeCoach - Deployment-Anleitung

Diese Anleitung beschreibt die Einrichtung einer isolierten n8n-Instanz für das LifeCoach-Projekt auf einem Hetzner-VPS.

## Voraussetzungen

- Zugriff auf einen Hetzner-VPS (oder anderen Server)
- Docker und Docker Compose installiert
- SSH-Zugriff auf den Server
- Optional: Domain/Subdomain für n8n (oder direkter Zugriff über IP:Port)

## Deployment-Schritte

### 1. SSH-Verbindung zum Server

```bash
ssh user@dein-server.de
```

### 2. Verzeichnis anlegen

```bash
sudo mkdir -p /opt/n8n-lifecoach
sudo chown $USER:$USER /opt/n8n-lifecoach
cd /opt/n8n-lifecoach
```

### 3. Dateien auf den Server kopieren

Kopiere die folgenden Dateien aus dem Repo (`deploy/n8n-lifecoach/`) auf den Server:

- `docker-compose.yml`
- `.env.example`

**Option A: Mit SCP vom lokalen Rechner:**
```bash
# Vom lokalen Rechner aus:
scp deploy/n8n-lifecoach/docker-compose.yml user@dein-server.de:/opt/n8n-lifecoach/
scp deploy/n8n-lifecoach/.env.example user@dein-server.de:/opt/n8n-lifecoach/
```

**Option B: Mit Git auf dem Server:**
```bash
# Auf dem Server:
git clone <dein-repo-url> /tmp/lifecoach-core
cp /tmp/lifecoach-core/deploy/n8n-lifecoach/* /opt/n8n-lifecoach/
rm -rf /tmp/lifecoach-core
```

### 4. Environment-Variablen konfigurieren

```bash
cd /opt/n8n-lifecoach
cp .env.example .env
nano .env  # oder vim/vi
```

**WICHTIG: Folgende Werte MÜSSEN angepasst werden:**

1. **N8N_HOST**: 
   - Setze die externe URL (z.B. `n8n-lc.example.com` oder `123.456.789.0:5679`)
   - Ersetze `N8N_LC_HOST` durch deinen tatsächlichen Host

2. **N8N_ENCRYPTION_KEY**:
   - Generiere einen sicheren Schlüssel:
     ```bash
     openssl rand -base64 32
     ```
   - Ersetze `CHANGE_ME_LIFECOACH_KEY` durch den generierten Schlüssel

3. **DB_POSTGRESDB_PASSWORD**:
   - Wähle ein sicheres Passwort für die Datenbank
   - Ersetze `n8n_lc_password` durch dein Passwort

4. **N8N_PROTOCOL**:
   - Für Produktion: `https` (empfohlen)
   - Nur für Tests: `http`

**Beispiel einer angepassten .env:**
```env
N8N_HOST=n8n-lc.example.com
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_ENCRYPTION_KEY=AbCdEf1234567890GhIjKlMnOpQrStUvWxYz==
DB_POSTGRESDB_DATABASE=n8n_lc
DB_POSTGRESDB_USER=n8n_lc
DB_POSTGRESDB_PASSWORD=MeinSicheresPasswort123!
```

### 5. Docker Compose starten

```bash
cd /opt/n8n-lifecoach
docker compose up -d
```

Die Container werden im Hintergrund gestartet. Du kannst den Status prüfen mit:

```bash
docker compose ps
```

Logs anzeigen:
```bash
docker compose logs -f
```

### 6. Ersten Login in n8n

Öffne im Browser:
- `https://N8N_HOST` (wenn N8N_PROTOCOL=https)
- oder `http://N8N_HOST:5679` (wenn N8N_PROTOCOL=http)

Beim ersten Aufruf wirst du aufgefordert:
1. Ein Admin-Konto anzulegen (E-Mail, Passwort, Name)
2. Die n8n-Installation abzuschließen

### 7. API-Key für MCP erstellen

1. Nach dem Login: Gehe zu **Settings** → **API**
2. Klicke auf **Create API Key**
3. Gib einen Namen ein (z.B. `lifecoach-mcp`)
4. Kopiere den generierten API-Key und speichere ihn sicher
5. Dieser Key wird später für die MCP-Verbindung benötigt

## Wartung

### Container stoppen
```bash
cd /opt/n8n-lifecoach
docker compose down
```

### Container neu starten
```bash
docker compose restart
```

### Logs anzeigen
```bash
docker compose logs -f n8n
docker compose logs -f postgres
```

### Backup der Datenbank
```bash
docker compose exec postgres pg_dump -U n8n_lc n8n_lc > backup_$(date +%Y%m%d).sql
```

### Backup wiederherstellen
```bash
docker compose exec -T postgres psql -U n8n_lc n8n_lc < backup_YYYYMMDD.sql
```

## Datenverzeichnisse

Die Daten werden in folgenden Verzeichnissen gespeichert:
- **PostgreSQL**: `./data/postgres/`
- **n8n**: `./data/n8n/`

Diese Verzeichnisse werden automatisch beim ersten Start erstellt.

## Ports

- **Extern**: `5679` → **Intern**: `5678`
- Der externe Port 5679 wurde gewählt, um Konflikte mit einer eventuell bestehenden n8n-Instanz auf Port 5678 zu vermeiden.

## Troubleshooting

### Container startet nicht
- Prüfe die Logs: `docker compose logs`
- Prüfe, ob Port 5679 bereits belegt ist: `netstat -tulpn | grep 5679`
- Prüfe die `.env`-Datei auf korrekte Werte

### Datenbank-Verbindungsfehler
- Warte, bis der Postgres-Container vollständig gestartet ist (Healthcheck)
- Prüfe die Datenbank-Credentials in der `.env`

### n8n ist nicht erreichbar
- Prüfe die Firewall-Einstellungen auf dem Server
- Prüfe, ob `N8N_HOST` korrekt gesetzt ist
- Bei HTTPS: Stelle sicher, dass ein Reverse-Proxy (z.B. Nginx) konfiguriert ist

## Sicherheitshinweise

- **Niemals** die `.env`-Datei ins Git-Repository committen
- Verwende starke Passwörter für Datenbank und Encryption Key
- Setze `N8N_PROTOCOL=https` für Produktion
- Konfiguriere einen Reverse-Proxy (Nginx/Traefik) mit SSL-Zertifikat
- Beschränke den Zugriff auf n8n über Firewall-Regeln

