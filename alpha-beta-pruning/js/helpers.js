const canvas = document.getElementById("canvas");

export function onResize() {
    resizeCanvas();
};

function resizeCanvas() {
    // Get the parent container's dimensions
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    
    // Set canvas dimensions
    canvas.width = rect.width;
    canvas.height = rect.height;
}