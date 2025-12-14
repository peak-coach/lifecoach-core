# HMAC Validierung - Fix & Anleitung

## Problem

Die HMAC-Validierung schlug fehl, weil `expectedSignature` leer war. Das Problem lag im "Compute HMAC (Code)" Node, der die Signatur nicht korrekt vom vorherigen Node übernommen hat.

## Lösung

Der "Compute HMAC (Code)" Node wurde angepasst, um:
1. Zuerst `receivedHmac` vom "Extract Headers & Body" Node zu verwenden
2. Nur als Fallback die Signatur aus den Headers zu extrahieren
3. Die Validierung verbessert, um auch leere Signaturen korrekt zu handhaben

## Für Test-Requests

### Problem beim Testen
Der "Build Test Request (WF1)" Node verwendet `'sha256=dummy'` als HMAC, was nie validiert werden kann.

### Lösung: Gültige HMAC für Test-Requests erstellen

Um einen gültigen Test-Request zu erstellen, musst du die HMAC-Signatur korrekt berechnen:

```javascript
const crypto = require('crypto');

// 1. Body erstellen
const body = {
  meeting: {
    slug: '2025/11/17 - KI B Test',
    title: 'Kickoff Testkunde',
    datetime: '2025-11-23T13:00:00Z',
    language: 'de',
    participants: ['Testperson']
  },
  audioUrl: 'https://example.com/test-audio.wav',
  source: 'wf1-manual-test'
};

const rawBody = JSON.stringify(body);

// 2. HMAC berechnen (mit dem gleichen Secret wie im Workflow)
const HMAC_SECRET = process.env.HMAC_SECRET; // oder der tatsächliche Secret
const hmac = crypto
  .createHmac('sha256', HMAC_SECRET)
  .update(rawBody, 'utf8')
  .digest('hex');

// 3. Timestamp & Nonce
const timestamp = Math.floor(Date.now() / 1000);
const nonce = 'manual-test-' + timestamp;

// 4. Header mit korrekter HMAC
const headers = {
  'x-signature-256': `sha256=${hmac}`,
  'x-timestamp': String(timestamp),
  'x-nonce': nonce
};
```

### Aktualisierter "Build Test Request (WF1)" Node

Hier ist ein verbesserter Code für den Test-Request Node, der automatisch eine gültige HMAC berechnet:

```javascript
const crypto = require('crypto');

// 1) Body wie echter Request
const body = {
  meeting: {
    slug: '2025/11/17 - KI B Test',
    title: 'Kickoff Testkunde',
    datetime: '2025-11-23T13:00:00Z',
    language: 'de',
    participants: ['Testperson']
  },
  audioUrl: 'https://example.com/test-audio.wav',
  source: 'wf1-manual-test'
};

const rawBody = JSON.stringify(body);

// 2) Timestamp & Nonce
const timestamp = Math.floor(Date.now() / 1000);
const nonce = 'manual-test-' + timestamp;

// 3) HMAC berechnen (wenn HMAC_SECRET verfügbar)
const hmacSecret = $env.HMAC_SECRET;
let hmacSignature = 'sha256=dummy'; // Fallback

if (hmacSecret) {
  const hmac = crypto
    .createHmac('sha256', hmacSecret)
    .update(rawBody, 'utf8')
    .digest('hex');
  hmacSignature = `sha256=${hmac}`;
}

// 4) Header mit korrekter HMAC
const headers = {
  'x-signature-256': hmacSignature,
  'x-timestamp': String(timestamp),
  'x-nonce': nonce
};

// 5) Struktur wie beim Webhook-Input zurückgeben
return {
  json: {
    headers,
    body,
    rawBody
  }
};
```

## Validierung

Nach dem Fix sollte:
- ✅ `expectedSignature` den Wert aus `receivedHmac` haben
- ✅ `calculatedSignature` korrekt berechnet werden
- ✅ `hmacValid` `true` sein, wenn Signaturen übereinstimmen

## Wichtige Hinweise

1. **Für echte Requests:** Stelle sicher, dass der Client die HMAC korrekt mit dem gleichen Secret berechnet
2. **Für Tests:** Verwende den aktualisierten "Build Test Request" Node mit automatischer HMAC-Berechnung
3. **Secret:** Das `HMAC_SECRET` muss in n8n als Environment Variable gesetzt sein

## Workflow-Datei

Die korrigierte Workflow-Datei ist: `n8n/WF1_MEET-3.json`

