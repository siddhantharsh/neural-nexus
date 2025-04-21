// DOM Elements
const unificationCanvas = document.getElementById('unificationCanvas');
const startUnificationButton = document.getElementById('startUnification');
const nextStepButton = document.getElementById('nextStep');
const autoPlayButton = document.getElementById('autoPlay');
const clearButton = document.getElementById('clear');
const loadExampleButton = document.getElementById('loadExample');
const setTermsButton = document.getElementById('setTerms');
const term1Input = document.getElementById('term1');
const term2Input = document.getElementById('term2');
const currentStepElement = document.getElementById('currentStep');
const substitutionsElement = document.getElementById('substitutions');
const statusElement = document.getElementById('status');
const observationElement = document.getElementById('observation');
const substitutionItemsElement = document.getElementById('substitutionItems');

// State variables
let term1 = null;
let term2 = null;
let currentStep = 0;
let substitutionCount = 0;
let substitutions = [];
let isAutoPlaying = false;
let autoPlayInterval = null;
let isUnificationComplete = false;
let isUnificationFailed = false;
let currentSubstitution = null;
let highlightedNodes = [];

// Parse a term string into a structured object
function parseTerm(termString) {
    // Remove extra spaces
    termString = termString.trim();
    
    // Check if it's a variable (starts with lowercase)
    if (/^[a-z][a-zA-Z0-9]*$/.test(termString)) {
        return {
            type: 'variable',
            name: termString
        };
    }
    
    // Check if it's a constant (starts with uppercase or is a number)
    if (/^[A-Z][a-zA-Z0-9]*$/.test(termString) || /^[0-9]+$/.test(termString)) {
        return {
            type: 'constant',
            name: termString
        };
    }
    
    // Check if it's a function (has parentheses)
    if (termString.includes('(') && termString.endsWith(')')) {
        const functionName = termString.substring(0, termString.indexOf('('));
        const argsString = termString.substring(termString.indexOf('(') + 1, termString.length - 1);
        
        // Parse arguments
        const args = [];
        let currentArg = '';
        let parenthesesCount = 0;
        
        for (let i = 0; i < argsString.length; i++) {
            const char = argsString[i];
            
            if (char === '(') {
                parenthesesCount++;
                currentArg += char;
            } else if (char === ')') {
                parenthesesCount--;
                currentArg += char;
            } else if (char === ',' && parenthesesCount === 0) {
                args.push(parseTerm(currentArg.trim()));
                currentArg = '';
            } else {
                currentArg += char;
            }
        }
        
        if (currentArg.trim()) {
            args.push(parseTerm(currentArg.trim()));
        }
        
        return {
            type: 'function',
            name: functionName,
            args: args
        };
    }
    
    // If we can't parse it, return null
    return null;
}

// Check if a term contains a variable
function containsVariable(term, variable) {
    if (term.type === 'variable') {
        return term.name === variable;
    } else if (term.type === 'constant') {
        return false;
    } else if (term.type === 'function') {
        return term.args.some(arg => containsVariable(arg, variable));
    }
    return false;
}

// Apply a substitution to a term
function applySubstitution(term, substitution) {
    if (term.type === 'variable') {
        if (term.name === substitution.variable) {
            return JSON.parse(JSON.stringify(substitution.value)); // Deep copy
        }
        return term;
    } else if (term.type === 'constant') {
        return term;
    } else if (term.type === 'function') {
        return {
            type: 'function',
            name: term.name,
            args: term.args.map(arg => applySubstitution(arg, substitution))
        };
    }
    return term;
}

// Check if two terms are equal
function termsEqual(term1, term2) {
    if (term1.type !== term2.type) {
        return false;
    }
    
    if (term1.type === 'variable' || term1.type === 'constant') {
        return term1.name === term2.name;
    }
    
    if (term1.type === 'function') {
        if (term1.name !== term2.name || term1.args.length !== term2.args.length) {
            return false;
        }
        
        for (let i = 0; i < term1.args.length; i++) {
            if (!termsEqual(term1.args[i], term2.args[i])) {
                return false;
            }
        }
        
        return true;
    }
    
    return false;
}

// Unification algorithm step
function unificationStep() {
    if (isUnificationComplete || isUnificationFailed) {
        if (isAutoPlaying) {
            clearInterval(autoPlayInterval);
            isAutoPlaying = false;
        }
        return;
    }
    
    currentStep++;
    currentStepElement.textContent = currentStep;
    
    // If this is the first step, initialize
    if (currentStep === 1) {
        term1 = parseTerm(term1Input.value);
        term2 = parseTerm(term2Input.value);
        
        if (!term1 || !term2) {
            observationElement.innerHTML = `
                <h2>Error</h2>
                <p>Invalid term format. Please check your input.</p>
            `;
            statusElement.textContent = 'Error';
            isUnificationFailed = true;
            return;
        }
        
        // Visualize the initial terms
        visualizeTerms();
        
        observationElement.innerHTML = `
            <h2>Step ${currentStep}: Initial Terms</h2>
            <p><strong>Term 1:</strong> ${term1Input.value}</p>
            <p><strong>Term 2:</strong> ${term2Input.value}</p>
            <p>Starting unification process...</p>
        `;
        
        statusElement.textContent = 'In Progress';
        return;
    }
    
    // Get the current terms after applying all substitutions
    let currentTerm1 = JSON.parse(JSON.stringify(term1));
    let currentTerm2 = JSON.parse(JSON.stringify(term2));
    
    for (const substitution of substitutions) {
        currentTerm1 = applySubstitution(currentTerm1, substitution);
        currentTerm2 = applySubstitution(currentTerm2, substitution);
    }
    
    // Check if terms are already equal
    if (termsEqual(currentTerm1, currentTerm2)) {
        observationElement.innerHTML = `
            <h2>Step ${currentStep}: Unification Complete</h2>
            <p>The terms are now equal after applying ${substitutions.length} substitutions.</p>
            <p><strong>Final Term 1:</strong> ${JSON.stringify(currentTerm1)}</p>
            <p><strong>Final Term 2:</strong> ${JSON.stringify(currentTerm2)}</p>
        `;
        
        statusElement.textContent = 'Complete';
        isUnificationComplete = true;
        
        if (isAutoPlaying) {
            clearInterval(autoPlayInterval);
            isAutoPlaying = false;
        }
        
        return;
    }
    
    // Try to find a substitution
    const substitution = findSubstitution(currentTerm1, currentTerm2);
    
    if (substitution) {
        // Apply the substitution
        substitutions.push(substitution);
        substitutionCount++;
        substitutionsElement.textContent = substitutionCount;
        
        // Update the substitution list
        const substitutionItem = document.createElement('div');
        substitutionItem.className = 'substitution-item';
        substitutionItem.innerHTML = `
            <span>${substitution.variable} → ${JSON.stringify(substitution.value)}</span>
        `;
        substitutionItemsElement.appendChild(substitutionItem);
        
        // Highlight the nodes being unified
        highlightNodes(substitution.variable, substitution.value);
        
        observationElement.innerHTML = `
            <h2>Step ${currentStep}: Applying Substitution</h2>
            <p><strong>Substitution:</strong> ${substitution.variable} → ${JSON.stringify(substitution.value)}</p>
            <p>Applying this substitution to both terms...</p>
        `;
        
        // Visualize the terms after substitution
        setTimeout(() => {
            visualizeTerms();
        }, 1000);
    } else {
        observationElement.innerHTML = `
            <h2>Step ${currentStep}: Unification Failed</h2>
            <p>The terms cannot be unified. They are not compatible.</p>
            <p><strong>Term 1:</strong> ${JSON.stringify(currentTerm1)}</p>
            <p><strong>Term 2:</strong> ${JSON.stringify(currentTerm2)}</p>
        `;
        
        statusElement.textContent = 'Failed';
        isUnificationFailed = true;
        
        if (isAutoPlaying) {
            clearInterval(autoPlayInterval);
            isAutoPlaying = false;
        }
    }
}

// Find a substitution to apply
function findSubstitution(term1, term2) {
    // Case 1: One term is a variable
    if (term1.type === 'variable') {
        // Check if the variable occurs in term2
        if (containsVariable(term2, term1.name)) {
            return null; // Occurs check failed
        }
        return { variable: term1.name, value: term2 };
    }
    
    if (term2.type === 'variable') {
        // Check if the variable occurs in term1
        if (containsVariable(term1, term2.name)) {
            return null; // Occurs check failed
        }
        return { variable: term2.name, value: term1 };
    }
    
    // Case 2: Both terms are functions
    if (term1.type === 'function' && term2.type === 'function') {
        if (term1.name !== term2.name || term1.args.length !== term2.args.length) {
            return null; // Different function names or arities
        }
        
        // Try to unify arguments
        for (let i = 0; i < term1.args.length; i++) {
            const substitution = findSubstitution(term1.args[i], term2.args[i]);
            if (substitution) {
                return substitution;
            }
        }
        
        return null; // No substitution found
    }
    
    // Case 3: Both terms are constants
    if (term1.type === 'constant' && term2.type === 'constant') {
        if (term1.name !== term2.name) {
            return null; // Different constants
        }
        return null; // No substitution needed
    }
    
    // Case 4: Incompatible types
    return null;
}

// Visualize the terms on the canvas
function visualizeTerms() {
    // Clear the canvas
    unificationCanvas.innerHTML = '';
    
    // Get the current terms after applying all substitutions
    let currentTerm1 = JSON.parse(JSON.stringify(term1));
    let currentTerm2 = JSON.parse(JSON.stringify(term2));
    
    for (const substitution of substitutions) {
        currentTerm1 = applySubstitution(currentTerm1, substitution);
        currentTerm2 = applySubstitution(currentTerm2, substitution);
    }
    
    // Create visual representation of term1
    const term1Node = createTermNode(currentTerm1, 100, 100);
    unificationCanvas.appendChild(term1Node);
    
    // Create visual representation of term2
    const term2Node = createTermNode(currentTerm2, 100, 300);
    unificationCanvas.appendChild(term2Node);
    
    // Add a label for term1
    const term1Label = document.createElement('div');
    term1Label.className = 'term-label';
    term1Label.textContent = 'Term 1';
    term1Label.style.position = 'absolute';
    term1Label.style.left = '50px';
    term1Label.style.top = '70px';
    term1Label.style.fontWeight = 'bold';
    unificationCanvas.appendChild(term1Label);
    
    // Add a label for term2
    const term2Label = document.createElement('div');
    term2Label.className = 'term-label';
    term2Label.textContent = 'Term 2';
    term2Label.style.position = 'absolute';
    term2Label.style.left = '50px';
    term2Label.style.top = '270px';
    term2Label.style.fontWeight = 'bold';
    unificationCanvas.appendChild(term2Label);
    
    // Add an equals sign between the terms
    const equalsSign = document.createElement('div');
    equalsSign.className = 'equals-sign';
    equalsSign.textContent = '=';
    equalsSign.style.position = 'absolute';
    equalsSign.style.left = '50%';
    equalsSign.style.top = '50%';
    equalsSign.style.transform = 'translate(-50%, -50%)';
    equalsSign.style.fontSize = '2rem';
    equalsSign.style.fontWeight = 'bold';
    unificationCanvas.appendChild(equalsSign);
}

// Create a visual node for a term
function createTermNode(term, x, y) {
    const node = document.createElement('div');
    node.className = 'term-node';
    
    if (term.type === 'variable') {
        node.classList.add('variable');
        node.textContent = term.name;
    } else if (term.type === 'constant') {
        node.classList.add('constant');
        node.textContent = term.name;
    } else if (term.type === 'function') {
        node.classList.add('function');
        node.textContent = term.name;
        
        // Create nodes for arguments
        const argsContainer = document.createElement('div');
        argsContainer.className = 'args-container';
        argsContainer.style.position = 'absolute';
        argsContainer.style.left = '100%';
        argsContainer.style.top = '0';
        argsContainer.style.marginLeft = '10px';
        
        term.args.forEach((arg, index) => {
            const argNode = createTermNode(arg, x + 150, y + index * 50);
            argsContainer.appendChild(argNode);
            
            // Add a connection line
            const connection = document.createElement('div');
            connection.className = 'term-connection';
            connection.style.position = 'absolute';
            connection.style.left = '0';
            connection.style.top = '50%';
            connection.style.width = '10px';
            connection.style.transform = 'rotate(0deg)';
            argsContainer.appendChild(connection);
        });
        
        node.appendChild(argsContainer);
    }
    
    node.style.position = 'absolute';
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    
    return node;
}

// Highlight nodes that are being unified
function highlightNodes(variable, value) {
    // Clear previous highlights
    highlightedNodes.forEach(node => {
        node.classList.remove('highlighted');
    });
    highlightedNodes = [];
    
    // Find and highlight nodes for the variable and value
    const nodes = document.querySelectorAll('.term-node');
    nodes.forEach(node => {
        if (node.textContent === variable || node.textContent === JSON.stringify(value)) {
            node.classList.add('highlighted');
            highlightedNodes.push(node);
        }
    });
}

// Reset the unification process
function resetUnification() {
    currentStep = 0;
    substitutionCount = 0;
    substitutions = [];
    isUnificationComplete = false;
    isUnificationFailed = false;
    highlightedNodes = [];
    
    currentStepElement.textContent = '0';
    substitutionsElement.textContent = '0';
    statusElement.textContent = 'Ready';
    observationElement.innerHTML = `
        <h2>Observation</h2>
        <p>Enter terms and click "Start Unification" to begin</p>
    `;
    substitutionItemsElement.innerHTML = '';
    
    if (isAutoPlaying) {
        clearInterval(autoPlayInterval);
        isAutoPlaying = false;
    }
    
    // Clear the canvas
    unificationCanvas.innerHTML = '';
}

// Load an example
function loadExample() {
    term1Input.value = 'f(x, g(y, z))';
    term2Input.value = 'f(a, g(b, c))';
    resetUnification();
}

// Event Listeners
startUnificationButton.addEventListener('click', () => {
    resetUnification();
    unificationStep();
});

nextStepButton.addEventListener('click', () => {
    if (!isAutoPlaying) {
        unificationStep();
    }
});

autoPlayButton.addEventListener('click', () => {
    if (!isAutoPlaying) {
        isAutoPlaying = true;
        autoPlayInterval = setInterval(unificationStep, 2000);
    } else {
        isAutoPlaying = false;
        clearInterval(autoPlayInterval);
    }
});

clearButton.addEventListener('click', resetUnification);
loadExampleButton.addEventListener('click', loadExample);
setTermsButton.addEventListener('click', () => {
    resetUnification();
    observationElement.innerHTML = `
        <h2>Terms Set</h2>
        <p><strong>Term 1:</strong> ${term1Input.value}</p>
        <p><strong>Term 2:</strong> ${term2Input.value}</p>
        <p>Click "Start Unification" to begin the algorithm.</p>
    `;
});

// Initialize
resetUnification(); 