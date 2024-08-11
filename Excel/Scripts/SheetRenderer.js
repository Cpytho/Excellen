// sheetrenderer.js
import { HeaderCellManager } from './cellmaker.js';
import { Scroll } from './scroll.js';
import { CellFunctionality } from './cellfunctionality.js';
import { HeaderCellFunctionality } from './headercellfunctionality.js';


export class SheetRenderer {
    constructor(sheet) {
        this.sheet = sheet;
        this.scale = 1;
        this.minScale = 0.5;
        this.maxScale = 2;
        this.baseGridSize = 20;
        this.headerCellManager = null;
        this.canvases = {};
        this.contexts = {};
        this.lastDevicePixelRatio = window.devicePixelRatio;
        
        
        // Initialize the SparseMatrix instance
        this.sparseMatrix = this.sheet.sparsematrix;
        this.sparseMatrix.createCell(1,1,1,1,12)


        this.initCanvases();
        this.setupEventListeners();
        this.monitorDevicePixelRatio();
    }

    initCanvases() {
        ['spreadsheet', 'vertical', 'horizontal'].forEach(type => {
            const canvas = document.getElementById(`${type}Canvas_${this.sheet.row}_${this.sheet.col}_${this.sheet.index}`);
            if (!canvas) {
                throw new Error(`Canvas not found: ${type}Canvas_${this.sheet.row}_${this.sheet.col}_${this.sheet.index}`);
            }
            this.canvases[type] = canvas;
            this.contexts[type] = canvas.getContext('2d');
        });

        // Set up the ResizeObserver
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
        this.resizeObserver.observe(this.canvases.spreadsheet);
        this.scrollManager = new Scroll(this);
        this.cellFunctionality = new CellFunctionality(this);
        this.headerCellFunctionality = new HeaderCellFunctionality(this);
        this.resizeCanvases();
    }

    resizeCanvases() {
        const dpr = window.devicePixelRatio;
        Object.values(this.canvases).forEach(canvas => this.updateCanvasDimensions(canvas, dpr));
        this.updateHeaderCells();
        this.draw();
    }

    updateCanvasDimensions(canvas, dpr) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.handleResize.bind(this));
        this.canvases.spreadsheet.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    }

    handleResize() {
        this.resizeCanvases();
         
    }

    handleWheel(event) {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY || event.detail || event.wheelDelta;
            const zoomFactor = delta > 0 ? 0.9 : 1.1;
            
            const rect = this.canvases.spreadsheet.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            this.zoom(zoomFactor, mouseX, mouseY);
        }
    }

    zoom(factor, centerX, centerY) {
        const newScale = Math.min(Math.max(this.scale * factor, this.minScale), this.maxScale);
        if (newScale !== this.scale) {
            this.scale = newScale;
            this.updateHeaderCells();
            this.updateMaxScroll();  // Add this line
            this.draw();
        }
    }

    monitorDevicePixelRatio() {
        const checkDevicePixelRatio = () => {
            const currentDevicePixelRatio = window.devicePixelRatio;
            if (currentDevicePixelRatio !== this.lastDevicePixelRatio) {
                this.lastDevicePixelRatio = currentDevicePixelRatio;
                this.resizeCanvases();
            }
            requestAnimationFrame(checkDevicePixelRatio);
        };

        requestAnimationFrame(checkDevicePixelRatio);
    }

    setScroll(scrollX, scrollY) {
        // Update the scroll position
        // You may need to adjust this based on your grid logic
        this.headerCellManager.setScroll(scrollX, scrollY);
    }

    clearCanvases() {
        Object.entries(this.contexts).forEach(([type, ctx]) => {
            const canvas = this.canvases[type];
            ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
        });
    }

    // ... (other methods remain the same)

    updateHeaderCells() {
        const visibleWidth = this.canvases.spreadsheet.clientWidth;
        const visibleHeight = this.canvases.spreadsheet.clientHeight;

        if (!this.headerCellManager) {
            this.headerCellManager = new HeaderCellManager(visibleWidth, visibleHeight, this.scale);
        } else {
            this.headerCellManager.update(visibleWidth, visibleHeight, this.scale);
        }

        this.updateMaxScroll();
    }

    updateMaxScroll() {
        const totalWidth = this.headerCellManager.getTotalWidth();
        const totalHeight = this.headerCellManager.getTotalHeight();
        const visibleWidth = this.canvases.spreadsheet.clientWidth;
        const visibleHeight = this.canvases.spreadsheet.clientHeight;
        this.scrollManager.updateMaxScroll(totalWidth, totalHeight, visibleWidth, visibleHeight);
    }

    updateScrollBars(scrollX, scrollY, maxScrollX, maxScrollY) {
        this.updateVerticalScrollBar(scrollY, maxScrollY);
        this.updateHorizontalScrollBar(scrollX, maxScrollX);
    }

    updateVerticalScrollBar(scrollY, maxScrollY) {
        const verticalScroll = document.getElementById(`verticalScroll_${this.sheet.row}_${this.sheet.col}_${this.sheet.index}`);
        const verticalBar = document.getElementById(`verticalBar_${this.sheet.row}_${this.sheet.col}_${this.sheet.index}`);
        
        const scrollHeight = verticalScroll.clientHeight;
        const contentHeight = scrollHeight + maxScrollY;
        const barHeight = Math.max(20, (scrollHeight / contentHeight) * scrollHeight);
        const barTop = (scrollY / maxScrollY) * (scrollHeight - barHeight);

        verticalBar.style.height = `${barHeight}px`;
        verticalBar.style.top = `${barTop}px`;
    }

    updateHorizontalScrollBar(scrollX, maxScrollX) {
        const horizontalScroll = document.getElementById(`horizontalScroll_${this.sheet.row}_${this.sheet.col}_${this.sheet.index}`);
        const horizontalBar = document.getElementById(`horizontalBar_${this.sheet.row}_${this.sheet.col}_${this.sheet.index}`);
        
        const scrollWidth = horizontalScroll.clientWidth;
        const contentWidth = scrollWidth + maxScrollX;
        const barWidth = Math.max(20, (scrollWidth / contentWidth) * scrollWidth);
        const barLeft = (scrollX / maxScrollX) * (scrollWidth - barWidth);

        horizontalBar.style.width = `${barWidth}px`;
        horizontalBar.style.left = `${barLeft}px`;
    }

    getVerticalScrollRatio() {
        const verticalScroll = document.getElementById(`verticalScroll_${this.sheet.row}_${this.sheet.col}_${this.sheet.index}`);
        return verticalScroll.clientHeight / (verticalScroll.clientHeight + this.scrollManager.maxScrollY);
    }

    getHorizontalScrollRatio() {
        const horizontalScroll = document.getElementById(`horizontalScroll_${this.sheet.row}_${this.sheet.col}_${this.sheet.index}`);
        return horizontalScroll.clientWidth / (horizontalScroll.clientWidth + this.scrollManager.maxScrollX);
    }

    draw() {
        this.clearCanvases();
        const { x: scrollX, y: scrollY } = this.scrollManager.getScroll();
        
        // Check if more content needs to be loaded
        if (scrollX > this.headerCellManager.getTotalWidth() - this.canvases.spreadsheet.clientWidth * 1.2) {
            this.headerCellManager.updateCells();  // Update header cells when nearing end
        }
        if (scrollY > this.headerCellManager.getTotalHeight() - this.canvases.spreadsheet.clientHeight * 1.2) {
            this.headerCellManager.updateCells();  // Update header cells when nearing end
        }
        
        this.drawHeaders(scrollX, scrollY);
        this.drawGrid(scrollX, scrollY);
        this.drawSparseMatrixValues(scrollX, scrollY);
        this.cellFunctionality.drawHighlight();

        // Update input box position
        if (this.cellFunctionality.selectedCell) {
            this.cellFunctionality.updateInputElement(this.cellFunctionality.selectedCell);
        }

        // Draw resize line if resizing
        if (this.headerCellFunctionality.isResizing) {
            this.drawResizeLine();
        }
    }

    drawResizeLine() {
        const { isResizing, resizeType, currentResizePosition } = this.headerCellFunctionality;
        if (!isResizing || currentResizePosition === null) return;

        const ctx = this.contexts.spreadsheet;
        const { x: scrollX, y: scrollY } = this.scrollManager.getScroll();

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 120, 215, 0.8)';
        ctx.lineWidth = 2;

        if (resizeType === 'column') {
            const x = currentResizePosition - scrollX;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ctx.canvas.clientHeight);
        } else {
            const y = currentResizePosition - scrollY;
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.clientWidth, y);
        }

        ctx.stroke();
    }

    drawHeaders(scrollX, scrollY) {
        this.verticalCells = this.headerCellManager.getVerticalHeaderCells(scrollY);
        this.horizontalCells = this.headerCellManager.getHorizontalHeaderCells(scrollX);
    
    
        this.drawHeaderCells(this.contexts.vertical, this.verticalCells, true, scrollY);
        this.drawHeaderCells(this.contexts.horizontal, this.horizontalCells, false, scrollX);
    }
    
    drawHeaderCells(ctx, cells, isVertical, scroll) {
        
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = 'black';
        
        const canvasWidth = this.canvases[isVertical ? 'vertical' : 'horizontal'].width / window.devicePixelRatio;
        const canvasHeight = this.canvases[isVertical ? 'vertical' : 'horizontal'].height / window.devicePixelRatio;
    
        cells.forEach(cell => {
            const drawCell = (isVertical && (cell.y - scroll < canvasHeight && cell.y + cell.height - scroll > 0)) ||
                             (!isVertical && (cell.x - scroll < canvasWidth && cell.x + cell.width - scroll > 0));
    
            if (drawCell) {
                ctx.beginPath();
                if (isVertical) {
                    
                    const y = cell.y - scroll;
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvasWidth, y);
                    ctx.stroke();
    
                    this.drawCenteredText(
                        ctx, 
                        cell.value.toString(), 
                        canvasWidth / 2, 
                        y + cell.height / 2, 
                        canvasWidth, 
                        cell.height
                    );
                } else {
                    const x = cell.x - scroll;
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvasHeight);
                    ctx.stroke();
    
                    this.drawCenteredText(
                        ctx, 
                        cell.value, 
                        x + cell.width / 2, 
                        canvasHeight / 2, 
                        cell.width, 
                        canvasHeight
                    );
                }
            }
        });
    }
    
    drawGrid(scrollX, scrollY) {
        
        const ctx = this.contexts.spreadsheet;
        const verticalCells = this.headerCellManager.getVerticalHeaderCells(scrollY);
        const horizontalCells = this.headerCellManager.getHorizontalHeaderCells(scrollX);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
    
        const canvasWidth = this.canvases.spreadsheet.width / window.devicePixelRatio;
        const canvasHeight = this.canvases.spreadsheet.height / window.devicePixelRatio;
    
        verticalCells.forEach(cell => {
            const y = cell.y - scrollY;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
        });
    
        horizontalCells.forEach(cell => {
            const x = cell.x - scrollX;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
            ctx.stroke();
        });
    }
    
    drawSparseMatrixValues(scrollX, scrollY) {
        

        const ctx = this.contexts.spreadsheet;
        const visibleWidth = this.canvases.spreadsheet.width / window.devicePixelRatio;
        const visibleHeight = this.canvases.spreadsheet.height / window.devicePixelRatio;
    
        // Get visible header cells
        const visibleVerticalCells = this.headerCellManager.getVerticalHeaderCells(scrollY);
        const visibleHorizontalCells = this.headerCellManager.getHorizontalHeaderCells(scrollX);
    
        // Create a map for faster lookup of horizontal cells
        const horizontalCellMap = new Map(visibleHorizontalCells.map(cell => [cell.value, cell]));
    
        // Iterate through the sparse matrix
        for (let row in this.sparseMatrix.rowHeaders) {
            let current = this.sparseMatrix.rowHeaders[row].nextCol;
            while (current) {
                // Find corresponding header cells
                const vCell = visibleVerticalCells.find(cell => cell.value === current.rowValue);
                const hCell = horizontalCellMap.get(this.headerCellManager.numberToColumnName(current.colValue));
    
                // If both header cells are found (i.e., the cell is visible)
                if (vCell && hCell) {
                    const cellX = hCell.x - scrollX;
                    const cellY = vCell.y - scrollY;
    
                    // Only render cells within the visible area
                    if (cellX < visibleWidth && cellY < visibleHeight) {
                        // Save the context state
                        ctx.save();
    
                        // clipping area for the cell
                        ctx.beginPath();
                        ctx.rect(cellX, cellY, hCell.width, vCell.height);
                        ctx.clip();
    
                        // Set text styles
                        ctx.fillStyle = '#000000';
                        ctx.font = `${12}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        
    
                        // Draw the text within the clipped region
                        if (current.value !== undefined && current.value !== null) {
                            ctx.fillText(current.value.toString(), cellX + hCell.width / 2, cellY + vCell.height / 2);
                        }
                        else{
                            ctx.fillText('!!!!! ',  cellX + hCell.width / 2, cellY + vCell.height / 2)
                        }
    
                        // Restore the context state
                        ctx.restore();
                    }
                }
    
                current = current.nextCol;
            }
        }
    }
    
    
    drawCenteredText(ctx, text, x, y, maxWidth, maxHeight) {
        const baseFontSize = this.baseGridSize * this.scale;
        let fontSize = Math.min(baseFontSize, maxHeight * 0.8);
        
        // Adjust font size if text is too wide
        ctx.font = `${fontSize}px Arial`;
       
        let textWidth = ctx.measureText(text).width;
        if (textWidth > maxWidth * 0.9) {
            fontSize *= (maxWidth * 0.9) / textWidth;
        }
        
        // Ensure minimum font size
        fontSize = 14;
        
        ctx.font = `${fontSize}px Arial`;
        ctx.strokeStyle = "black"
        ctx.fillText(text, x, y, maxWidth);
        

    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        this.canvases.spreadsheet.removeEventListener('wheel', this.handleWheel);
        this.scrollManager.destroy(); // Clean up the Scroll manager
        this.cellFunctionality.removeEventListeners(); // Clean up the cell functionality
        this.headerCellFunctionality.removeEventListeners(); // Clean up the header functionality
    }
}
