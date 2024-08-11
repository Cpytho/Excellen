export class HeaderCellFunctionality {
    constructor(sheetRenderer) {
        this.sheetRenderer = sheetRenderer;
        this.resizeThreshold = 5; // pixels from the edge to trigger resize
        this.isResizing = false;
        this.resizeStart = null;
        this.resizeType = null; // 'row' or 'column'
        this.resizeIndex = null;
        this.currentResizePosition = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const hCanvas = this.sheetRenderer.canvases.horizontal;
        const vCanvas = this.sheetRenderer.canvases.vertical;

        hCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        vCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        hCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        vCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));

        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('mousemove', this.handleDrag.bind(this));
    }

    handleMouseMove(event) {
        if (this.isResizing) return;

        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const isHorizontal = canvas === this.sheetRenderer.canvases.horizontal;
        const scrollOffset = isHorizontal 
            ? this.sheetRenderer.scrollManager.getScroll().x 
            : this.sheetRenderer.scrollManager.getScroll().y;
        const cells = isHorizontal 
            ? this.sheetRenderer.headerCellManager.getHorizontalHeaderCells(scrollOffset)
            : this.sheetRenderer.headerCellManager.getVerticalHeaderCells(scrollOffset);

        const resizeEdge = this.getResizeEdge(cells, x + scrollOffset, y + scrollOffset, isHorizontal);

        canvas.style.cursor = resizeEdge ? (isHorizontal ? 'col-resize' : 'row-resize') : 'default';
    }

    getResizeEdge(cells, x, y, isHorizontal) {
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const edge = isHorizontal ? cell.x + cell.width : cell.y + cell.height;
            if (Math.abs(edge - (isHorizontal ? x : y)) <= this.resizeThreshold) {
                return { index: i, position: edge };
            }
        }
        return null;
    }

    handleMouseDown(event) {
        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const isHorizontal = canvas === this.sheetRenderer.canvases.horizontal;
        const scrollOffset = isHorizontal 
            ? this.sheetRenderer.scrollManager.getScroll().x 
            : this.sheetRenderer.scrollManager.getScroll().y;
        const cells = isHorizontal 
            ? this.sheetRenderer.headerCellManager.getHorizontalHeaderCells(scrollOffset)
            : this.sheetRenderer.headerCellManager.getVerticalHeaderCells(scrollOffset);

        const resizeEdge = this.getResizeEdge(cells, x + scrollOffset, y + scrollOffset, isHorizontal);

        if (resizeEdge) {
            this.isResizing = true;
            this.resizeStart = isHorizontal ? x + scrollOffset : y + scrollOffset;
            this.resizeType = isHorizontal ? 'column' : 'row';
            
            // Adjust index calculation based on resize type
            if (this.resizeType === 'column') {
                this.resizeIndex = cells[resizeEdge.index].col - 1; // Use column index for resizing columns
            } else if (this.resizeType === 'row') {
                this.resizeIndex = cells[resizeEdge.index].row - 1; // Use row index for resizing rows
            }
            
            console.log(this.resizeIndex);
            event.preventDefault();
        }
        
    }

    handleMouseUp(event) {
        if (this.isResizing) {
            this.applyResize(event);
            this.isResizing = false;
        }
    }

    handleDrag(event) {
        if (!this.isResizing) return;

        const canvas = this.resizeType === 'column' 
            ? this.sheetRenderer.canvases.horizontal 
            : this.sheetRenderer.canvases.vertical;
        const rect = canvas.getBoundingClientRect();
        const scrollOffset = this.resizeType === 'column' 
            ? this.sheetRenderer.scrollManager.getScroll().x 
            : this.sheetRenderer.scrollManager.getScroll().y;
        const currentPosition = this.resizeType === 'column' 
            ? event.clientX - rect.left + scrollOffset
            : event.clientY - rect.top + scrollOffset;

        this.currentResizePosition = currentPosition;
        this.sheetRenderer.draw(); // Redraw, potentially showing a resize line
    }

    applyResize(event) {
        if (!this.isResizing) return;

        const canvas = this.resizeType === 'column' 
            ? this.sheetRenderer.canvases.horizontal 
            : this.sheetRenderer.canvases.vertical;
        const rect = canvas.getBoundingClientRect();
        const scrollOffset = this.resizeType === 'column' 
            ? this.sheetRenderer.scrollManager.getScroll().x 
            : this.sheetRenderer.scrollManager.getScroll().y;
        const currentPosition = this.resizeType === 'column' 
            ? event.clientX - rect.left + scrollOffset
            : event.clientY - rect.top + scrollOffset;

        const delta = currentPosition - this.resizeStart;
        const headerCellManager = this.sheetRenderer.headerCellManager;
        const currentSize = headerCellManager.getCellSize(
            this.resizeType === 'column' ? 'horizontal' : 'vertical', 
            this.resizeIndex
        );
        const newSize = Math.max(headerCellManager.minCellSize, currentSize + delta);

        headerCellManager.setCustomCellSize(
            this.resizeType === 'column' ? 'horizontal' : 'vertical',
            this.resizeIndex,
            newSize
        );

        this.isResizing = false;
        this.currentResizePosition = null;
        this.sheetRenderer.draw(); // Redraw to apply the new sizes
    }

    removeEventListeners() {
        const hCanvas = this.sheetRenderer.canvases.horizontal;
        const vCanvas = this.sheetRenderer.canvases.vertical;

        hCanvas.removeEventListener('mousemove', this.handleMouseMove);
        vCanvas.removeEventListener('mousemove', this.handleMouseMove);

        hCanvas.removeEventListener('mousedown', this.handleMouseDown);
        vCanvas.removeEventListener('mousedown', this.handleMouseDown);

        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mousemove', this.handleDrag);
    }
}
