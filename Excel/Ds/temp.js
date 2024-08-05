import { HeaderCellManager } from './cellmaker.js';

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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    updateHeaderCells() {
        const visibleWidth = this.canvases.spreadsheet.clientWidth / this.scale;
        const visibleHeight = this.canvases.spreadsheet.clientHeight / this.scale;

        if (!this.headerCellManager) {
            this.headerCellManager = new HeaderCellManager(visibleWidth, visibleHeight, this.scale);
        } else {
            this.headerCellManager.update(visibleWidth, visibleHeight, this.scale);
        }
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

    draw() {
        this.clearCanvases();
        this.drawHeaders();
        this.drawGrid();
    }

    clearCanvases() {
        Object.entries(this.contexts).forEach(([type, ctx]) => {
            const canvas = this.canvases[type];
            ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
        });
    }

    drawHeaders() {
        const verticalCells = this.headerCellManager.getVerticalHeaderCells();
        const horizontalCells = this.headerCellManager.getHorizontalHeaderCells();

        this.drawHeaderCells(this.contexts.vertical, verticalCells, true);
        this.drawHeaderCells(this.contexts.horizontal, horizontalCells, false);
    }

    drawHeaderCells(ctx, cells, isVertical) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        cells.forEach(cell => {
            ctx.beginPath();
            if (isVertical) {
                ctx.moveTo(0, cell.y);
                ctx.lineTo(this.canvases.vertical.width / window.devicePixelRatio, cell.y);
                ctx.stroke();

                this.drawCenteredText(ctx, cell.value.toString(), 
                    this.canvases.vertical.width / (2 * window.devicePixelRatio), 
                    cell.y + cell.height / 2, 
                    this.canvases.vertical.width / window.devicePixelRatio, 
                    cell.height);
            } else {
                ctx.moveTo(cell.x, 0);
                ctx.lineTo(cell.x, this.canvases.horizontal.height / window.devicePixelRatio);
                ctx.stroke();

                this.drawCenteredText(ctx, cell.value, 
                    cell.x + cell.width / 2, 
                    this.canvases.horizontal.height / (2 * window.devicePixelRatio), 
                    cell.width, 
                    this.canvases.horizontal.height / window.devicePixelRatio);
            }
        });
    }

    drawCenteredText(ctx, text, x, y, maxWidth, maxHeight) {
        const fontSize = Math.min(maxWidth / (text.length * 0.7), maxHeight * 0.8, 20);
        ctx.font = `${Math.max(8, fontSize)}px Arial`;
        ctx.fillText(text, x, y, maxWidth);
    }

    drawGrid() {
        const ctx = this.contexts.spreadsheet;
        const verticalCells = this.headerCellManager.getVerticalHeaderCells();
        const horizontalCells = this.headerCellManager.getHorizontalHeaderCells();

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;

        verticalCells.forEach(cell => {
            ctx.beginPath();
            ctx.moveTo(0, cell.y);
            ctx.lineTo(this.canvases.spreadsheet.width / window.devicePixelRatio, cell.y);
            ctx.stroke();
        });

        horizontalCells.forEach(cell => {
            ctx.beginPath();
            ctx.moveTo(cell.x, 0);
            ctx.lineTo(cell.x, this.canvases.spreadsheet.height / window.devicePixelRatio);
            ctx.stroke();
        });
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        this.canvases.spreadsheet.removeEventListener('wheel', this.handleWheel);
    }
}
