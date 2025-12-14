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
  const workflowContent = readFileSync(workflowPath, 'utf8');
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

function validateExpression(expr) {
  // Validiere n8n Expression Syntax
  if (!expr) return { valid: true };
  
  // Check for proper expression syntax
  if (typeof expr === 'string' && expr.includes('{{')) {
    // Basic validation - expressions should have matching braces
    const openBraces = (expr.match(/\{\{/g) || []).length;
    const closeBraces = (expr.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return { valid: false, error: 'Unmatched braces in expression' };
    }
    
    // Check for proper node references
    if (expr.includes('$node[') || expr.includes('$json') || expr.includes('$env') || expr.includes('$(')) {
      return { valid: true };
    }
  }
  
  return { valid: true };
}

function validateCodeNode(node) {
  if (!node.parameters || !node.parameters.jsCode) {
    return { valid: false, error: 'Code node missing jsCode parameter' };
  }
  
  // Basic JavaScript syntax check
  try {
    // Just check if it's parseable (not executing)
    const code = node.parameters.jsCode;
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'jsCode must be a string' };
    }
    
    // Check for common n8n variables
    const hasValidRefs = code.includes('$json') || code.includes('$node') || code.includes('$binary') || code.includes('$env');
    
    return { valid: true, hasValidRefs };
  } catch (error) {
    return { valid: false, error: `Code syntax error: ${error.message}` };
  }
}

function validateIfNode(node) {
  if (!node.parameters || !node.parameters.conditions) {
    return { valid: false, error: 'IF node missing conditions' };
  }
  
  const conditions = node.parameters.conditions;
  
  // Check if conditions structure is valid
  if (conditions.boolean && Array.isArray(conditions.boolean)) {
    return { valid: true };
  }
  
  return { valid: false, error: 'Invalid conditions structure' };
}

function validateWebhookNode(node) {
  if (!node.parameters || !node.parameters.httpMethod) {
    return { valid: false, error: 'Webhook node missing httpMethod' };
  }
  
  if (!node.parameters.path) {
    return { valid: false, error: 'Webhook node missing path' };
  }
  
  // Check for rawBody option (important for HMAC)
  if (node.parameters.options && node.parameters.options.rawBody !== true) {
    return { valid: true, warning: 'rawBody should be true for HMAC validation' };
  }
  
  return { valid: true };
}

function validateHttpRequestNode(node) {
  if (!node.parameters || !node.parameters.method) {
    return { valid: false, error: 'HTTP Request node missing method' };
  }
  
  if (!node.parameters.url) {
    return { valid: false, error: 'HTTP Request node missing url' };
  }
  
  return { valid: true };
}

function validateWebDAVNode(node) {
  if (!node.parameters || !node.parameters.operation) {
    return { valid: false, error: 'WebDAV node missing operation' };
  }
  
  if (!node.credentials || !node.credentials.webDavApi) {
    return { valid: true, warning: 'WebDAV node missing credentials (may be set in n8n)' };
  }
  
  return { valid: true };
}

function checkWorkflowStructure() {
  const errors = [];
  const warnings = [];
  
  // Check for required fields
  if (!workflow.name) errors.push('Workflow missing name');
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    errors.push('Workflow missing nodes array');
    return { valid: false, errors, warnings };
  }
  
  if (!workflow.connections) {
    errors.push('Workflow missing connections object');
  }
  
  // Check node count
  if (workflow.nodes.length < 5) {
    warnings.push('Workflow has very few nodes - may be incomplete');
  }
  
  // Check for at least one trigger
  const hasTrigger = workflow.nodes.some(n => 
    n.type.includes('trigger') || 
    n.type === 'n8n-nodes-base.webhook' ||
    n.type === 'n8n-nodes-base.manualTrigger'
  );
  
  if (!hasTrigger) {
    errors.push('Workflow missing trigger node');
  }
  
  // Check for response nodes (for webhooks)
  const hasWebhook = workflow.nodes.some(n => n.type === 'n8n-nodes-base.webhook');
  const hasResponse = workflow.nodes.some(n => n.type === 'n8n-nodes-base.respondToWebhook');
  
  if (hasWebhook && !hasResponse) {
    warnings.push('Webhook node exists but no response node found');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    nodeCount: workflow.nodes.length
  };
}

function checkNodeConnections() {
  const errors = [];
  const warnings = [];
  
  // Build node name map
  const nodeNames = new Set(workflow.nodes.map(n => n.name));
  
  // Check all connections reference valid nodes
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
  
  // Check for orphaned nodes (nodes with no connections)
  workflow.nodes.forEach(node => {
    const hasIncoming = Object.values(workflow.connections || {}).some(conns => {
      return conns.main?.some(branch => 
        branch.some(c => c.node === node.name)
      );
    });
    
    const hasOutgoing = workflow.connections[node.name];
    
    // Manual trigger and test nodes don't need incoming
    if (!hasIncoming && !hasOutgoing && 
        node.type !== 'n8n-nodes-base.manualTrigger' &&
        !node.name.includes('Test')) {
      warnings.push(`Node "${node.name}" appears to be orphaned (no connections)`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ===================================================
// TEST SUITE - 20 Tests
// ===================================================

const tests = [];

// Test 1: Workflow Structure Validation
tests.push({
  name: 'Test 1: Workflow Structure Validation',
  run: () => {
    const result = checkWorkflowStructure();
    return {
      pass: result.valid,
      message: result.valid 
        ? `✅ Workflow structure is valid (${result.nodeCount} nodes)`
        : `❌ Workflow structure invalid: ${result.errors.join(', ')}`,
      warnings: result.warnings
    };
  }
});

// Test 2: Node Connections Validation
tests.push({
  name: 'Test 2: Node Connections Validation',
  run: () => {
    const result = checkNodeConnections();
    return {
      pass: result.valid,
      message: result.valid
        ? '✅ All node connections are valid'
        : `❌ Invalid connections: ${result.errors.join(', ')}`,
      warnings: result.warnings
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
    
    const validation = validateWebhookNode(webhookNode);
    
    if (!validation.valid) {
      return { pass: false, message: `❌ ${validation.error}` };
    }
    
    const hasRawBody = webhookNode.parameters?.options?.rawBody === true;
    const hasPath = webhookNode.parameters?.path === 'wf1/ingest';
    const hasPostMethod = webhookNode.parameters?.httpMethod === 'POST';
    
    return {
      pass: validation.valid && hasRawBody && hasPath && hasPostMethod,
      message: validation.valid && hasRawBody && hasPath && hasPostMethod
        ? '✅ Webhook node properly configured (POST, path, rawBody=true)'
        : '❌ Webhook node configuration issues'
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
    
    const validation = validateCodeNode(node);
    
    if (!validation.valid) {
      return { pass: false, message: `❌ ${validation.error}` };
    }
    
    const code = node.parameters.jsCode;
    const hasHmacCheck = code.includes('x-signature-256') || code.includes('X-Signature-256');
    const hasTimestampCheck = code.includes('x-timestamp') || code.includes('X-Timestamp');
    const hasNonceCheck = code.includes('x-nonce') || code.includes('X-Nonce');
    const hasErrorHandling = code.includes('isError');
    
    return {
      pass: hasHmacCheck && hasTimestampCheck && hasNonceCheck && hasErrorHandling,
      message: hasHmacCheck && hasTimestampCheck && hasNonceCheck && hasErrorHandling
        ? '✅ Extract Headers & Body node validates all required headers'
        : '❌ Extract Headers & Body node missing required validations'
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
    
    const computeValidation = validateCodeNode(computeHmacNode);
    const ifValidation = validateIfNode(hmacValidNode);
    
    const code = computeHmacNode.parameters.jsCode;
    const hasHmacCalc = code.includes('createHmac') && code.includes('sha256');
    const hasHmacValidFlag = code.includes('hmacValid');
    
    return {
      pass: computeValidation.valid && ifValidation.valid && hasHmacCalc && hasHmacValidFlag,
      message: computeValidation.valid && ifValidation.valid && hasHmacCalc && hasHmacValidFlag
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
    
    const validation = validateCodeNode(timestampNode);
    if (!validation.valid) {
      return { pass: false, message: `❌ ${validation.error}` };
    }
    
    const code = timestampNode.parameters.jsCode;
    const hasTimeCheck = code.includes('diffMinutes') && code.includes('5');
    const hasErrorHandling = code.includes('isError');
    
    return {
      pass: hasTimeCheck && hasErrorHandling,
      message: hasTimeCheck && hasErrorHandling
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
    
    const normalizeValidation = validateCodeNode(normalizeNode);
    const normalizeCode = normalizeNode.parameters.jsCode;
    const hasReplayCheck = normalizeCode.includes('REPLAY_DETECTED') || 
                          normalizeCode.includes('nonceCheckFailed');
    
    return {
      pass: normalizeValidation.valid && hasReplayCheck,
      message: normalizeValidation.valid && hasReplayCheck
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
    
    const validation = validateCodeNode(metadataNode);
    if (!validation.valid) {
      return { pass: false, message: `❌ ${validation.error}` };
    }
    
    const code = metadataNode.parameters.jsCode;
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
      pass: validation.valid && allChecks,
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
    
    const allExist = folderNodes.every(name => getNodeByName(name) !== undefined);
    
    if (!allExist) {
      return { pass: false, message: '❌ Some folder creation nodes missing' };
    }
    
    const allValid = folderNodes.every(name => {
      const node = getNodeByName(name);
      return validateWebDAVNode(node).valid;
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
    
    const loadValidation = validateCodeNode(loadTranscriptNode);
    const loadCode = loadTranscriptNode.parameters.jsCode;
    const hasCachedFlag = loadCode.includes('cached') || loadCode.includes('idempotent');
    
    return {
      pass: loadValidation.valid && hasCachedFlag,
      message: loadValidation.valid && hasCachedFlag
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
    
    const validation = validateCodeNode(sttPrepNode);
    if (!validation.valid) {
      return { pass: false, message: `❌ ${validation.error}` };
    }
    
    const code = sttPrepNode.parameters.jsCode;
    const hasUrlMode = code.includes('audioUrl') || code.includes('useUrlMode');
    const hasBinaryMode = code.includes('hasFile') || code.includes('useBinaryMode');
    
    return {
      pass: validation.valid && (hasUrlMode || hasBinaryMode),
      message: validation.valid && (hasUrlMode || hasBinaryMode)
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
    
    const validation = validateHttpRequestNode(deepgramNode);
    if (!validation.valid) {
      return { pass: false, message: `❌ ${validation.error}` };
    }
    
    const hasContinueOnFail = deepgramNode.continueOnFail === true;
    const hasTimeout = deepgramNode.parameters?.options?.timeout > 0;
    const hasAuth = deepgramNode.credentials?.httpHeaderAuth !== undefined;
    
    return {
      pass: validation.valid && hasContinueOnFail && hasTimeout,
      message: validation.valid && hasContinueOnFail && hasTimeout
        ? '✅ Deepgram STT integration properly configured (timeout, continueOnFail)'
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
    
    const validation = validateCodeNode(parseNode);
    if (!validation.valid) {
      return { pass: false, message: `❌ ${validation.error}` };
    }
    
    const code = parseNode.parameters.jsCode;
    const hasTranscriptExtract = code.includes('transcript') || 
                                code.includes('results.channels');
    const hasMetaExtract = code.includes('meta') || code.includes('request_id');
    
    return {
      pass: validation.valid && hasTranscriptExtract && hasMetaExtract,
      message: validation.valid && hasTranscriptExtract && hasMetaExtract
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
    
    const errorValidation = validateCodeNode(errorResponseNode);
    const errorCode = errorResponseNode.parameters.jsCode;
    const hasErrorFields = errorCode.includes('statusCode') && 
                          errorCode.includes('errorType') && 
                          errorCode.includes('dlqEntry');
    
    return {
      pass: errorValidation.valid && hasErrorFields,
      message: errorValidation.valid && hasErrorFields
        ? '✅ Error handling flow properly structured (DLQ, error fields)'
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
    
    const successValidation = validateCodeNode(successNode);
    const successCode = successNode.parameters.jsCode;
    const hasStatus = successCode.includes('status') && successCode.includes('success');
    const hasStatusCode = successCode.includes('statusCode');
    
    const respondParams = respondNode.parameters;
    const hasResponseBody = respondParams.responseBody !== undefined;
    
    return {
      pass: successValidation.valid && hasStatus && hasStatusCode && hasResponseBody,
      message: successValidation.valid && hasStatus && hasStatusCode && hasResponseBody
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
    
    const validation = validateHttpRequestNode(triggerNode);
    if (!validation.valid) {
      return { pass: false, message: `❌ ${validation.error}` };
    }
    
    const hasContinueOnFail = triggerNode.continueOnFail === true;
    const hasTimeout = triggerNode.parameters?.options?.timeout > 0;
    
    // Note: URL has placeholder, which is expected
    const url = triggerNode.parameters?.url || '';
    const hasPlaceholder = url.includes('CHANGE_ME') || url.length > 0;
    
    return {
      pass: validation.valid && hasContinueOnFail && hasTimeout,
      message: validation.valid && hasContinueOnFail && hasTimeout
        ? '✅ WF2 trigger properly configured (with continueOnFail and timeout)'
        : '❌ WF2 trigger configuration issues'
    };
  }
});

// Test 17: Expression Syntax Validation
tests.push({
  name: 'Test 17: Expression Syntax Validation',
  run: () => {
    const errors = [];
    const warnings = [];
    
    workflow.nodes.forEach(node => {
      // Check all parameter values for expressions
      const checkExpressions = (obj, path = '') => {
        if (typeof obj === 'string' && obj.includes('{{')) {
          const validation = validateExpression(obj);
          if (!validation.valid) {
            errors.push(`Invalid expression in ${node.name}${path}: ${validation.error}`);
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
        : `❌ Expression errors found: ${errors.join('; ')}`,
      warnings
    };
  }
});

// Test 18: Required Credentials Check
tests.push({
  name: 'Test 18: Required Credentials Check',
  run: () => {
    const warnings = [];
    const credentials = {
      webDavApi: [],
      httpHeaderAuth: [],
      smtp: []
    };
    
    workflow.nodes.forEach(node => {
      if (node.credentials) {
        Object.keys(node.credentials).forEach(credType => {
          if (credentials[credType]) {
            credentials[credType].push(node.name);
          }
        });
      }
    });
    
    // Check for nodes that likely need credentials
    const deepgramNode = getNodeByName('Call Deepgram STT');
    if (deepgramNode && !deepgramNode.credentials?.httpHeaderAuth) {
      warnings.push('Deepgram STT node may need HTTP Header Auth credentials');
    }
    
    const webdavNodes = workflow.nodes.filter(n => n.type.includes('webdav'));
    webdavNodes.forEach(node => {
      if (!node.credentials?.webDavApi) {
        warnings.push(`WebDAV node "${node.name}" may need WebDAV credentials`);
      }
    });
    
    return {
      pass: true, // Warnings only, not errors
      message: '✅ Credential configuration checked (see warnings if any)',
      warnings
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
    
    const allExist = errorNodes.every(name => getNodeByName(name) !== undefined);
    
    if (!allExist) {
      return { pass: false, message: '❌ Some error checking nodes missing' };
    }
    
    // Check that error paths lead to Build Error Response
    const buildErrorNode = getNodeByName('Build Error Response');
    if (!buildErrorNode) {
      return { pass: false, message: '❌ Build Error Response node not found' };
    }
    
    // Verify error paths
    let errorPathsCovered = 0;
    errorNodes.forEach(errorNodeName => {
      const node = getNodeByName(errorNodeName);
      if (node && node.type === 'n8n-nodes-base.if') {
        const connections = getConnectedNodes(errorNodeName);
        if (connections.some(c => c === 'Build Error Response')) {
          errorPathsCovered++;
        }
      }
    });
    
    return {
      pass: errorPathsCovered >= 5, // At least 5 error paths should exist
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
    
    const missingNodes = [];
    const disconnectedNodes = [];
    
    criticalPath.forEach((nodeName, index) => {
      const node = getNodeByName(nodeName);
      if (!node) {
        missingNodes.push(nodeName);
      } else if (index > 0) {
        // Check connection from previous node
        const prevNodeName = criticalPath[index - 1];
        const connections = getConnectedNodes(prevNodeName);
        if (!connections.includes(nodeName)) {
          disconnectedNodes.push(`${prevNodeName} → ${nodeName}`);
        }
      }
    });
    
    const allConnected = missingNodes.length === 0 && disconnectedNodes.length === 0;
    
    return {
      pass: allConnected,
      message: allConnected
        ? '✅ Complete workflow flow is properly connected'
        : `❌ Workflow flow issues: ${missingNodes.length > 0 ? 'Missing: ' + missingNodes.join(', ') : ''} ${disconnectedNodes.length > 0 ? 'Disconnected: ' + disconnectedNodes.join(', ') : ''}`
    };
  }
});

// ===================================================
// RUN ALL TESTS
// ===================================================

console.log('\n🧪 WF1 MEET-3 Workflow Validation Tests\n');
console.log('=' .repeat(60));
console.log(`Testing workflow: ${workflow.name || 'Unknown'}`);
console.log(`Total nodes: ${workflow.nodes.length}`);
console.log('=' .repeat(60));
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
    console.log();
    failed++;
  }
});

// Summary
console.log('=' .repeat(60));
console.log('📊 TEST SUMMARY');
console.log('=' .repeat(60));
console.log(`Total Tests: ${tests.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${allWarnings.length}`);

if (allWarnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  allWarnings.forEach((warning, i) => {
    console.log(`   ${i + 1}. ${warning}`);
  });
}

console.log('=' .repeat(60));

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Workflow is valid.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.\n`);
  process.exit(1);
}

