import { SpreadsheetManager } from "./spreadsheetmanager.js";

export class CellFunctionality {
    constructor(sheetRenderer) {
        this.sheetRenderer = sheetRenderer;
        this.selectedCells = []; // Array to store selected cells
        this.isDragging = false; // Track if the user is dragging
        this.startPoint = null;
        this.spreadsheetManager = new SpreadsheetManager(this);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = this.sheetRenderer.canvases.spreadsheet;
        canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        document.addEventListener('pointerup', this.handlePointerUp.bind(this));
        document.addEventListener('pointermove', this.handlePointerMove.bind(this));
        canvas.addEventListener('click', this.handleCellClick.bind(this));
        document.addEventListener('click', this.handleDocumentClick.bind(this));
    }

    handlePointerDown(event) {
        event.preventDefault();
        this.isDragging = true;
        this.startPoint = this.getCanvasCoordinates(event);
        this.selectedCells = []; // Reset selected cells on new drag
        this.updateSelectedCells(this.startPoint);
    }

    handlePointerMove(event) {
        if (this.isDragging) {
            const currentPoint = this.getCanvasCoordinates(event);
            this.updateSelectedCells(currentPoint);
            this.handleScrolling(event);
        }
    }

    handlePointerUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.sheetRenderer.draw(); // Redraw the sheet after dragging
        }
    }

    handleCellClick(event) {
        if (this.isDragging) return; // Prevent handling cell click if dragging

        const rect = this.sheetRenderer.canvases.spreadsheet.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const { x: scrollX, y: scrollY } = this.sheetRenderer.scrollManager.getScroll();
        const scale = this.sheetRenderer.scale;
        
        // Adjust for scaling and scrolling
        const adjustedX = (x / scale) + scrollX;
        const adjustedY = (y / scale) + scrollY;
        
        const clickedCell = this.getCellFromCoordinates(adjustedX, adjustedY);
        
        if (clickedCell) {
            if (this.selectedCells.length === 0) {
                this.selectCell(clickedCell);
            } else {
                this.deselectCurrentCells();
                this.updateInputElement(clickedCell);
                this.selectCell(clickedCell);
            }
        }
    }

    getCanvasCoordinates(event) {
        const rect = this.sheetRenderer.canvases.spreadsheet.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const { x: scrollX, y: scrollY } = this.sheetRenderer.scrollManager.getScroll();
        const scale = this.sheetRenderer.scale;
        
        // Adjust for scaling and scrolling
        const adjustedX = (x / scale) + scrollX;
        const adjustedY = (y / scale) + scrollY;
        
        return { x: adjustedX, y: adjustedY };
    }

    updateSelectedCells(endPoint) {
        const cells = this.getCellsFromRect(this.startPoint, endPoint);

        this.selectedCells = cells;
        this.sheetRenderer.draw(); // Redraw the sheet to show cell highlights
    }

    getCellsFromRect(startPoint, endPoint) {
        const cells = [];
        const horizontalCells = this.sheetRenderer.horizontalCells;
        const verticalCells = this.sheetRenderer.verticalCells;

        // Determine rectangle bounds
        const left = Math.min(startPoint.x, endPoint.x);
        const right = Math.max(startPoint.x, endPoint.x);
        const top = Math.min(startPoint.y, endPoint.y);
        const bottom = Math.max(startPoint.y, endPoint.y);

        horizontalCells.forEach(column => {
            verticalCells.forEach(row => {
                if (this.isCellInRect(left, right, top, bottom, column, row)) {
                    cells.push({ column, row });
                }
            });
        });

        return cells;
    }

    isCellInRect(left, right, top, bottom, column, row) {
        return column.x < right && (column.x + column.width) > left &&
               row.y < bottom && (row.y + row.height) > top;
    }

    handleScrolling(event) {
        const { x, y } = this.getCanvasCoordinates(event);

        // Check if the pointer is near the edges to trigger scrolling
        const edgeDistance = 30; // Distance from edge to start scrolling
        const canvas = this.sheetRenderer.canvases.spreadsheet;
        
        if (x < edgeDistance) {
            this.sheetRenderer.scrollManager.scroll(-10, 0); // Scroll left
        } else if (x > canvas.clientWidth - edgeDistance) {
            this.sheetRenderer.scrollManager.scroll(10, 0); // Scroll right
        }

        if (y < edgeDistance) {
            this.sheetRenderer.scrollManager.scroll(0, -10); // Scroll up
        } else if (y > canvas.clientHeight - edgeDistance) {
            this.sheetRenderer.scrollManager.scroll(0, 10); // Scroll down
        }
    }

    updateInputElement(cell) {
        const input = document.getElementById(`input_${this.sheetRenderer.sheet.row}_${this.sheetRenderer.sheet.col}_${this.sheetRenderer.sheet.index}`);
        
        // Recalculate input box position
        const { x: scrollX, y: scrollY } = this.sheetRenderer.scrollManager.getScroll();
        const scale = this.sheetRenderer.scale;

        input.style.position = 'absolute';
        input.style.left = `${(cell.column.x - scrollX) * scale}px`;
        input.style.top = `${(cell.row.y - scrollY) * scale}px`;
        input.style.width = `${cell.column.width * scale}px`;
        input.style.height = `${cell.row.height * scale}px`;
        input.style.fontSize = `${14 * scale}px`; // Adjust font size based on scale
        input.style.zIndex = 10;
        input.style.display = 'block';
        input.focus();  // Optionally focus the input

        // Get the cell value from the sparse matrix and set it in the input box
        const cellValue = this.spreadsheetManager.getValue(cell.row.value, this.letterToNumber(cell.column.value));
        input.value = cellValue !== null ? cellValue : '';  // Set the input value
    }

    handleDocumentClick(event) {
        const canvas = this.sheetRenderer.canvases.spreadsheet;
        if (!canvas.contains(event.target)) {
            // Click occurred outside the canvas
            this.deselectCurrentCells();
        }
    }

    deselectCurrentCells() {
        if (this.selectedCells.length > 0) {
            this.selectedCells = [];
            this.hideInputElement();
            this.sheetRenderer.draw();
        }
    }

    hideInputElement() {
        const input = document.querySelector('input[type="text"]');
        if (input) {
            input.style.display = 'none';
        }
    }

    drawHighlight() {
        const ctx = this.sheetRenderer.contexts.spreadsheet;
        const { x: scrollX, y: scrollY } = this.sheetRenderer.scrollManager.getScroll();
        const scale = this.sheetRenderer.scale;

        ctx.strokeStyle = 'green'; // Green border
        ctx.lineWidth = 2;

        this.selectedCells.forEach(cell => {
            const { column, row } = cell;
            ctx.strokeRect(
                (column.x - scrollX) * scale,
                (row.y - scrollY) * scale,
                column.width * scale,
                row.height * scale
            );
        });
    }

    updateInputElementForCells() {
        this.selectedCells.forEach(cell => this.updateInputElement(cell));
    }

    letterToNumber(letter) {
        let number = 0;
        for (let i = 0; i < letter.length; i++) {
            number = number * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        return number;
    }

    selectCell(cell) {
        if (this.selectedCell && 
            this.selectedCell.column.value === cell.column.value && 
            this.selectedCell.row.value === cell.row.value) {
            // If the same cell is clicked again, deselect it
            this.deselectCurrentCell();
        } else {
            this.selectedCell = cell;
            this.updateInputElement(cell);  // Update and show input element
        }
        this.sheetRenderer.draw(); // Redraw the entire sheet to show/hide the highlight
    }

    getCellFromCoordinates(x, y) {
        const horizontalCells = this.sheetRenderer.horizontalCells;
        const verticalCells = this.sheetRenderer.verticalCells;

        const column = horizontalCells.find(cell => x >= cell.x && x < cell.x + cell.width);
        const row = verticalCells.find(cell => y >= cell.y && y < cell.y + cell.height);

        if (column && row) {
            return { column, row };
        }
        return null;
    }

    removeEventListeners() {
        const canvas = this.sheetRenderer.canvases.spreadsheet;
        canvas.removeEventListener('pointerdown', this.handlePointerDown);
        document.removeEventListener('pointerup', this.handlePointerUp);
        document.removeEventListener('pointermove', this.handlePointerMove);
        canvas.removeEventListener('click', this.handleCellClick);
        document.removeEventListener('click', this.handleDocumentClick);
    }
}
