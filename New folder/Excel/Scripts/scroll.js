export class Scroll {
    constructor(sheetRenderer) {
        this.sheetRenderer = sheetRenderer;
        this.scrollX = 0;
        this.scrollY = 0;
        this.maxScrollX = 0;
        this.maxScrollY = 0;
        this.isDragging = false;
        this.isScrollbarDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = this.sheetRenderer.canvases.spreadsheet;
        canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        const verticalScrollBar = document.getElementById(`verticalBar_${this.sheetRenderer.sheet.row}_${this.sheetRenderer.sheet.col}_${this.sheetRenderer.sheet.index}`);
        const horizontalScrollBar = document.getElementById(`horizontalBar_${this.sheetRenderer.sheet.row}_${this.sheetRenderer.sheet.col}_${this.sheetRenderer.sheet.index}`);

        verticalScrollBar.addEventListener('mousedown', this.handleScrollBarMouseDown.bind(this, 'vertical'));
        horizontalScrollBar.addEventListener('mousedown', this.handleScrollBarMouseDown.bind(this, 'horizontal'));
    }

    handleScrollBarMouseDown(direction, event) {
        event.preventDefault();
        this.isScrollbarDragging = true;
        this.scrollbarDirection = direction;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    handleMouseMove(event) {
        if (this.isDragging) {
            if(event.shiftKey) {
            const deltaX = this.lastMouseX - event.clientX;
            const deltaY = this.lastMouseY - event.clientY;
            this.scroll(deltaX, deltaY);
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            } 
        } else if (this.isScrollbarDragging) {
            const delta = this.scrollbarDirection === 'vertical' 
                ? event.clientY - this.lastMouseY 
                : event.clientX - this.lastMouseX;
            
            const scrollRatio = this.scrollbarDirection === 'vertical'
                ? this.sheetRenderer.getVerticalScrollRatio()
                : this.sheetRenderer.getHorizontalScrollRatio();

            const scrollDelta = delta / scrollRatio;
            
            if (this.scrollbarDirection === 'vertical') {
                this.scroll(0, scrollDelta);
            } else {
                this.scroll(scrollDelta, 0);
            }

            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.isScrollbarDragging = false;
        this.destroy()
    }

    handleWheel(event) {
        if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            const deltaX = event.deltaX;
            const deltaY = event.deltaY;
            this.scroll(deltaX, deltaY);
        }
    }

    handleMouseDown(event) {
        this.isDragging = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }
    
    updateMaxScroll(totalWidth, totalHeight, viewportWidth, viewportHeight) {
        this.maxScrollX = Math.max(0, totalWidth - viewportWidth);
        this.maxScrollY = Math.max(0, totalHeight - viewportHeight);
        
        // Adjust current scroll if it exceeds new maximum
        this.scrollX = Math.min(this.scrollX, this.maxScrollX);
        this.scrollY = Math.min(this.scrollY, this.maxScrollY);
    }

    updateScrollBars() {
        this.sheetRenderer.updateScrollBars(this.scrollX, this.scrollY, this.maxScrollX, this.maxScrollY);
    }

    scroll(deltaX, deltaY) {
        this.scrollX = Math.max(0, Math.min(this.scrollX + deltaX, this.maxScrollX));
        this.scrollY = Math.max(0, Math.min(this.scrollY + deltaY, this.maxScrollY));
    
        this.updateScrollBars();
        this.checkScrollPosition();
        this.sheetRenderer.draw();
    }
    
    checkScrollPosition() {
        // Horizontal scroll
        const horizontalRatio = this.scrollX / this.maxScrollX;
        if (horizontalRatio > 0.8) {
            this.expandContent('horizontal');
        }
    
        // Vertical scroll
        const verticalRatio = this.scrollY / this.maxScrollY;
        if (verticalRatio > 0.8) {
            this.expandContent('vertical');
        }
    }
    
    expandContent(direction) {
        const scrollBar = direction === 'horizontal' 
            ? document.getElementById(`horizontalBar_${this.sheetRenderer.sheet.row}_${this.sheetRenderer.sheet.col}_${this.sheetRenderer.sheet.index}`)
            : document.getElementById(`verticalBar_${this.sheetRenderer.sheet.row}_${this.sheetRenderer.sheet.col}_${this.sheetRenderer.sheet.index}`);
    
        if (scrollBar) {
            const expandFactor = 1.2; // Factor to expand content
            const shrinkFactor = 0.8; // Factor to shrink content

            if (direction === 'horizontal') {
                if (this.scrollX >= 0.8 * (this.maxScrollX - this.sheetRenderer.canvases.spreadsheet.clientWidth)) {
                    this.sheetRenderer.headerCellManager.updateCells();
                    this.maxScrollX *= expandFactor;
                    this.scrollX = Math.min(this.scrollX, this.maxScrollX);
                }
            } else if (direction === 'vertical') {
                if (this.scrollY >= 0.8 * (this.maxScrollY - this.sheetRenderer.canvases.spreadsheet.clientHeight)) {
                    this.sheetRenderer.headerCellManager.updateCells();
                    this.maxScrollY *= expandFactor;
                    this.scrollY = Math.min(this.scrollY, this.maxScrollY);
                }
            }

            // Update scrollbar style
            this.updateScrollBars();
        }
    }
    
    getScroll() {
        return { x: this.scrollX, y: this.scrollY };
    }
    
    destroy() {
        const canvas = this.sheetRenderer.canvases.spreadsheet;
        canvas.removeEventListener('wheel', this.handleWheel);
        canvas.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }
}
