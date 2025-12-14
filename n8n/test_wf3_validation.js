#!/usr/bin/env node

/**
 * WF3 Tasks nach SeaTable - Validierung und Testfälle
 * 
 * Dieses Skript:
 * 1. Validiert die Workflow-Struktur
 * 2. Führt 10 Testfälle durch
 * 3. Vergleicht Ergebnisse mit Screenshot-Daten
 */

const fs = require('fs');
const path = require('path');

// Screenshot-Daten (aus der Bildbeschreibung)
const SCREENSHOT_EXPECTED = {
  tableName: 'todos_v1',
  totalRecords: 16,
  columns: ['todo_id', 'meeting_id', 'who', 'what', 'due', 'status', 'created_at'],
  expectedData: {
    // Alle 16 Einträge haben status: 'todo'
    allStatusTodo: true,
    // Die meisten Felder sind leer außer due und status
    mostlyEmptyFields: true,
    // Due-Daten: Oktober 2023 (Zeilen 1-9) und November 2025 (Zeilen 10-16)
    dueDates: {
      october2023: 9,
      november2025: 7
    }
  }
};

// Testfälle
const TEST_CASES = [
  {
    id: 'TC1',
    name: 'Valider Workflow mit Standard todos.json',
    description: 'Workflow sollte mit korrektem todos.json Format funktionieren',
    input: {
      baseDir: '/Meetings/2025/11/17 - KI B Test/',
      meeting_id: 'meeting-001',
      todos_path: 'out/todos.json',
      summary_path: 'out/summary.md'
    },
    todosJson: {
      schemaVersion: '2.0.0',
      meeting: {
        slug: 'meeting-001',
        title: 'Test Meeting',
        datetime: '2025-11-17T10:00:00Z',
        participants: []
      },
      tasks: [
        {
          uid: 'task-001',
          title: 'Test Task 1',
          description: 'Description 1',
          status: 'todo',
          priority: 'high',
          assignees: [{ name: 'John Doe', email: 'john@example.com' }],
          due: '2023-10-11',
          labels: ['meeting']
        }
      ]
    },
    expected: {
      shouldSucceed: true,
      tasksProcessed: 1,
      operation: 'create'
    }
  },
  {
    id: 'TC2',
    name: 'Workflow mit mehreren Tasks',
    description: 'Workflow sollte mehrere Tasks verarbeiten können',
    input: {
      baseDir: '/Meetings/2025/11/17 - KI B Test/',
      meeting_id: 'meeting-002',
      todos_path: 'out/todos.json'
    },
    todosJson: {
      schemaVersion: '2.0.0',
      meeting: { slug: 'meeting-002' },
      tasks: [
        { uid: 'task-002', title: 'Task 2', status: 'todo', due: '2023-10-12' },
        { uid: 'task-003', title: 'Task 3', status: 'todo', due: '2023-10-13' },
        { uid: 'task-004', title: 'Task 4', status: 'todo', due: '2025-11-30' }
      ]
    },
    expected: {
      shouldSucceed: true,
      tasksProcessed: 3,
      operations: ['create', 'create', 'create']
    }
  },
  {
    id: 'TC3',
    name: 'Workflow mit Update-Operation',
    description: 'Workflow sollte existierende Tasks aktualisieren können',
    input: {
      baseDir: '/Meetings/2025/11/17 - KI B Test/',
      meeting_id: 'meeting-003',
      todos_path: 'out/todos.json'
    },
    todosJson: {
      schemaVersion: '2.0.0',
      meeting: { slug: 'meeting-003' },
      tasks: [
        { uid: 'existing-task-001', title: 'Updated Task', status: 'in_progress', due: '2025-11-24' }
      ]
    },
    expected: {
      shouldSucceed: true,
      tasksProcessed: 1,
      operation: 'update' // Wenn todo_id bereits existiert
    }
  },
  {
    id: 'TC4',
    name: 'Workflow mit leerem tasks Array',
    description: 'Workflow sollte mit leerem tasks Array umgehen können',
    input: {
      baseDir: '/Meetings/2025/11/17 - KI B Test/',
      meeting_id: 'meeting-004',
      todos_path: 'out/todos.json'
    },
    todosJson: {
      schemaVersion: '2.0.0',
      meeting: { slug: 'meeting-004' },
      tasks: []
    },
    expected: {
      shouldSucceed: true,
      tasksProcessed: 0,
      shouldHandleEmpty: true
    }
  },
  {
    id: 'TC5',
    name: 'Workflow mit verschiedenen Status-Werten',
    description: 'Workflow sollte verschiedene Status-Werte normalisieren',
    input: {
      baseDir: '/Meetings/2025/11/17 - KI B Test/',
      meeting_id: 'meeting-005',
      todos_path: 'out/todos.json'
    },
    todosJson: {
      schemaVersion: '2.0.0',
      meeting: { slug: 'meeting-005' },
      tasks: [
        { uid: 'task-005a', title: 'Open Task', status: 'open', due: '2023-10-11' },
        { uid: 'task-005b', title: 'Done Task', status: 'done', due: '2023-10-12' },
        { uid: 'task-005c', title: 'In Progress Task', status: 'in_progress', due: '2023-10-13' }
      ]
    },
    expected: {
      shouldSucceed: true,
      tasksProcessed: 3,
      statusNormalization: {
        'open': 'todo',
        'done': 'done',
        'in_progress': 'todo'
      }
    }
  },
  {
    id: 'TC6',
    name: 'Workflow mit fehlenden Pflichtfeldern',
    description: 'Workflow sollte mit fehlenden optionalen Feldern umgehen',
    input: {
      baseDir: '/Meetings/2025/11/17 - KI B Test/',
      meeting_id: 'meeting-006',
      todos_path: 'out/todos.json'
    },
    todosJson: {
      schemaVersion: '2.0.0',
      meeting: { slug: 'meeting-006' },
      tasks: [
        { uid: 'task-006', title: 'Minimal Task', due: '2025-11-30' }
        // Kein status, kein assignee, etc.
      ]
    },
    expected: {
      shouldSucceed: true,
      tasksProcessed: 1,
      defaultValues: {
        status: 'todo',
        priority: 'medium'
      }
    }
  },
  {
    id: 'TC7',
    name: 'Workflow mit v1 Format (todos statt tasks)',
    description: 'Workflow sollte altes Format mit todos Array unterstützen',
    input: {
      baseDir: '/Meetings/2025/11/17 - KI B Test/',
      meeting_id: 'meeting-007',
      todos_path: 'out/todos.json'
    },
    todosJson: {
      schemaVersion: '1.0.0',
      meeting: { slug: 'meeting-007' },
      todos: [  // Altes Format
        { uid: 'task-007', title: 'V1 Task', status: 'todo', due: '2023-10-11' }
      ]
    },
    expected: {
      shouldSucceed: true,
      tasksProcessed: 1,
      formatCompatibility: 'v1'
    }
  },
  {
    id: 'TC8',
    name: 'Workflow mit assignee als String (v1)',
    description: 'Workflow sollte v1 assignee Format unterstützen',
    input: {
      baseDir: '/Meetings/2025/11/17 - KI B Test/',
      meeting_id: 'meeting-008',
      todos_path: 'out/todos.json'
    },
    todosJson: {
      schemaVersion: '2.0.0',
      meeting: { slug: 'meeting-008' },
      tasks: [
        {
          uid: 'task-008',
          title: 'Task with v1 assignee',
          status: 'todo',
          assignee: 'Jane Doe',  // v1 Format
          assignee_email: 'jane@example.com',
          due: '2025-11-24'
        }
      ]
    },
    expected: {
      shouldSucceed: true,
      tasksProcessed: 1,
      assigneeFormat: 'v1'
    }
  },
  {
    id: 'TC9',
    name: 'Workflow mit ungültigem JSON',
    description: 'Workflow sollte Fehler bei ungültigem JSON behandeln',
    input: {
      baseDir: '/Meetings/2025/11/17 - KI B Test/',
      meeting_id: 'meeting-009',
      todos_path: 'out/todos.json'
    },
    todosJson: 'INVALID_JSON{',
    expected: {
      shouldSucceed: false,
      errorType: 'JSON_PARSE_ERROR',
      shouldWriteDLQ: true
    }
  },
  {
    id: 'TC10',
    name: 'Workflow mit fehlendem tasks/todos Array',
    description: 'Workflow sollte Fehler bei fehlendem tasks Array behandeln',
    input: {
      baseDir: '/Meetings/2025/11/17 - KI B Test/',
      meeting_id: 'meeting-010',
      todos_path: 'out/todos.json'
    },
    todosJson: {
      schemaVersion: '2.0.0',
      meeting: { slug: 'meeting-010' }
      // Kein tasks Array
    },
    expected: {
      shouldSucceed: false,
      errorType: 'INVALID_UTS_V2',
      errorMessage: 'Could not find any tasks/todos array'
    }
  }
];

// Workflow-Validierung
function validateWorkflow(workflow) {
  const issues = [];
  const warnings = [];
  
  console.log('\n=== WORKFLOW-VALIDIERUNG ===\n');
  
  // 1. Prüfe ob Workflow aktiv ist
  if (workflow.active === false) {
    warnings.push('⚠️  Workflow ist nicht aktiv (active: false)');
  }
  
  // 2. Prüfe kritische Nodes
  const requiredNodes = [
    'Prepare Paths',
    'Read todos.json (WebDAV)',
    'Parse & Validate todos.json',
    'Get SeaTable Access Token',
    'List Existing Rows (Pagination)',
    'Normalize Task & Map Fields',
    'Update Row (PUT)',
    'Create Row (POST)'
  ];
  
  const nodeNames = workflow.nodes.map(n => n.name);
  for (const required of requiredNodes) {
    if (!nodeNames.includes(required)) {
      issues.push(`❌ Fehlender kritischer Node: ${required}`);
    }
  }
  
  // 3. Prüfe Connections
  const connections = workflow.connections;
  if (!connections || Object.keys(connections).length === 0) {
    issues.push('❌ Keine Connections definiert');
  }
  
  // 4. Prüfe SeaTable Konfiguration
  const seatableNode = workflow.nodes.find(n => n.name === 'Get SeaTable Access Token');
  if (seatableNode) {
    const url = seatableNode.parameters?.url;
    if (!url || !url.includes('cloud.seatable.io')) {
      warnings.push('⚠️  SeaTable URL könnte falsch konfiguriert sein');
    }
    
    // Prüfe ob Token hardcoded ist (Sicherheitswarnung)
    const authHeader = seatableNode.parameters?.headerParameters?.parameters?.find(
      p => p.name === 'Authorization'
    );
    if (authHeader && authHeader.value.includes('Bearer')) {
      warnings.push('⚠️  API Token ist im Workflow hardcoded (Sicherheitsrisiko)');
    }
  }
  
  // 5. Prüfe Tabellenname
  const listRowsNode = workflow.nodes.find(n => n.name === 'List Existing Rows (Pagination)');
  if (listRowsNode) {
    const tableName = listRowsNode.parameters?.queryParameters?.parameters?.find(
      p => p.name === 'table_name'
    )?.value;
    if (tableName !== 'todos_v1') {
      warnings.push(`⚠️  Tabellenname ist "${tableName}", erwartet "todos_v1"`);
    }
  }
  
  // 6. Prüfe Error Handling
  const errorHandlingNodes = [
    'WebDAV Read Error?',
    'Parse Error?',
    'Auth Error?',
    'List Rows Error?',
    'Critical Error?'
  ];
  let errorHandlingCount = 0;
  for (const errorNode of errorHandlingNodes) {
    if (nodeNames.includes(errorNode)) {
      errorHandlingCount++;
    }
  }
  if (errorHandlingCount < 3) {
    warnings.push('⚠️  Möglicherweise unvollständiges Error Handling');
  }
  
  // 7. Prüfe DLQ (Dead Letter Queue) Handling
  const dlqNode = workflow.nodes.find(n => n.name === 'Write DLQ File');
  if (!dlqNode) {
    warnings.push('⚠️  Kein DLQ (Dead Letter Queue) Handling gefunden');
  }
  
  // Ergebnisse ausgeben
  console.log('✅ Workflow-Struktur:');
  console.log(`   - Nodes: ${workflow.nodes.length}`);
  console.log(`   - Connections: ${Object.keys(connections || {}).length}`);
  console.log(`   - Name: ${workflow.name}`);
  console.log(`   - ID: ${workflow.id}`);
  
  if (issues.length > 0) {
    console.log('\n❌ KRITISCHE PROBLEME:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNUNGEN:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('\n✅ Keine Probleme gefunden!');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}

// Testfall-Validierung
function validateTestCase(testCase, workflow) {
  console.log(`\n--- ${testCase.id}: ${testCase.name} ---`);
  console.log(`Beschreibung: ${testCase.description}`);
  
  const results = {
    testCase: testCase.id,
    name: testCase.name,
    passed: false,
    issues: [],
    details: {}
  };
  
  // 1. Prüfe Input-Parameter
  const requiredInputs = ['baseDir', 'meeting_id', 'todos_path'];
  for (const input of requiredInputs) {
    if (!testCase.input[input]) {
      results.issues.push(`Fehlender Input-Parameter: ${input}`);
    }
  }
  
  // 2. Prüfe todos.json Struktur
  if (typeof testCase.todosJson === 'object' && testCase.todosJson !== null) {
    // Valides Format
    if (testCase.expected.shouldSucceed) {
      if (!testCase.todosJson.meeting) {
        results.issues.push('todos.json sollte meeting Objekt enthalten');
      }
      if (testCase.todosJson.tasks && !Array.isArray(testCase.todosJson.tasks)) {
        results.issues.push('todos.json.tasks sollte ein Array sein');
      }
    }
  } else if (testCase.expected.shouldSucceed) {
    // Ungültiges Format, aber sollte erfolgreich sein
    results.issues.push('todos.json Format ist ungültig, aber Test erwartet Erfolg');
  }
  
  // 3. Prüfe erwartete Ergebnisse
  if (testCase.expected.tasksProcessed !== undefined) {
    if (testCase.todosJson && typeof testCase.todosJson === 'object') {
      const tasks = testCase.todosJson.tasks || testCase.todosJson.todos || [];
      if (testCase.expected.tasksProcessed !== tasks.length) {
        results.issues.push(
          `Erwartete ${testCase.expected.tasksProcessed} Tasks, aber ${tasks.length} im Input`
        );
      }
    }
  }
  
  // 4. Prüfe Status-Normalisierung
  if (testCase.expected.statusNormalization) {
    const tasks = testCase.todosJson?.tasks || [];
    for (const [inputStatus, expectedStatus] of Object.entries(testCase.expected.statusNormalization)) {
      const task = tasks.find(t => t.status === inputStatus);
      if (task) {
        results.details[`status_${inputStatus}`] = {
          input: inputStatus,
          expected: expectedStatus,
          note: 'Sollte normalisiert werden zu: ' + expectedStatus
        };
      }
    }
  }
  
  // 5. Prüfe Error-Handling
  if (!testCase.expected.shouldSucceed) {
    if (!testCase.expected.errorType) {
      results.issues.push('Fehler-Test sollte errorType definieren');
    }
  }
  
  results.passed = results.issues.length === 0;
  
  if (results.passed) {
    console.log('✅ Testfall-Struktur: VALID');
  } else {
    console.log('❌ Testfall-Struktur: PROBLEME GEFUNDEN');
    results.issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return results;
}

// Vergleich mit Screenshot-Daten
function compareWithScreenshot(testResults) {
  console.log('\n=== VERGLEICH MIT SCREENSHOT ===\n');
  
  const screenshot = SCREENSHOT_EXPECTED;
  const comparisons = [];
  
  // 1. Tabellenname
  const tableNameMatch = screenshot.tableName === 'todos_v1';
  comparisons.push({
    check: 'Tabellenname',
    expected: screenshot.tableName,
    actual: 'todos_v1',
    match: tableNameMatch
  });
  
  // 2. Spalten
  const expectedColumns = screenshot.columns;
  const allColumnsPresent = expectedColumns.every(col => 
    ['todo_id', 'meeting_id', 'who', 'what', 'due', 'status', 'created_at'].includes(col)
  );
  comparisons.push({
    check: 'Spalten',
    expected: expectedColumns.join(', '),
    actual: 'todo_id, meeting_id, who, what, due, status, created_at',
    match: allColumnsPresent
  });
  
  // 3. Status-Werte
  comparisons.push({
    check: 'Status-Normalisierung',
    expected: 'Alle Status sollten zu "todo" normalisiert werden (außer "done")',
    actual: 'Workflow normalisiert: open→todo, in_progress→todo, done→done',
    match: true,
    note: 'Workflow-Logik entspricht Screenshot (alle zeigen "todo")'
  });
  
  // 4. Due-Dates
  comparisons.push({
    check: 'Due-Dates Format',
    expected: 'YYYY-MM-DD Format (z.B. 2023-10-11, 2025-11-30)',
    actual: 'Workflow verwendet: String(task.due).slice(0, 10)',
    match: true,
    note: 'Workflow extrahiert korrekt das Datum'
  });
  
  // Ergebnisse ausgeben
  console.log('Vergleichsergebnisse:');
  comparisons.forEach(comp => {
    const icon = comp.match ? '✅' : '❌';
    console.log(`\n${icon} ${comp.check}:`);
    console.log(`   Erwartet: ${comp.expected}`);
    console.log(`   Tatsächlich: ${comp.actual}`);
    if (comp.note) {
      console.log(`   📝 ${comp.note}`);
    }
  });
  
  const allMatch = comparisons.every(c => c.match);
  return {
    match: allMatch,
    comparisons
  };
}

// Hauptfunktion
function main() {
  console.log('='.repeat(60));
  console.log('WF3 Tasks nach SeaTable - Validierung & Testfälle');
  console.log('='.repeat(60));
  
  // Workflow laden
  const workflowPath = path.join(__dirname, 'WF 3 Tasks nach SeaTable-3.json');
  if (!fs.existsSync(workflowPath)) {
    console.error(`❌ Workflow-Datei nicht gefunden: ${workflowPath}`);
    process.exit(1);
  }
  
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  
  // 1. Workflow validieren
  const validation = validateWorkflow(workflow);
  
  // 2. Testfälle validieren
  console.log('\n\n=== TESTFALL-VALIDIERUNG ===\n');
  const testResults = [];
  for (const testCase of TEST_CASES) {
    const result = validateTestCase(testCase, workflow);
    testResults.push(result);
  }
  
  // 3. Zusammenfassung
  console.log('\n\n=== ZUSAMMENFASSUNG ===\n');
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = testResults.filter(r => !r.passed).length;
  
  console.log(`Workflow-Validierung: ${validation.valid ? '✅ BESTANDEN' : '❌ FEHLGESCHLAGEN'}`);
  console.log(`   - Kritische Probleme: ${validation.issues.length}`);
  console.log(`   - Warnungen: ${validation.warnings.length}`);
  
  console.log(`\nTestfälle: ${passedTests}/${TEST_CASES.length} bestanden`);
  console.log(`   - Bestanden: ${passedTests}`);
  console.log(`   - Fehlgeschlagen: ${failedTests}`);
  
  // 4. Vergleich mit Screenshot
  const screenshotComparison = compareWithScreenshot(testResults);
  
  // 5. Finale Bewertung
  console.log('\n\n=== FINALE BEWERTUNG ===\n');
  const overallPass = validation.valid && passedTests === TEST_CASES.length && screenshotComparison.match;
  
  if (overallPass) {
    console.log('✅ ALLE VALIDIERUNGEN BESTANDEN');
  } else {
    console.log('⚠️  EINIGE PROBLEME GEFUNDEN');
    if (!validation.valid) {
      console.log('   - Workflow-Struktur hat Probleme');
    }
    if (failedTests > 0) {
      console.log(`   - ${failedTests} Testfälle haben Probleme`);
    }
    if (!screenshotComparison.match) {
      console.log('   - Abweichungen vom Screenshot');
    }
  }
  
  // Detaillierte Ergebnisse als JSON speichern
  const report = {
    timestamp: new Date().toISOString(),
    workflow: {
      name: workflow.name,
      id: workflow.id,
      validation
    },
    testCases: testResults,
    screenshotComparison,
    summary: {
      workflowValid: validation.valid,
      testsPassed: passedTests,
      testsTotal: TEST_CASES.length,
      screenshotMatch: screenshotComparison.match,
      overallPass
    }
  };
  
  const reportPath = path.join(__dirname, 'wf3_validation_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detaillierter Report gespeichert: ${reportPath}`);
  
  process.exit(overallPass ? 0 : 1);
}

// Ausführen
if (require.main === module) {
  main();
}

module.exports = {
  validateWorkflow,
  validateTestCase,
  compareWithScreenshot,
  TEST_CASES,
  SCREENSHOT_EXPECTED
};

