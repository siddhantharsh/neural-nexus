export function setSelectedNode(node, isRoot) {
    var unselectedTxt = document.getElementById("unselectedText");
    var nodeDiv = document.getElementById("nodeOptions");
    var deleteButton = document.getElementById("deleteNode");
    var staticDiv = document.getElementById("static");
    var staticInput = document.getElementById("staticValue");
    var runningText = document.getElementById("runningText");

    // Update node information fields
    const nodeType = document.getElementById("nodeType");
    const nodeValue = document.getElementById("nodeValue");
    const nodeChildren = document.getElementById("nodeChildren");
    const nodeAlpha = document.getElementById("nodeAlpha");
    const nodeBeta = document.getElementById("nodeBeta");

    if (node == -1) {
        unselectedTxt.style.display = "none";
        runningText.style.display = "block";
        nodeOptions.style.display = "none";
        if (staticDiv.style.display !== "none") {
            staticDiv.classList.add("slide-exit");
            setTimeout(() => {
                staticDiv.style.display = "none";
                staticDiv.classList.remove("slide-exit");
            }, 300);
        }
        return;
    };

    if (node == null) {
        runningText.style.display = "none";
        unselectedTxt.style.display = "block";
        nodeOptions.style.display = "none";
        if (staticDiv.style.display !== "none") {
            staticDiv.classList.add("slide-exit");
            setTimeout(() => {
                staticDiv.style.display = "none";
                staticDiv.classList.remove("slide-exit");
            }, 300);
        }
    } else {
        runningText.style.display = "none";
        unselectedTxt.style.display = "none"; 
        nodeOptions.style.display = "block";
        
        // Update node information
        nodeType.textContent = node.max ? "Max Node" : "Min Node";
        nodeValue.textContent = node.value !== null ? node.value : "Not Set";
        nodeChildren.textContent = node.children.length;
        nodeAlpha.textContent = node.alpha !== null ? (node.alpha === Number.POSITIVE_INFINITY ? "∞" : 
                               node.alpha === Number.NEGATIVE_INFINITY ? "-∞" : node.alpha) : "Not Set";
        nodeBeta.textContent = node.beta !== null ? (node.beta === Number.POSITIVE_INFINITY ? "∞" : 
                              node.beta === Number.NEGATIVE_INFINITY ? "-∞" : node.beta) : "Not Set";
        
        if (node.value != null) {
            if (staticDiv.style.display === "none") {
                staticDiv.style.display = "flex";
                staticDiv.classList.add("slide-enter");
                setTimeout(() => {
                    staticDiv.classList.remove("slide-enter");
                }, 300);
            }
            staticInput.value = node.value;
        } else {
            if (staticDiv.style.display !== "none") {
                staticDiv.classList.add("slide-exit");
                setTimeout(() => {
                    staticDiv.style.display = "none";
                    staticDiv.classList.remove("slide-exit");
                }, 300);
            }
        }
    };

    if (isRoot) {
        deleteNode.style.display = "none";
    } else {
        deleteNode.style.display = "block";
    };
};