export function createSVGPreview(gridSize, solution, obstacles) {
    const svgSize = 100; // Size of the SVG preview
    const cellSize = svgSize / gridSize;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svgSize+4);
    svg.setAttribute("height", svgSize+4);
    svg.setAttribute("viewBox", `-2 -2 ${svgSize+4} ${svgSize+4}`);

    solution.forEach(rect => {
        const svgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgRect.setAttribute("x", rect.x * cellSize);
        svgRect.setAttribute("y", rect.y * cellSize);
        svgRect.setAttribute("width", rect.width * cellSize);
        svgRect.setAttribute("height", rect.height * cellSize);
        svgRect.setAttribute("fill", rect.color);
        svgRect.setAttribute("stroke", "black");
        svgRect.setAttribute("stroke-width", "2");
        svgRect.setAttribute("stroke-alignment", "center");
        svg.appendChild(svgRect);
    });

    obstacles.forEach(obstacle => {
        const svgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        svgCircle.setAttribute("cx", (obstacle.gridX + 0.5) * cellSize);
        svgCircle.setAttribute("cy", (obstacle.gridY + 0.5) * cellSize);
        svgCircle.setAttribute("r", cellSize / 4);
        svgCircle.setAttribute("fill", "black");
        svgCircle.setAttribute("stroke", "black");
        svgCircle.setAttribute("stroke-width", "0");
        svg.appendChild(svgCircle);
    });

    return svg;
}