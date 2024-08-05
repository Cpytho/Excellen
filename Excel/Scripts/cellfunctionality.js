export class CellFunctionality {
    constructor(sheetRenderer) {
        this.sheetRenderer = sheetRenderer;
        this.selectedCell = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = this.sheetRenderer.canvases.spreadsheet;
        canvas.addEventListener('click', this.handleCellClick.bind(this));
    }

    handleCellClick(event) {
        const rect = this.sheetRenderer.canvases.spreadsheet.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const { x: scrollX, y: scrollY } = this.sheetRenderer.scrollManager.getScroll();
        
        const clickedCell = this.getCellFromCoordinates(x + scrollX, y + scrollY);
        
        if (clickedCell) {
            this.selectCell(clickedCell);
        }
    }

    getCellFromCoordinates(x, y) {
        const horizontalCells = this.sheetRenderer.headerCellManager.getHorizontalHeaderCells(0);
        const verticalCells = this.sheetRenderer.headerCellManager.getVerticalHeaderCells(0);

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
            this.selectedCell = null;
        } else {
            this.selectedCell = cell;
        }
        this.sheetRenderer.draw(); // Redraw the entire sheet to show/hide the highlight
    }

    drawHighlight() {
        if (!this.selectedCell) return;

        const { column, row } = this.selectedCell;
        const ctx = this.sheetRenderer.contexts.spreadsheet;
        const hCtx = this.sheetRenderer.contexts.horizontal;
        const vCtx = this.sheetRenderer.contexts.vertical;

        const { x: scrollX, y: scrollY } = this.sheetRenderer.scrollManager.getScroll();

        // Highlight the cell in the main spreadsheet
        ctx.fillStyle = 'rgba(173, 216, 230, 0.5)'; // Light blue with 50% opacity
        ctx.fillRect(
            column.x - scrollX,
            row.y - scrollY,
            column.width,
            row.height
        );

        // Highlight the horizontal header
        hCtx.fillStyle = 'rgba(173, 216, 230, 0.5)';
        hCtx.fillRect(
            column.x - scrollX,
            0,
            column.width,
            this.sheetRenderer.canvases.horizontal.height
        );

        // Highlight the vertical header
        vCtx.fillStyle = 'rgba(173, 216, 230, 0.5)';
        vCtx.fillRect(
            0,
            row.y - scrollY,
            this.sheetRenderer.canvases.vertical.width,
            row.height
        );

        // Draw border around the selected cell
        ctx.strokeStyle = 'rgb(0, 120, 215)'; // Solid blue color
        ctx.lineWidth = 2;
        ctx.strokeRect(
            column.x - scrollX,
            row.y - scrollY,
            column.width,
            row.height
        );
    }

    removeEventListeners() {
        const canvas = this.sheetRenderer.canvases.spreadsheet;
        canvas.removeEventListener('click', this.handleCellClickBound);
    }
}