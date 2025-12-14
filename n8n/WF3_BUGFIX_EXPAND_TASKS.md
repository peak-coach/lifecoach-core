# WF3 Bugfix: Expand Tasks to Items - Array Return Error

## 🐛 Gefundenes Problem

Der Node **"Expand Tasks to Items"** hat einen Fehler verursacht:

**Fehlermeldung:**
```
Code doesn't return a single object [item 0]
An array of objects was returned. If you need to output multiple items, please use the 'Run Once for All Items' mode instead.
```

### Problem-Details

**Vorher (fehlerhaft):**
```json
{
  "parameters": {
    "mode": "runOnceForEachItem",  // ❌ Falscher Modus!
    "jsCode": "// ...\nreturn tasks.map(task => ({...}));"  // Gibt Array zurück
  }
}
```

**Problem:**
- Der Node läuft im Modus `runOnceForEachItem`
- Dieser Modus erwartet **ein einzelnes Objekt** als Rückgabe
- Der Code gibt aber `tasks.map(...)` zurück, was ein **Array** ist
- n8n wirft einen Fehler, weil der Modus nicht zum Rückgabetyp passt

### Warum der Fehler auftritt

Der Node "Expand Tasks to Items" soll:
1. Ein Item mit einem `tasks` Array empfangen
2. Jeden Task in ein separates Item aufteilen
3. Ein Array von Items zurückgeben (eines pro Task)

Das ist genau das, was `runOnceForAllItems` macht - es erlaubt, ein Array zurückzugeben.

## ✅ Lösung

**Nachher (behoben):**
```json
{
  "parameters": {
    "mode": "runOnceForAllItems",  // ✅ Korrekter Modus!
    "jsCode": "// Verarbeitet alle Items und gibt Array zurück\nconst items = $input.all();\nconst allExpanded = [];\n// ...\nreturn allExpanded;"
  }
}
```

### Änderungen

1. **Modus geändert:** `runOnceForEachItem` → `runOnceForAllItems`
2. **Code angepasst:** Verwendet jetzt `$input.all()` um alle Input-Items zu verarbeiten
3. **Rückgabe:** Gibt explizit ein Array zurück

### Code-Erklärung

```javascript
// B4: Expand tasks array into individual items
const items = $input.all();  // Alle Input-Items holen
const allExpanded = [];

for (const item of items) {
  const data = item.json;
  const tasks = data.tasks || [];

  if (tasks.length === 0) {
    // Keine Tasks: Item weitergeben
    allExpanded.push({
      json: { ...data, noTasks: true, task: null }
    });
  } else {
    // Tasks in einzelne Items aufteilen
    const expanded = tasks.map(task => ({
      json: {
        ...data,
        task: task,
        noTasks: false,
        tasksCount: tasks.length
      }
    }));
    allExpanded.push(...expanded);
  }
}

return allExpanded;  // Array zurückgeben
```

## 📝 Änderungen

- **Datei:** `WF 3 Tasks nach SeaTable-3.json`
- **Node:** "Expand Tasks to Items"
- **Zeile:** ~280
- **Version:** v1.0.7 (Bugfix)

## ✅ Ergebnis

Nach diesem Fix:
- ✅ Der Node kann korrekt ein Array von Items zurückgeben
- ✅ Jeder Task wird in ein separates Item aufgeteilt
- ✅ Der Workflow kann weiterlaufen ohne Fehler
- ✅ Tasks werden korrekt an "Has Tasks?" weitergegeben

## 🔍 n8n Modus-Erklärung

| Modus | Erwartete Rückgabe | Verwendung |
|-------|-------------------|----------|
| `runOnceForEachItem` | Einzelnes Objekt `{json: {...}}` | Verarbeitet jedes Item einzeln, gibt 1 Objekt zurück |
| `runOnceForAllItems` | Array von Objekten `[{json: {...}}, ...]` | Verarbeitet alle Items, kann mehrere zurückgeben |
| `runOnceForEachItem` (mit Array-Rückgabe) | ❌ **FEHLER** | Nicht erlaubt! |

## 🎯 Workflow-Flow nach Fix

1. **Prepare Upsert** → Gibt Item mit `tasks: [...]` zurück
2. **Expand Tasks to Items** → Nimmt Item, teilt Tasks auf → Gibt Array zurück ✅
3. **Has Tasks?** → Prüft ob Tasks vorhanden
4. **Split Tasks** → Verarbeitet Tasks einzeln
5. **Normalize Task & Map Fields** → Mappt jeden Task zu SeaTable-Format

Der Fix stellt sicher, dass der Workflow korrekt durchläuft!

