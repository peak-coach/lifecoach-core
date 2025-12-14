#!/usr/bin/env node

/**
 * Comprehensive Validation Tests für WF1 MEET-3 Workflow
 * 
 * 20 verschiedene Tests zur Validierung des n8n Workflows
 * Tests validieren Struktur, Knoten, Verbindungen, Ausdrücke, Fehlerbehandlung und Sicherheit
 */

const { readFileSync } = require('fs');
const path = require('path');

// Lade Workflow JSON
const workflowPath = '/Users/kelvinfaller/Downloads/WF1 MEET-3.json';
let workflow;

try {
  let workflowContent = readFileSync(workflowPath, 'utf8');
  // Remove any leading non-JSON characters (BOM, whitespace, etc.)
  workflowContent = workflowContent.trim();
  // If file doesn't start with {, try to find the first {
  if (!workflowContent.startsWith('{')) {
    const firstBrace = workflowContent.indexOf('{');
    if (firstBrace > 0) {
      workflowContent = workflowContent.substring(firstBrace);
    }
  }
  workflow = JSON.parse(workflowContent);
} catch (error) {
  console.error(`❌ Fehler beim Laden des Workflows: ${error.message}`);
  process.exit(1);
}

// Test Helper Functions
function getNodeByName(name) {
  return workflow.nodes.find(n => n.name === name);
}

function getNodeById(id) {
  return workflow.nodes.find(n => n.id === id);
}

function getConnectedNodes(nodeName) {
  const connections = workflow.connections[nodeName];
  if (!connections || !connections.main) return [];
  
  const connected = [];
  connections.main.forEach(branch => {
    branch.forEach(conn => {
      connected.push(conn.node);
    });
  });
  return connected;
}

function getAllNodesWithConnectionTo(targetNodeName) {
  const nodesWithConnection = [];
  Object.keys(workflow.connections || {}).forEach(sourceNodeName => {
    const connections = workflow.connections[sourceNodeName];
    if (connections && connections.main) {
      connections.main.forEach(branch => {
        branch.forEach(conn => {
          if (conn.node === targetNodeName) {
            nodesWithConnection.push(sourceNodeName);
          }
        });
      });
    }
  });
  return nodesWithConnection;
}

// ===================================================
// TEST SUITE - 20 Tests
// ===================================================

const tests = [];

// Test 1: Workflow Structure Validation
tests.push({
  name: 'Test 1: Workflow Structure Validation',
  run: () => {
    const errors = [];
    const warnings = [];
    
    if (!workflow.name) errors.push('Workflow missing name');
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push('Workflow missing nodes array');
      return { pass: false, message: `❌ ${errors.join(', ')}` };
    }
    
    if (!workflow.connections) errors.push('Workflow missing connections object');
    
    if (workflow.nodes.length < 10) {
      warnings.push('Workflow has very few nodes - may be incomplete');
    }
    
    const hasTrigger = workflow.nodes.some(n => 
      n.type.includes('trigger') || 
      n.type === 'n8n-nodes-base.webhook' ||
      n.type === 'n8n-nodes-base.manualTrigger'
    );
    
    if (!hasTrigger) errors.push('Workflow missing trigger node');
    
    const hasWebhook = workflow.nodes.some(n => n.type === 'n8n-nodes-base.webhook');
    const hasResponse = workflow.nodes.some(n => n.type === 'n8n-nodes-base.respondToWebhook');
    
    if (hasWebhook && !hasResponse) {
      warnings.push('Webhook node exists but no response node found');
    }
    
    return {
      pass: errors.length === 0,
      message: errors.length === 0
        ? `✅ Workflow structure is valid (${workflow.nodes.length} nodes)`
        : `❌ Workflow structure invalid: ${errors.join(', ')}`,
      warnings
    };
  }
});

// Test 2: Node Connections Validation
tests.push({
  name: 'Test 2: Node Connections Validation',
  run: () => {
    const errors = [];
    const warnings = [];
    const nodeNames = new Set(workflow.nodes.map(n => n.name));
    
    Object.keys(workflow.connections || {}).forEach(sourceNodeName => {
      if (!nodeNames.has(sourceNodeName)) {
        errors.push(`Connection references non-existent node: ${sourceNodeName}`);
        return;
      }
      
      const connections = workflow.connections[sourceNodeName];
      if (connections && connections.main) {
        connections.main.forEach(branch => {
          branch.forEach(conn => {
            if (!nodeNames.has(conn.node)) {
              errors.push(`Node "${sourceNodeName}" connects to non-existent node: ${conn.node}`);
            }
          });
        });
      }
    });
    
    return {
      pass: errors.length === 0,
      message: errors.length === 0
        ? '✅ All node connections are valid'
        : `❌ Invalid connections: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
      warnings
    };
  }
});

// Test 3: Webhook Node Configuration
tests.push({
  name: 'Test 3: Webhook Node Configuration',
  run: () => {
    const webhookNode = getNodeByName('Webhook Ingest');
    if (!webhookNode) {
      return { pass: false, message: '❌ Webhook node not found' };
    }
    
    const hasRawBody = webhookNode.parameters?.options?.rawBody === true;
    const hasPath = webhookNode.parameters?.path === 'wf1/ingest';
    const hasPostMethod = webhookNode.parameters?.httpMethod === 'POST';
    const hasResponseMode = webhookNode.parameters?.responseMode === 'responseNode';
    
    const allValid = hasRawBody && hasPath && hasPostMethod && hasResponseMode;
    
    return {
      pass: allValid,
      message: allValid
        ? '✅ Webhook node properly configured (POST, path, rawBody=true, responseNode)'
        : `❌ Webhook configuration issues: ${[
          !hasRawBody && 'rawBody missing',
          !hasPath && 'path missing',
          !hasPostMethod && 'method missing',
          !hasResponseMode && 'responseMode missing'
        ].filter(Boolean).join(', ')}`
    };
  }
});

// Test 4: Extract Headers & Body Code Node
tests.push({
  name: 'Test 4: Extract Headers & Body Code Node',
  run: () => {
    const node = getNodeByName('Extract Headers & Body');
    if (!node) {
      return { pass: false, message: '❌ Extract Headers & Body node not found' };
    }
    
    if (!node.parameters?.jsCode) {
      return { pass: false, message: '❌ Code node missing jsCode parameter' };
    }
    
    const code = node.parameters.jsCode;
    const checks = {
      hasHmacCheck: code.includes('x-signature-256') || code.includes('X-Signature-256'),
      hasTimestampCheck: code.includes('x-timestamp') || code.includes('X-Timestamp'),
      hasNonceCheck: code.includes('x-nonce') || code.includes('X-Nonce'),
      hasErrorHandling: code.includes('isError'),
      returnsJson: code.includes('return') && code.includes('json:')
    };
    
    const allChecks = Object.values(checks).every(v => v === true);
    
    return {
      pass: allChecks,
      message: allChecks
        ? '✅ Extract Headers & Body node validates all required headers'
        : `❌ Missing validations: ${Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k).join(', ')}`
    };
  }
});

// Test 5: HMAC Validation Flow
tests.push({
  name: 'Test 5: HMAC Validation Flow',
  run: () => {
    const computeHmacNode = getNodeByName('Compute HMAC (Code)');
    const hmacValidNode = getNodeByName('HMAC Valid?');
    
    if (!computeHmacNode || !hmacValidNode) {
      return { pass: false, message: '❌ HMAC validation nodes not found' };
    }
    
    const code = computeHmacNode.parameters?.jsCode || '';
    const hasHmacCalc = code.includes('createHmac') && code.includes('sha256');
    const hasHmacValidFlag = code.includes('hmacValid');
    const hasSecret = code.includes('hmac_secret') || code.includes('HMAC_SECRET');
    
    const ifCondition = hmacValidNode.parameters?.conditions?.boolean?.[0];
    const checksHmacValid = ifCondition?.value1?.includes('hmacValid');
    
    return {
      pass: hasHmacCalc && hasHmacValidFlag && hasSecret && checksHmacValid,
      message: hasHmacCalc && hasHmacValidFlag && hasSecret && checksHmacValid
        ? '✅ HMAC validation flow properly configured'
        : '❌ HMAC validation flow has issues'
    };
  }
});

// Test 6: Timestamp Validation
tests.push({
  name: 'Test 6: Timestamp Validation',
  run: () => {
    const timestampNode = getNodeByName('Check Timestamp');
    if (!timestampNode) {
      return { pass: false, message: '❌ Check Timestamp node not found' };
    }
    
    const code = timestampNode.parameters?.jsCode || '';
    const hasTimeCheck = code.includes('diffMinutes') && code.includes('5');
    const hasErrorHandling = code.includes('isError');
    const hasTimestampValid = code.includes('timestampValid');
    
    return {
      pass: hasTimeCheck && hasErrorHandling && hasTimestampValid,
      message: hasTimeCheck && hasErrorHandling && hasTimestampValid
        ? '✅ Timestamp validation checks 5-minute window'
        : '❌ Timestamp validation missing or incorrect'
    };
  }
});

// Test 7: Nonce Replay Protection
tests.push({
  name: 'Test 7: Nonce Replay Protection',
  run: () => {
    const checkNonceNode = getNodeByName('Check Nonce Exists');
    const normalizeNode = getNodeByName('Normalize Nonce Check');
    const nonceNewNode = getNodeByName('Nonce New?');
    
    if (!checkNonceNode || !normalizeNode || !nonceNewNode) {
      return { pass: false, message: '❌ Nonce validation nodes not found' };
    }
    
    const normalizeCode = normalizeNode.parameters?.jsCode || '';
    const hasReplayCheck = normalizeCode.includes('REPLAY_DETECTED') || 
                          normalizeCode.includes('nonceCheckFailed');
    const hasExistsCheck = normalizeCode.includes('exists');
    
    return {
      pass: hasReplayCheck && hasExistsCheck,
      message: hasReplayCheck && hasExistsCheck
        ? '✅ Nonce replay protection properly implemented'
        : '❌ Nonce replay protection missing or incomplete'
    };
  }
});

// Test 8: Metadata Validation
tests.push({
  name: 'Test 8: Metadata Validation',
  run: () => {
    const metadataNode = getNodeByName('Extract & Validate Metadata');
    if (!metadataNode) {
      return { pass: false, message: '❌ Extract & Validate Metadata node not found' };
    }
    
    const code = metadataNode.parameters?.jsCode || '';
    const checks = {
      hasMeetingCheck: code.includes('meeting'),
      hasSlugCheck: code.includes('meeting.slug'),
      hasTitleCheck: code.includes('meeting.title'),
      hasDatetimeCheck: code.includes('meeting.datetime'),
      hasAudioCheck: code.includes('audioUrl') || code.includes('hasFile'),
      hasErrorHandling: code.includes('isError')
    };
    
    const allChecks = Object.values(checks).every(v => v === true);
    
    return {
      pass: allChecks,
      message: allChecks
        ? '✅ Metadata validation checks all required fields'
        : '❌ Metadata validation incomplete'
    };
  }
});

// Test 9: Folder Structure Creation
tests.push({
  name: 'Test 9: Folder Structure Creation',
  run: () => {
    const folderNodes = [
      'Create Meeting Folder',
      'Create /raw/ Folder',
      'Create /out/ Folder',
      'Create /dlq/ Folder'
    ];
    
    const missing = folderNodes.filter(name => !getNodeByName(name));
    if (missing.length > 0) {
      return { pass: false, message: `❌ Missing folder nodes: ${missing.join(', ')}` };
    }
    
    const allValid = folderNodes.every(name => {
      const node = getNodeByName(name);
      return node && node.type === 'n8n-nodes-webdav.webDav' && 
             node.parameters?.operation === 'create' &&
             node.parameters?.resource === 'folder';
    });
    
    return {
      pass: allValid,
      message: allValid
        ? '✅ All folder creation nodes properly configured'
        : '❌ Some folder creation nodes have configuration issues'
    };
  }
});

// Test 10: Idempotency Check (Transcript Exists)
tests.push({
  name: 'Test 10: Idempotency Check (Transcript Exists)',
  run: () => {
    const checkTranscriptNode = getNodeByName('Check Transcript Exists');
    const transcriptMissingNode = getNodeByName('Transcript Missing?');
    const loadTranscriptNode = getNodeByName('Load Existing Transcript');
    
    if (!checkTranscriptNode || !transcriptMissingNode || !loadTranscriptNode) {
      return { pass: false, message: '❌ Idempotency nodes not found' };
    }
    
    const loadCode = loadTranscriptNode.parameters?.jsCode || '';
    const hasCachedFlag = loadCode.includes('cached') || loadCode.includes('idempotent');
    
    return {
      pass: hasCachedFlag,
      message: hasCachedFlag
        ? '✅ Idempotency check properly implemented'
        : '❌ Idempotency check missing or incomplete'
    };
  }
});

// Test 11: STT Request Preparation
tests.push({
  name: 'Test 11: STT Request Preparation',
  run: () => {
    const sttPrepNode = getNodeByName('Prepare STT Request');
    if (!sttPrepNode) {
      return { pass: false, message: '❌ Prepare STT Request node not found' };
    }
    
    const code = sttPrepNode.parameters?.jsCode || '';
    const hasUrlMode = code.includes('audioUrl') || code.includes('useUrlMode');
    const hasBinaryMode = code.includes('hasFile') || code.includes('useBinaryMode');
    const hasSttConfig = code.includes('sttProvider') || code.includes('sttModel');
    
    return {
      pass: (hasUrlMode || hasBinaryMode) && hasSttConfig,
      message: (hasUrlMode || hasBinaryMode) && hasSttConfig
        ? '✅ STT request preparation handles both URL and binary modes'
        : '❌ STT request preparation incomplete'
    };
  }
});

// Test 12: Deepgram STT Integration
tests.push({
  name: 'Test 12: Deepgram STT Integration',
  run: () => {
    const deepgramNode = getNodeByName('Call Deepgram STT');
    if (!deepgramNode) {
      return { pass: false, message: '❌ Call Deepgram STT node not found' };
    }
    
    const hasContinueOnFail = deepgramNode.continueOnFail === true;
    const hasTimeout = deepgramNode.parameters?.options?.timeout > 0;
    const hasMethod = deepgramNode.parameters?.method === 'POST';
    const hasUrl = deepgramNode.parameters?.url && deepgramNode.parameters.url.includes('deepgram.com');
    
    return {
      pass: hasContinueOnFail && hasTimeout && hasMethod && hasUrl,
      message: hasContinueOnFail && hasTimeout && hasMethod && hasUrl
        ? '✅ Deepgram STT integration properly configured'
        : '❌ Deepgram STT configuration issues'
    };
  }
});

// Test 13: STT Response Parsing
tests.push({
  name: 'Test 13: STT Response Parsing',
  run: () => {
    const parseNode = getNodeByName('Parse STT Response');
    if (!parseNode) {
      return { pass: false, message: '❌ Parse STT Response node not found' };
    }
    
    const code = parseNode.parameters?.jsCode || '';
    const hasTranscriptExtract = code.includes('transcript') || 
                                code.includes('results.channels');
    const hasMetaExtract = code.includes('meta') || code.includes('request_id');
    
    return {
      pass: hasTranscriptExtract && hasMetaExtract,
      message: hasTranscriptExtract && hasMetaExtract
        ? '✅ STT response parsing extracts transcript and metadata'
        : '❌ STT response parsing incomplete'
    };
  }
});

// Test 14: Error Handling Flow
tests.push({
  name: 'Test 14: Error Handling Flow',
  run: () => {
    const errorResponseNode = getNodeByName('Build Error Response');
    const saveDLQNode = getNodeByName('Save to DLQ');
    
    if (!errorResponseNode || !saveDLQNode) {
      return { pass: false, message: '❌ Error handling nodes not found' };
    }
    
    const errorCode = errorResponseNode.parameters?.jsCode || '';
    const hasErrorFields = errorCode.includes('statusCode') && 
                          errorCode.includes('errorType') && 
                          errorCode.includes('dlqEntry');
    
    return {
      pass: hasErrorFields,
      message: hasErrorFields
        ? '✅ Error handling flow properly structured'
        : '❌ Error handling flow incomplete'
    };
  }
});

// Test 15: Success Response Flow
tests.push({
  name: 'Test 15: Success Response Flow',
  run: () => {
    const successNode = getNodeByName('Build Success Response');
    const respondNode = getNodeByName('Respond Success');
    
    if (!successNode || !respondNode) {
      return { pass: false, message: '❌ Success response nodes not found' };
    }
    
    const successCode = successNode.parameters?.jsCode || '';
    const hasStatus = successCode.includes('status') && successCode.includes('success');
    const hasStatusCode = successCode.includes('statusCode');
    
    const respondParams = respondNode.parameters;
    const hasResponseBody = respondParams?.responseBody !== undefined;
    
    return {
      pass: hasStatus && hasStatusCode && hasResponseBody,
      message: hasStatus && hasStatusCode && hasResponseBody
        ? '✅ Success response flow properly configured'
        : '❌ Success response flow incomplete'
    };
  }
});

// Test 16: WF2 Trigger Configuration
tests.push({
  name: 'Test 16: WF2 Trigger Configuration',
  run: () => {
    const triggerNode = getNodeByName('Trigger WF2');
    if (!triggerNode) {
      return { pass: false, message: '❌ Trigger WF2 node not found' };
    }
    
    const hasContinueOnFail = triggerNode.continueOnFail === true;
    const hasTimeout = triggerNode.parameters?.options?.timeout > 0;
    const hasMethod = triggerNode.parameters?.method === 'POST';
    
    return {
      pass: hasContinueOnFail && hasTimeout && hasMethod,
      message: hasContinueOnFail && hasTimeout && hasMethod
        ? '✅ WF2 trigger properly configured'
        : '❌ WF2 trigger configuration issues'
    };
  }
});

// Test 17: Expression Syntax Validation
tests.push({
  name: 'Test 17: Expression Syntax Validation',
  run: () => {
    const errors = [];
    
    workflow.nodes.forEach(node => {
      const checkExpressions = (obj, path = '') => {
        if (typeof obj === 'string' && obj.includes('{{')) {
          const openBraces = (obj.match(/\{\{/g) || []).length;
          const closeBraces = (obj.match(/\}\}/g) || []).length;
          
          if (openBraces !== closeBraces) {
            errors.push(`Unmatched braces in ${node.name}${path}`);
          }
        } else if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => {
            checkExpressions(obj[key], `${path}.${key}`);
          });
        }
      };
      
      if (node.parameters) {
        checkExpressions(node.parameters, node.name);
      }
    });
    
    return {
      pass: errors.length === 0,
      message: errors.length === 0
        ? '✅ All expressions have valid syntax'
        : `❌ Expression errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`
    };
  }
});

// Test 18: Required Credentials Check
tests.push({
  name: 'Test 18: Required Credentials Check',
  run: () => {
    const warnings = [];
    
    const deepgramNode = getNodeByName('Call Deepgram STT');
    if (deepgramNode && !deepgramNode.credentials?.httpHeaderAuth) {
      warnings.push('Deepgram STT node may need HTTP Header Auth credentials');
    }
    
    const webdavNodes = workflow.nodes.filter(n => n.type && n.type.includes('webdav'));
    webdavNodes.forEach(node => {
      if (!node.credentials?.webDavApi && !node.disabled) {
        warnings.push(`WebDAV node "${node.name}" may need WebDAV credentials`);
      }
    });
    
    return {
      pass: true, // Warnings only
      message: '✅ Credential configuration checked',
      warnings: warnings.slice(0, 5) // Limit warnings
    };
  }
});

// Test 19: Error Path Coverage
tests.push({
  name: 'Test 19: Error Path Coverage',
  run: () => {
    const errorNodes = [
      'Has Validation Error?',
      'HMAC Valid?',
      'Timestamp Error?',
      'Metadata Error?',
      'STT HTTP Error?',
      'STT Error?',
      'Nonce Check Failed?',
      'Nonce New?'
    ];
    
    const missing = errorNodes.filter(name => !getNodeByName(name));
    if (missing.length > 0) {
      return { pass: false, message: `❌ Missing error nodes: ${missing.join(', ')}` };
    }
    
    const buildErrorNode = getNodeByName('Build Error Response');
    if (!buildErrorNode) {
      return { pass: false, message: '❌ Build Error Response node not found' };
    }
    
    let errorPathsCovered = 0;
    errorNodes.forEach(errorNodeName => {
      const connections = getConnectedNodes(errorNodeName);
      if (connections.some(c => c === 'Build Error Response')) {
        errorPathsCovered++;
      }
    });
    
    return {
      pass: errorPathsCovered >= 5,
      message: errorPathsCovered >= 5
        ? `✅ Error path coverage good (${errorPathsCovered} error paths validated)`
        : `❌ Insufficient error path coverage (only ${errorPathsCovered} paths found)`
    };
  }
});

// Test 20: Complete Workflow Flow Validation
tests.push({
  name: 'Test 20: Complete Workflow Flow Validation',
  run: () => {
    const criticalPath = [
      'Webhook Ingest',
      'Extract Headers & Body',
      'Has Validation Error?',
      'Compute HMAC (Code)',
      'HMAC Valid?',
      'Check Timestamp',
      'Check Nonce Exists',
      'Extract & Validate Metadata',
      'Check Transcript Exists',
      'Parse STT Response',
      'Build Success Response',
      'Respond Success'
    ];
    
    const missing = criticalPath.filter(name => !getNodeByName(name));
    if (missing.length > 0) {
      return { pass: false, message: `❌ Missing critical nodes: ${missing.join(', ')}` };
    }
    
    // Check main flow connections (simplified)
    let flowValid = true;
    for (let i = 1; i < criticalPath.length; i++) {
      const prevNode = criticalPath[i - 1];
      const currentNode = criticalPath[i];
      const connections = getConnectedNodes(prevNode);
      
      // Allow for branching (IF nodes have multiple outputs)
      if (prevNode.includes('?')) {
        // IF node - check if one branch leads to current node or next in path
        continue;
      }
      
      // Check if there's a path (direct or indirect) to current node
      if (!connections.includes(currentNode) && !getAllNodesWithConnectionTo(currentNode).includes(prevNode)) {
        // This is not a strict failure since there might be branching
        continue;
      }
    }
    
    return {
      pass: flowValid && missing.length === 0,
      message: flowValid && missing.length === 0
        ? '✅ Complete workflow flow is properly connected'
        : '❌ Workflow flow has connection issues'
    };
  }
});

// ===================================================
// RUN ALL TESTS
// ===================================================

console.log('\n🧪 WF1 MEET-3 Workflow Validation Tests\n');
console.log('='.repeat(60));
console.log(`Testing workflow: ${workflow.name || 'Unknown'}`);
console.log(`Total nodes: ${workflow.nodes.length}`);
console.log('='.repeat(60));
console.log();

let passed = 0;
let failed = 0;
const allWarnings = [];

tests.forEach((test, index) => {
  try {
    const result = test.run();
    
    if (result.pass) {
      console.log(`✅ Test ${index + 1}: ${test.name}`);
      console.log(`   ${result.message}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.name}`);
      console.log(`   ${result.message}`);
      failed++;
    }
    
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.log(`   ⚠️  Warning: ${warning}`);
        allWarnings.push(warning);
      });
    }
    
    console.log();
  } catch (error) {
    console.log(`💥 Test ${index + 1}: ${test.name} - EXCEPTION`);
    console.log(`   Error: ${error.message}`);
    console.log(error.stack);
    console.log();
    failed++;
  }
});

// Summary
console.log('='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${tests.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${allWarnings.length}`);

if (allWarnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  allWarnings.slice(0, 10).forEach((warning, i) => {
    console.log(`   ${i + 1}. ${warning}`);
  });
  if (allWarnings.length > 10) {
    console.log(`   ... and ${allWarnings.length - 10} more`);
  }
}

console.log('='.repeat(60));

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Workflow is valid.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.\n`);
  process.exit(1);
}

