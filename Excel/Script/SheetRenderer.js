// sheetrenderer.js

import { HeaderCellManager } from './cellmaker.js';
import { Scroll } from './scroll.js';
import { CellFunctionality } from './cellfunctionality.js';
import { HeaderCellFunctionality } from './headercellfunctionality.js';

/**
 * SheetRenderer class is responsible for rendering and managing the spreadsheet interface.
 */
export class SheetRenderer {
    /**
     * @param {Object} sheet - The sheet object that contains data and metadata for rendering.
     * @param {SparseMatrix} sheet.sparsematrix - The SparseMatrix instance holding cell data.
     */
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
        this.sparseMatrix.createCell(1, 1, 1, 1, 12);
        this.sparseMatrix.createCell(4, 1, 4, 1, "A");
        this.sparseMatrix.createCell(1, 23, 1, 23, "B");
        this.sparseMatrix.createCell(2, 3, 2, 3, "C");

        this.initCanvases();
        this.setupEventListeners();
        this.monitorDevicePixelRatio();
    }

    /**
     * Initializes canvas elements and sets up context for rendering.
     * @throws {Error} Throws an error if a canvas element is not found.
     */
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

    /**
     * Resizes canvases and redraws the content based on the new dimensions.
     */
    resizeCanvases() {
        const dpr = window.devicePixelRatio;
        Object.values(this.canvases).forEach(canvas => this.updateCanvasDimensions(canvas, dpr));
        this.updateHeaderCells();
        this.draw();
    }

    /**
     * Updates the dimensions of a canvas based on the device pixel ratio.
     * @param {HTMLCanvasElement} canvas - The canvas element to resize.
     * @param {number} dpr - The device pixel ratio.
     */
    updateCanvasDimensions(canvas, dpr) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    }

    /**
     * Sets up event listeners for window resize and canvas wheel events.
     */
    setupEventListeners() {
        window.addEventListener('resize', this.handleResize.bind(this));
        this.canvases.spreadsheet.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    }

    /**
     * Handles window resize events by resizing canvases and adjusting the input element.
     */
    handleResize() {
        this.resizeCanvases();
        // Notify CellFunctionality to adjust the input element position
        this.cellFunctionality.handleResize();
    }

    /**
     * Handles mouse wheel events for zooming in and out when Ctrl or Meta key is pressed.
     * @param {WheelEvent} event - The wheel event containing scroll delta and position.
     */
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

    /**
     * Zooms the canvas based on a zoom factor and center position.
     * @param {number} factor - The zoom factor (e.g., 0.9 to zoom out, 1.1 to zoom in).
     * @param {number} centerX - The x-coordinate of the zoom center.
     * @param {number} centerY - The y-coordinate of the zoom center.
     */
    zoom(factor, centerX, centerY) {
        const newScale = Math.min(Math.max(this.scale * factor, this.minScale), this.maxScale);
        if (newScale !== this.scale) {
            this.scale = newScale;
            this.updateHeaderCells();
            this.updateMaxScroll();
            this.draw();
        }
    }

    /**
     * Monitors changes in device pixel ratio and resizes canvases if needed.
     */
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

    /**
     * Sets the scroll position for the header cells.
     * @param {number} scrollX - The horizontal scroll position.
     * @param {number} scrollY - The vertical scroll position.
     */
    setScroll(scrollX, scrollY) {
        this.headerCellManager.setScroll(scrollX, scrollY);
    }

    /**
     * Clears the content of all canvases.
     */
    clearCanvases() {
        Object.entries(this.contexts).forEach(([type, ctx]) => {
            const canvas = this.canvases[type];
            ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
        });
    }

    /**
     * Updates header cells based on the current view and scale.
     */
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

    /**
     * Updates the maximum scroll values based on header cells and canvas size.
     */
    updateMaxScroll() {
        const totalWidth = this.headerCellManager.getTotalWidth();
        const totalHeight = this.headerCellManager.getTotalHeight();
        const visibleWidth = this.canvases.spreadsheet.clientWidth;
        const visibleHeight = this.canvases.spreadsheet.clientHeight;
        this.scrollManager.updateMaxScroll(totalWidth, totalHeight, visibleWidth, visibleHeight);
    }

    /**
     * Updates the scroll bars based on current scroll positions and maximum scroll values.
     * @param {number} scrollX - The horizontal scroll position.
     * @param {number} scrollY - The vertical scroll position.
     * @param {number} maxScrollX - The maximum horizontal scroll value.
     * @param {number} maxScrollY - The maximum vertical scroll value.
     */
    updateScrollBars(scrollX, scrollY, maxScrollX, maxScrollY) {
        this.updateVerticalScrollBar(scrollY, maxScrollY);
        this.updateHorizontalScrollBar(scrollX, maxScrollX);
    }

    /**
     * Updates the vertical scroll bar based on the scroll position and maximum scroll value.
     * @param {number} scrollY - The vertical scroll position.
     * @param {number} maxScrollY - The maximum vertical scroll value.
     */
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

    /**
     * Updates the horizontal scroll bar based on the scroll position and maximum scroll value.
     * @param {number} scrollX - The horizontal scroll position.
     * @param {number} maxScrollX - The maximum horizontal scroll value.
     */
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

    /**
     * Gets the vertical scroll ratio.
     * @returns {number} The ratio of visible scroll height to total scrollable height.
     */
    getVerticalScrollRatio() {
        return this.scrollManager.getVerticalScrollRatio();
    }

    /**
     * Gets the horizontal scroll ratio.
     * @returns {number} The ratio of visible scroll width to total scrollable width.
     */
    getHorizontalScrollRatio() {
        return this.scrollManager.getHorizontalScrollRatio();
    }

    /**
     * Draws the spreadsheet content including headers, grid, and matrix values.
     */
    draw() {
        this.clearCanvases();
        this.drawHeaders(this.scrollManager.scrollX, this.scrollManager.scrollY);
        this.drawGrid(this.scrollManager.scrollX, this.scrollManager.scrollY);
        this.drawSparseMatrixValues(this.scrollManager.scrollX, this.scrollManager.scrollY);
        this.cellFunctionality.drawHighlightedCells();
        this.drawResizeLine();
    }

    /**
     * Draws the resize line during resizing operations.
     */
    drawResizeLine() {
        if (this.cellFunctionality.isResizing) {
            const ctx = this.contexts.spreadsheet;
            const lineWidth = 2;
            const lineColor = 'red';
            const startX = this.cellFunctionality.resizeStartX;
            const startY = this.cellFunctionality.resizeStartY;
            const endX = this.cellFunctionality.resizeEndX;
            const endY = this.cellFunctionality.resizeEndY;

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    /**
     * Draws header cells for vertical and horizontal headers.
     * @param {number} scrollX - The horizontal scroll position.
     * @param {number} scrollY - The vertical scroll position.
     */
    drawHeaders(scrollX, scrollY) {
        this.drawHeaderCells(this.contexts.vertical, this.headerCellManager.getVerticalHeaders(), true, scrollX);
        this.drawHeaderCells(this.contexts.horizontal, this.headerCellManager.getHorizontalHeaders(), false, scrollY);
    }

    /**
     * Draws individual header cells and their labels.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {Array} cells - An array of header cells to draw.
     * @param {boolean} isVertical - Indicates if the headers are vertical.
     * @param {number} scroll - The scroll position to adjust drawing.
     */
    drawHeaderCells(ctx, cells, isVertical, scroll) {
        ctx.clearRect(0, 0, this.canvases.vertical.width, this.canvases.vertical.height);
        cells.forEach(cell => {
            const { x, y, width, height, label } = cell;
            const drawX = x - scroll;
            const drawY = y;

            ctx.fillStyle = 'lightgray';
            ctx.fillRect(drawX, drawY, width, height);

            ctx.fillStyle = 'black';
            this.drawCenteredText(ctx, label, drawX, drawY, width, height);
        });
    }

    /**
     * Draws grid lines based on the header cells.
     * @param {number} scrollX - The horizontal scroll position.
     * @param {number} scrollY - The vertical scroll position.
     */
    drawGrid(scrollX, scrollY) {
        const ctx = this.contexts.spreadsheet;
        const gridSize = this.baseGridSize * this.scale;
        
        ctx.strokeStyle = 'lightgray';
        ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = scrollX % gridSize; x < this.canvases.spreadsheet.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvases.spreadsheet.height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = scrollY % gridSize; y < this.canvases.spreadsheet.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvases.spreadsheet.width, y);
            ctx.stroke();
        }
    }

    /**
     * Draws cell values from the SparseMatrix within the visible area.
     * @param {number} scrollX - The horizontal scroll position.
     * @param {number} scrollY - The vertical scroll position.
     */
    drawSparseMatrixValues(scrollX, scrollY) {
        const ctx = this.contexts.spreadsheet;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.sparseMatrix.forEachCell((cell) => {
            const { x, y, value } = cell;
            const drawX = x - scrollX;
            const drawY = y - scrollY;
            const cellWidth = this.baseGridSize * this.scale;
            const cellHeight = this.baseGridSize * this.scale;

            if (drawX >= 0 && drawY >= 0 && drawX <= this.canvases.spreadsheet.width && drawY <= this.canvases.spreadsheet.height) {
                ctx.fillStyle = 'black';
                this.drawCenteredText(ctx, value, drawX, drawY, cellWidth, cellHeight);
            }
        });
    }

    /**
     * Draws centered text within a specified area.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {string} text - The text to draw.
     * @param {number} x - The x-coordinate of the text position.
     * @param {number} y - The y-coordinate of the text position.
     * @param {number} maxWidth - The maximum width of the text area.
     * @param {number} maxHeight - The maximum height of the text area.
     */
    drawCenteredText(ctx, text, x, y, maxWidth, maxHeight) {
        const fontSize = 14 * this.scale;
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(text).width;

        if (textWidth > maxWidth) {
            const scale = maxWidth / textWidth;
            ctx.font = `${fontSize * scale}px Arial`;
        }

        ctx.fillText(text, x + maxWidth / 2, y + maxHeight / 2);
    }

    /**
     * Cleans up resources and removes event listeners.
     */
    destroy() {
        window.removeEventListener('resize', this.handleResize.bind(this));
        this.canvases.spreadsheet.removeEventListener('wheel', this.handleWheel.bind(this));
        this.resizeObserver.disconnect();
    }
}
