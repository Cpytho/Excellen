import { SpreadsheetManager } from "./spreadsheetmanager.js";

export class CellFunctionality {
    constructor(sheetRenderer) {
        this.sheetRenderer = sheetRenderer;
        this.selectedCell = null;
        this.setupEventListeners();
        this.spreadsheetManager = new SpreadsheetManager(this);

    }

    setupEventListeners() {
        const canvas = this.sheetRenderer.canvases.spreadsheet;
        canvas.addEventListener('click', this.handleCellClick.bind(this));
        document.addEventListener('click', this.handleDocumentClick.bind(this));
    }

    handleCellClick(event) {
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
            if (this.selectedCell) {
                // If a cell was previously selected, update its value before selecting the new cell
                const input = document.getElementById(`input_${this.sheetRenderer.sheet.row}_${this.sheetRenderer.sheet.col}_${this.sheetRenderer.sheet.index}`);
                this.spreadsheetManager.updateCellValue(input.value);
            }
            this.selectCell(clickedCell);
        }
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
            this.deselectCurrentCell();
        }
    }

    deselectCurrentCell() {
        if (this.selectedCell) {
            this.selectedCell = null;
            this.hideInputElement();
            this.sheetRenderer.draw();
        }
    }

    hideInputElement() {
        const input = document.getElementById(`input_${this.sheetRenderer.sheet.row}_${this.sheetRenderer.sheet.col}_${this.sheetRenderer.sheet.index}`);
        input.style.display = 'none';
    }

    drawHighlight() {
        if (!this.selectedCell) return;

        const { column, row } = this.selectedCell;
        const ctx = this.sheetRenderer.contexts.spreadsheet;

        const { x: scrollX, y: scrollY } = this.sheetRenderer.scrollManager.getScroll();
        const scale = this.sheetRenderer.scale;

        // Highlight the cell in the main spreadsheet
        ctx.strokeStyle = 'green'; // Green border
        ctx.lineWidth = 2;
        ctx.strokeRect(
            (column.x - scrollX) * scale,
            (row.y - scrollY) * scale,
            column.width * scale,
            row.height * scale
        );
    }

    handleResize() {
        // Update input element position when the window is resized
        if (this.selectedCell) {
            this.updateInputElement(this.selectedCell);
        }
    }

    letterToNumber(letter) {
        let number = 0;
        for (let i = 0; i < letter.length; i++) {
            number = number * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        return number;
    }

    removeEventListeners() {
        const canvas = this.sheetRenderer.canvases.spreadsheet;
        canvas.removeEventListener('click', this.handleCellClick);
        document.removeEventListener('click', this.handleDocumentClick);
    }
}
