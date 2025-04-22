// Canvas setup and state management
let canvas, ctx;
let isDrawing = false;
let currentTool = 'draw';
let rooms = [];
let currentPath = [];
let adjacencyGraph = {};
let colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B9B9B'];
let selectedColor = colors[0];
let currentStep = 0;
let animationSpeed = 500;
let stats = {
    roomCount: 0,
    colorCount: 0,
    conflicts: 0
};

// Add selection state
let selectedRoom = null;

// Add dragging state
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let draggedRoom = null;
let highlightedRoom = null;

// Add coloring state
let isColoring = false;
let currentColorIndex = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupCanvas();
    setupEventListeners();
    setupColorPalette();
    showOverlayMessage('Click and drag to draw rooms');
});

// Canvas setup
function setupCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        redrawRooms();
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// Event listeners setup
function setupEventListeners() {
    // Drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseleave', endDrawing);
    
    // Tool selection
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTool = e.target.dataset.tool;
            document.querySelectorAll('.tool-btn').forEach(b => {
                b.classList.remove('active');
                b.querySelector('i').classList.remove('fa-spin');
            });
            e.target.classList.add('active');
            if (currentTool === 'drag') {
                e.target.querySelector('i').classList.add('fa-spin');
            }
            updateCursor();
        });
    });
    
    // Algorithm selection
    document.getElementById('algorithm-select').addEventListener('change', (e) => {
        const algorithm = e.target.value;
        resetColors();
        if (algorithm === 'greedy') {
            colorRoomsGreedy();
        } else if (algorithm === 'backtracking') {
            colorRoomsBacktracking();
        }
    });
    
    // Action buttons
    document.getElementById('clear-btn').addEventListener('click', clearCanvas);
    document.getElementById('generate-btn').addEventListener('click', generateRandomRooms);
    
    // Replace select with drag events
    canvas.addEventListener('mousedown', (e) => {
        if (currentTool === 'drag') {
            startDragging(e);
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (currentTool === 'drag') {
            dragRoom(e);
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        if (currentTool === 'drag') {
            stopDragging();
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        if (currentTool === 'drag') {
            stopDragging();
        }
    });
    
    // Add hover effect for drag tool
    canvas.addEventListener('mousemove', (e) => {
        if (currentTool === 'drag' && !isDragging) {
            const point = getCanvasPoint(e);
            const roomUnderMouse = findRoomAtPoint(point);
            
            if (roomUnderMouse !== highlightedRoom) {
                highlightedRoom = roomUnderMouse;
                redrawRooms();
            }
        }
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' && selectedRoom) {
            // Remove selected room
            rooms = rooms.filter(room => room.id !== selectedRoom.id);
            selectedRoom = null;
            updateAdjacencyGraph();
            updateStats();
            redrawRooms();
            showOverlayMessage('Room deleted');
        }
    });
    
    // Add color button listener
    document.getElementById('color-btn').addEventListener('click', startColoring);
    
    // Add erase functionality
    canvas.addEventListener('mousedown', eraseRoom);
    canvas.addEventListener('mousemove', (e) => {
        if (e.buttons === 1) { // Left mouse button is held down
            eraseRoom(e);
        }
    });
}

// Color palette setup
function setupColorPalette() {
    const palette = document.querySelector('.color-palette');
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.addEventListener('click', () => {
            selectedColor = color;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
        });
        palette.appendChild(swatch);
    });
}

// Drawing functions
function startDrawing(e) {
    if (currentTool !== 'draw') return;
    
    isDrawing = true;
    const point = getCanvasPoint(e);
    currentPath = [point];
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
}

function draw(e) {
    if (!isDrawing || currentTool !== 'draw') return;
    
    const point = getCanvasPoint(e);
    currentPath.push(point);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawRooms();
    
    // Draw current path
    ctx.beginPath();
    ctx.moveTo(currentPath[0].x, currentPath[0].y);
    currentPath.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.strokeStyle = '#000';
    ctx.stroke();
}

function endDrawing() {
    if (!isDrawing || currentTool !== 'draw') return;
    
    if (currentPath.length >= 3) {
        const room = {
            id: Date.now(),
            path: currentPath,
            color: null,
            center: calculateCenter(currentPath)
        };
        
        rooms.push(room);
        updateAdjacencyGraph();
        updateStats();
        showSuccessAnimation(room);
    }
    
    isDrawing = false;
    currentPath = [];
    redrawRooms();
}

// Room management
function redrawRooms() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw adjacency lines first
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Create dashed lines
    
    for (const roomId in adjacencyGraph) {
        const room1 = rooms.find(r => r.id === parseInt(roomId));
        if (room1) {
            adjacencyGraph[roomId].forEach(adjId => {
                const room2 = rooms.find(r => r.id === adjId);
                if (room2) {
                    // Draw line between room centers
                    ctx.beginPath();
                    ctx.moveTo(room1.center.x, room1.center.y);
                    ctx.lineTo(room2.center.x, room2.center.y);
                    ctx.stroke();
                }
            });
        }
    }
    ctx.restore();
    
    // Sort rooms to ensure proper layering (dragged room on top)
    const sortedRooms = [...rooms].sort((a, b) => {
        if (a === draggedRoom) return 1;
        if (b === draggedRoom) return -1;
        return 0;
    });
    
    sortedRooms.forEach(room => {
        ctx.beginPath();
        ctx.moveTo(room.path[0].x, room.path[0].y);
        room.path.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.closePath();
        
        // Fill room with color
        if (room.color) {
            ctx.fillStyle = room.color;
        } else {
            ctx.fillStyle = room.type?.color || '#ffffff';
        }
        
        // Add transparency for overlapping rooms
        if (room === draggedRoom) {
            ctx.globalAlpha = 0.8;
        } else {
            ctx.globalAlpha = 0.9; // Slightly transparent to show overlaps
        }
        
        ctx.fill();
        
        // Draw room border with different styles
        if (room === draggedRoom) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            const pulse = Math.sin(Date.now() / 200) * 2;
            ctx.lineWidth = 3 + pulse;
        } else if (room === highlightedRoom) {
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
        }
        ctx.stroke();
        
        // Reset styles
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1.0;
    });
}

function calculateCenter(path) {
    const x = path.reduce((sum, p) => sum + p.x, 0) / path.length;
    const y = path.reduce((sum, p) => sum + p.y, 0) / path.length;
    return { x, y };
}

function updateAdjacencyGraph() {
    adjacencyGraph = {};
    rooms.forEach(room => {
        adjacencyGraph[room.id] = [];
    });
    
    for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
            if (areRoomsAdjacent(rooms[i], rooms[j])) {
                adjacencyGraph[rooms[i].id].push(rooms[j].id);
                adjacencyGraph[rooms[j].id].push(rooms[i].id);
            }
        }
    }
}

function areRoomsAdjacent(room1, room2) {
    const bounds1 = getRoomBounds(room1);
    const bounds2 = getRoomBounds(room2);
    
    // Calculate the overlap area
    const xOverlap = Math.min(bounds1.right, bounds2.right) - Math.max(bounds1.left, bounds2.left);
    const yOverlap = Math.min(bounds1.bottom, bounds2.bottom) - Math.max(bounds1.top, bounds2.top);
    
    // Check if there's any overlap
    if (xOverlap > 0 && yOverlap > 0) {
        return true;
    }
    
    // If no overlap, check if they're close enough (within threshold)
    const threshold = 15;
    
    // Check if edges are close enough
    const horizontallyClose = Math.abs(bounds1.left - bounds2.right) < threshold || 
                            Math.abs(bounds1.right - bounds2.left) < threshold;
    const verticallyClose = Math.abs(bounds1.top - bounds2.bottom) < threshold || 
                           Math.abs(bounds1.bottom - bounds2.top) < threshold;
    
    // Check if the rooms are adjacent (sharing an edge or corner)
    const horizontalOverlap = bounds1.left <= bounds2.right + threshold && bounds1.right >= bounds2.left - threshold;
    const verticalOverlap = bounds1.top <= bounds2.bottom + threshold && bounds1.bottom >= bounds2.top - threshold;
    
    return (horizontallyClose && verticalOverlap) || (verticallyClose && horizontalOverlap);
}

// Coloring algorithms
function colorRoomsGreedy() {
    if (!isColoring) return;
    
    // Sort rooms by number of connections (most connected first)
    const sortedRooms = [...rooms].sort((a, b) => 
        (adjacencyGraph[b.id]?.length || 0) - (adjacencyGraph[a.id]?.length || 0)
    );
    
    let currentRoom = sortedRooms[currentColorIndex];
    if (currentRoom) {
        // Find available colors for this room
        const usedColors = new Set(
            adjacencyGraph[currentRoom.id]?.map(id => 
                rooms.find(r => r.id === id)?.color
            ).filter(Boolean) || []
        );
        
        // Find first available color
        const availableColor = colors.find(color => !usedColors.has(color));
        if (availableColor) {
            currentRoom.color = availableColor;
            showColoringAnimation(currentRoom);
        }
        
        currentColorIndex++;
        
        // Continue coloring after delay
        setTimeout(() => {
            if (currentColorIndex < sortedRooms.length) {
                colorRoomsGreedy();
            } else {
                isColoring = false;
                updateButtonStates();
                updateStats();
                showOverlayMessage('Coloring complete');
            }
        }, 500);
    }
}

function colorRoomsBacktracking() {
    if (!isColoring) return;
    
    let currentRoom = rooms[currentColorIndex];
    if (currentRoom) {
        // Try each color
        const usedColors = new Set(
            adjacencyGraph[currentRoom.id]?.map(id => 
                rooms.find(r => r.id === id)?.color
            ).filter(Boolean) || []
        );
        
        const availableColor = colors.find(color => !usedColors.has(color));
        if (availableColor) {
            currentRoom.color = availableColor;
            showColoringAnimation(currentRoom);
            currentColorIndex++;
            
            // Continue coloring after delay
            setTimeout(() => {
                if (currentColorIndex < rooms.length) {
                    colorRoomsBacktracking();
                } else {
                    isColoring = false;
                    updateButtonStates();
                    updateStats();
                    showOverlayMessage('Coloring complete');
                }
            }, 500);
        } else {
            // Backtrack
            currentRoom.color = null;
            currentColorIndex--;
            if (currentColorIndex >= 0) {
                setTimeout(colorRoomsBacktracking, 500);
            } else {
                isColoring = false;
                updateButtonStates();
                showOverlayMessage('No valid coloring found');
            }
        }
    }
}

// Utility functions
function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function getDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateStats() {
    stats.roomCount = rooms.length;
    stats.colorCount = new Set(rooms.map(r => r.color).filter(Boolean)).size;
    stats.conflicts = countConflicts();
    
    document.getElementById('room-count').textContent = stats.roomCount;
    document.getElementById('color-count').textContent = stats.colorCount;
    document.getElementById('conflict-count').textContent = stats.conflicts;
}

function countConflicts() {
    let conflicts = 0;
    for (const roomId in adjacencyGraph) {
        const room = rooms.find(r => r.id === parseInt(roomId));
        adjacencyGraph[roomId].forEach(adjId => {
            const adjRoom = rooms.find(r => r.id === adjId);
            if (room.color && adjRoom.color && room.color === adjRoom.color) {
                conflicts++;
            }
        });
    }
    return conflicts / 2; // Each conflict is counted twice
}

// Animation and visual feedback
function showColoringAnimation(room) {
    room.element?.classList.remove('coloring');
    void room.element?.offsetWidth; // Force reflow
    room.element?.classList.add('coloring');
    redrawRooms();
}

function showErrorAnimation(room) {
    room.element?.classList.add('error-shake');
    setTimeout(() => {
        room.element?.classList.remove('error-shake');
    }, 500);
}

function showSuccessAnimation(room) {
    room.element?.classList.add('success-pulse');
    setTimeout(() => {
        room.element?.classList.remove('success-pulse');
    }, 1000);
}

function showOverlayMessage(message, duration = 2000) {
    const overlay = document.querySelector('.canvas-overlay');
    overlay.textContent = message;
    overlay.style.opacity = '1';
    
    setTimeout(() => {
        overlay.style.opacity = '0';
    }, duration);
}

// UI actions
function clearCanvas() {
    rooms = [];
    adjacencyGraph = {};
    currentPath = [];
    updateStats();
    redrawRooms();
    showOverlayMessage('Canvas cleared');
}

function generateRandomRooms() {
    clearCanvas();
    
    const numRooms = 4 + Math.floor(Math.random() * 3); // 4-6 rooms
    const roomSize = Math.min(canvas.width, canvas.height) / 5; // Base room size
    
    for (let i = 0; i < numRooms; i++) {
        // Create rooms with more consistent sizes
        const width = roomSize * (0.9 + Math.random() * 0.2);
        const height = roomSize * (0.9 + Math.random() * 0.2);
        
        let x, y;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            if (i === 0) {
                // First room in the center
                x = canvas.width / 2 - width / 2;
                y = canvas.height / 2 - height / 2;
                break;
            } else {
                // Choose a random existing room to connect to
                const randomExistingRoom = rooms[Math.floor(Math.random() * rooms.length)];
                const bounds = getRoomBounds(randomExistingRoom);
                
                // Ensure significant overlap (25-35% of room size)
                const overlap = roomSize * (0.25 + Math.random() * 0.1);
                
                // Random position adjacent to the chosen room
                const side = Math.floor(Math.random() * 4);
                const randomOffset = (Math.random() - 0.5) * roomSize * 0.3;
                
                switch (side) {
                    case 0: // top
                        x = bounds.left + randomOffset;
                        y = bounds.top - height + overlap;
                        break;
                    case 1: // right
                        x = bounds.right - overlap;
                        y = bounds.top + randomOffset;
                        break;
                    case 2: // bottom
                        x = bounds.left + randomOffset;
                        y = bounds.bottom - overlap;
                        break;
                    case 3: // left
                        x = bounds.left - width + overlap;
                        y = bounds.top + randomOffset;
                        break;
                }
                
                // Ensure rooms stay within canvas bounds
                x = Math.max(0, Math.min(canvas.width - width, x));
                y = Math.max(0, Math.min(canvas.height - height, y));
            }
            
            attempts++;
        } while (attempts < maxAttempts && !isValidPosition(x, y, { width, height }));
        
        if (attempts >= maxAttempts) continue; // Skip this room if we couldn't find a valid position
        
        const path = [
            { x: x, y: y },
            { x: x + width, y: y },
            { x: x + width, y: y + height },
            { x: x, y: y + height }
        ];
        
        const room = {
            id: Date.now() + i,
            path: path,
            color: null,
            center: { x: x + width/2, y: y + height/2 }
        };
        
        rooms.push(room);
    }
    
    updateAdjacencyGraph();
    updateStats();
    redrawRooms();
    showOverlayMessage('Rooms generated with proper adjacency');
}

function createRoom(type, position) {
    const points = [];
    const { width, height } = type;
    const { x, y } = position;

    // Create regular rectangular shape with slight variations
    const variation = 10;
    points.push({ x: x + Math.random() * variation, y: y + Math.random() * variation });
    points.push({ x: x + width - Math.random() * variation, y: y + Math.random() * variation });
    points.push({ x: x + width - Math.random() * variation, y: y + height - Math.random() * variation });
    points.push({ x: x + Math.random() * variation, y: y + height - Math.random() * variation });

    return {
        id: Date.now() + Math.random(),
        path: points,
        color: null,
        center: { x: x + width/2, y: y + height/2 },
        type: type.name
    };
}

function findConnectedPosition(lastRoom, newRoomType) {
    const margin = 20; // Minimum space between rooms
    const attempts = 10;
    
    for (let i = 0; i < attempts; i++) {
        // Try to place room adjacent to the last room
        const side = Math.floor(Math.random() * 4); // 0: right, 1: bottom, 2: left, 3: top
        let x, y;
        
        const lastBounds = getRoomBounds(lastRoom);
        
        switch(side) {
            case 0: // Right
                x = lastBounds.right + margin;
                y = lastBounds.top + (Math.random() - 0.5) * (lastBounds.height - newRoomType.height);
                break;
            case 1: // Bottom
                x = lastBounds.left + (Math.random() - 0.5) * (lastBounds.width - newRoomType.width);
                y = lastBounds.bottom + margin;
                break;
            case 2: // Left
                x = lastBounds.left - newRoomType.width - margin;
                y = lastBounds.top + (Math.random() - 0.5) * (lastBounds.height - newRoomType.height);
                break;
            case 3: // Top
                x = lastBounds.left + (Math.random() - 0.5) * (lastBounds.width - newRoomType.width);
                y = lastBounds.top - newRoomType.height - margin;
                break;
        }
        
        // Check if the position is valid (within canvas bounds and not overlapping)
        if (isValidPosition(x, y, newRoomType)) {
            return { x, y };
        }
    }
    
    return null;
}

function getRoomBounds(room) {
    const xs = room.path.map(p => p.x);
    const ys = room.path.map(p => p.y);
    return {
        left: Math.min(...xs),
        right: Math.max(...xs),
        top: Math.min(...ys),
        bottom: Math.max(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys)
    };
}

function isValidPosition(x, y, roomType) {
    // Check canvas bounds
    if (x < 0 || y < 0 || x + roomType.width > canvas.width || y + roomType.height > canvas.height) {
        return false;
    }
    
    // For the first room, any position within bounds is valid
    if (rooms.length === 0) {
        return true;
    }
    
    // Check if the new room would be adjacent to at least one existing room
    const newRoom = {
        path: [
            { x: x, y: y },
            { x: x + roomType.width, y: y },
            { x: x + roomType.width, y: y + roomType.height },
            { x: x, y: y + roomType.height }
        ]
    };
    
    let hasAdjacent = false;
    for (const room of rooms) {
        if (areRoomsAdjacent(newRoom, room)) {
            hasAdjacent = true;
            break;
        }
    }
    
    return hasAdjacent;
}

function resetColors() {
    rooms.forEach(room => {
        room.color = null;
    });
    updateStats();
    redrawRooms();
}

function updateCursor() {
    switch(currentTool) {
        case 'draw':
            canvas.style.cursor = 'crosshair';
            break;
        case 'drag':
            canvas.style.cursor = 'move';
            break;
        case 'erase':
            canvas.style.cursor = 'not-allowed';
            break;
        default:
            canvas.style.cursor = 'default';
    }
}

// Add dragging functionality
function startDragging(e) {
    if (currentTool !== 'drag') return;
    
    const point = getCanvasPoint(e);
    const roomToDrag = findRoomAtPoint(point);
    
    if (roomToDrag) {
        // Highlight the room immediately on click
        highlightedRoom = roomToDrag;
        isDragging = true;
        draggedRoom = roomToDrag;
        
        // Calculate offset from mouse to room corner
        const bounds = getRoomBounds(roomToDrag);
        dragOffset = {
            x: point.x - bounds.left,
            y: point.y - bounds.top
        };
        
        // Show feedback
        showOverlayMessage(`Selected: ${roomToDrag.type || 'Room'}`);
        
        // Redraw to show highlight
        redrawRooms();
    } else {
        // Clicked empty space - clear highlight
        highlightedRoom = null;
        redrawRooms();
    }
}

function dragRoom(e) {
    if (!isDragging || !draggedRoom) return;
    
    const point = getCanvasPoint(e);
    const newX = point.x - dragOffset.x;
    const newY = point.y - dragOffset.y;
    
    // Check if new position is within canvas bounds
    if (isValidDragPosition(newX, newY, draggedRoom)) {
        // Calculate movement delta
        const bounds = getRoomBounds(draggedRoom);
        const deltaX = newX - bounds.left;
        const deltaY = newY - bounds.top;
        
        // Move all points of the room
        draggedRoom.path = draggedRoom.path.map(point => ({
            x: point.x + deltaX,
            y: point.y + deltaY
        }));
        
        // Update room center
        draggedRoom.center = {
            x: draggedRoom.center.x + deltaX,
            y: draggedRoom.center.y + deltaY
        };
        
        // Redraw canvas
        redrawRooms();
    }
}

function stopDragging() {
    if (isDragging && draggedRoom) {
        isDragging = false;
        draggedRoom = null;
        showOverlayMessage('Room moved');
    }
}

function isValidDragPosition(x, y, room) {
    const bounds = getRoomBounds(room);
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    
    // Only check canvas bounds, allow overlapping
    return !(x < 0 || y < 0 || x + width > canvas.width || y + height > canvas.height);
}

// Add erase functionality
function eraseRoom(e) {
    if (currentTool !== 'erase') return;
    
    const point = getCanvasPoint(e);
    const roomToErase = findRoomAtPoint(point);
    
    if (roomToErase) {
        rooms = rooms.filter(room => room.id !== roomToErase.id);
        updateAdjacencyGraph();
        updateStats();
        redrawRooms();
    }
}

function findRoomAtPoint(point) {
    return rooms.find(room => {
        const bounds = getRoomBounds(room);
        return point.x >= bounds.left && 
               point.x <= bounds.right && 
               point.y >= bounds.top && 
               point.y <= bounds.bottom;
    });
}

// Add selection functionality
function selectRoom(e) {
    if (currentTool !== 'select') return;
    
    const point = getCanvasPoint(e);
    const roomToSelect = findRoomAtPoint(point);
    
    // Deselect if clicking empty space
    if (!roomToSelect) {
        selectedRoom = null;
        redrawRooms();
        return;
    }
    
    // Toggle selection if clicking the same room
    if (selectedRoom && selectedRoom.id === roomToSelect.id) {
        selectedRoom = null;
    } else {
        selectedRoom = roomToSelect;
    }
    
    // Redraw to show selection
    redrawRooms();
    
    // Show room info in overlay
    if (selectedRoom) {
        showOverlayMessage(`Selected: ${selectedRoom.type || 'Room'}`);
    }
}

function startColoring() {
    if (rooms.length === 0) {
        showOverlayMessage('Draw or generate rooms first');
        return;
    }
    
    isColoring = true;
    currentColorIndex = 0;
    
    // Reset all room colors
    rooms.forEach(room => room.color = null);
    
    // Get selected algorithm
    const algorithm = document.getElementById('algorithm-select').value;
    
    // Start coloring process
    if (algorithm === 'greedy') {
        colorRoomsGreedy();
    } else {
        colorRoomsBacktracking();
    }
    
    // Update button state
    updateButtonStates();
}

function updateButtonStates() {
    const colorBtn = document.getElementById('color-btn');
    const generateBtn = document.getElementById('generate-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    if (isColoring) {
        colorBtn.disabled = true;
        generateBtn.disabled = true;
        clearBtn.disabled = true;
        colorBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Coloring...';
    } else {
        colorBtn.disabled = false;
        generateBtn.disabled = false;
        clearBtn.disabled = false;
        colorBtn.innerHTML = '<i class="fas fa-paint-brush"></i> Start Coloring';
    }
} 