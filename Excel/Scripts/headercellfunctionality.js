export class HeaderCellFunctionality {
    constructor(sheetRenderer) {
        this.sheetRenderer = sheetRenderer;
        this.resizeThreshold = 5; // pixels from the edge to trigger resize
        this.isResizing = false;
        this.resizeStart = null;
        this.resizeType = null; // 'row' or 'column'
        this.resizeIndex = null;
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
        const cells = isHorizontal 
            ? this.sheetRenderer.headerCellManager.getHorizontalHeaderCells(this.sheetRenderer.scrollManager.getScroll().x)
            : this.sheetRenderer.headerCellManager.getVerticalHeaderCells(this.sheetRenderer.scrollManager.getScroll().y);

        const resizeEdge = this.getResizeEdge(cells, x, y, isHorizontal);

        if (resizeEdge) {
            canvas.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
        } else {
            canvas.style.cursor = 'default';
        }
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

    applyResize() {
        if (!this.isResizing) return;

        const canvas = this.resizeType === 'column' 
            ? this.sheetRenderer.canvases.horizontal 
            : this.sheetRenderer.canvases.vertical;
        const rect = canvas.getBoundingClientRect();
        const currentPosition = this.resizeType === 'column' 
            ? event.clientX - rect.left 
            : event.clientY - rect.top;

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
        this.sheetRenderer.draw();
    }


    handleMouseDown(event) {
        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const isHorizontal = canvas === this.sheetRenderer.canvases.horizontal;
        const cells = isHorizontal 
            ? this.sheetRenderer.headerCellManager.getHorizontalHeaderCells(this.sheetRenderer.scrollManager.getScroll().x)
            : this.sheetRenderer.headerCellManager.getVerticalHeaderCells(this.sheetRenderer.scrollManager.getScroll().y);

        const resizeEdge = this.getResizeEdge(cells, x, y, isHorizontal);

        if (resizeEdge) {
            this.isResizing = true;
            this.resizeStart = isHorizontal ? x : y;
            this.resizeType = isHorizontal ? 'column' : 'row';
            this.resizeIndex = resizeEdge.index;
            event.preventDefault();
        }
    }

    handleMouseUp() {
        if (this.isResizing) {
            this.isResizing = false;
            this.applyResize();
        }
    }

    handleDrag(event) {
        if (!this.isResizing) return;

        const canvas = this.resizeType === 'column' 
            ? this.sheetRenderer.canvases.horizontal 
            : this.sheetRenderer.canvases.vertical;
        const rect = canvas.getBoundingClientRect();
        const currentPosition = this.resizeType === 'column' 
            ? event.clientX - rect.left 
            : event.clientY - rect.top;

        this.drawResizeLine(currentPosition);
    }

    drawResizeLine(position) {
        const ctx = this.sheetRenderer.contexts.spreadsheet;
        const { x: scrollX, y: scrollY } = this.sheetRenderer.scrollManager.getScroll();

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.sheetRenderer.draw(); // Redraw the existing content

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 120, 215, 0.8)';
        ctx.lineWidth = 2;

        if (this.resizeType === 'column') {
            ctx.moveTo(position - scrollX, 0);
            ctx.lineTo(position - scrollX, ctx.canvas.height);
        } else {
            ctx.moveTo(0, position - scrollY);
            ctx.lineTo(ctx.canvas.width, position - scrollY);
        }

        ctx.stroke();
    }

    applyResize() {
        // Here you would update the actual cell sizes in your data model
        // For this example, we'll just redraw without the resize line
        this.sheetRenderer.draw();
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