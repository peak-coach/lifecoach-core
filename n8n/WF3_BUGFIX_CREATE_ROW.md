# WF3 Bugfix: Create Row (POST) URL Problem

## 🐛 Gefundenes Problem

Der **Create Row (POST)** Node hatte einen kritischen Bug, der verhindert hätte, dass neue Tasks in SeaTable erstellt werden können.

### Problem-Details

**Vorher (fehlerhaft):**
```json
"url": "={{ $node[\"Get SeaTable Access Token\"].json.dtable_server + \"/api/v2/dtables/\" + $node[\"Get SeaTable Access Token\"].json.dtable_uuid + \"/rows/\" }}"
```

**Problem:**
- `dtable_server` wird **nie** gesetzt
- In "Extract Token & UUID" wird nur `seatable_base_url` gesetzt, nicht `dtable_server`
- Die URL würde zu `undefined/api/v2/dtables/...` werden → **Request würde fehlschlagen**

### Vergleich mit anderen Nodes

**Update Row (PUT)** - ✅ Funktioniert korrekt:
```json
"url": "=https://cloud.seatable.io/api-gateway/api/v2/dtables/{{$node[\"Get SeaTable Access Token\"].json.dtable_uuid}}/rows/"
```

**List Existing Rows** - ✅ Funktioniert korrekt:
```json
"url": "=https://cloud.seatable.io/api-gateway/api/v2/dtables/{{$node[\"Get SeaTable Access Token\"].json.dtable_uuid}}/rows/"
```

## ✅ Lösung

**Nachher (behoben):**
```json
"url": "=https://cloud.seatable.io/api-gateway/api/v2/dtables/{{$node[\"Get SeaTable Access Token\"].json.dtable_uuid}}/rows/"
```

Die URL wurde auf die gleiche hardcoded Base-URL geändert wie bei Update Row und List Existing Rows.

## 📝 Änderungen

- **Datei:** `WF 3 Tasks nach SeaTable-3.json`
- **Node:** "Create Row (POST)"
- **Zeile:** ~436
- **Version:** v1.0.6 (Bugfix)

## ✅ Ergebnis

Nach diesem Fix sollte der Workflow **vollständig funktionieren** und:
- ✅ Neue Tasks in SeaTable **erstellen** können (Create Row)
- ✅ Existierende Tasks **aktualisieren** können (Update Row)
- ✅ Bestehende Tasks **auflisten** können (List Existing Rows)

## ⚠️ Hinweis

Die Authorization-Header verwenden weiterhin `$node["Get SeaTable Access Token"].json.access_token`, was funktionieren sollte, da n8n Node-Referenzen auflöst. Falls es Probleme gibt, könnte man die Referenz auf die Daten im aktuellen Item ändern, die durch "Extract Token & UUID" gesetzt wurden.

