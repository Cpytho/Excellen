// cellmaker.js
export class HeaderCellManager {
    constructor(visibleWidth, visibleHeight, scale) {
        this.visibleWidth = visibleWidth*2;
        this.visibleHeight = visibleHeight*2;
        this.scale = scale;
        this.baseSize = 20;
        this.updateCells();
    }

    update(visibleWidth, visibleHeight, scale) {
        this.visibleWidth += visibleWidth;
        this.visibleHeight += visibleHeight;
        this.scale = scale;
        this.updateCells();
    }

    updateCells() {
        const cellSize = this.baseSize * this.scale;
        this.columnsCount = Math.ceil(this.visibleWidth / cellSize) + 4;
        this.rowsCount = Math.ceil(this.visibleHeight / cellSize) + 4;

        this.horizontalCells = Array.from({ length: this.columnsCount }, (_, i) => ({
            value: this.columnIndexToLetter(i),
            x: i * cellSize,
            width: cellSize
        }));

        this.verticalCells = Array.from({ length: this.rowsCount }, (_, i) => ({
            value: i + 1,
            y: i * cellSize,
            height: cellSize
        }));
    }

    getHorizontalHeaderCells(scrollX) {
        const startIndex = Math.floor(scrollX / (this.baseSize * this.scale));
        return this.horizontalCells.map((cell, index) => ({
            ...cell,
            value: this.columnIndexToLetter(startIndex + index),
            x: (startIndex + index) * (this.baseSize * this.scale)
        }));
    }

    getVerticalHeaderCells(scrollY) {
        const startIndex = Math.floor(scrollY / (this.baseSize * this.scale));
        return this.verticalCells.map((cell, index) => ({
            ...cell,
            value: startIndex + index + 1,
            y: (startIndex + index) * (this.baseSize * this.scale)
        }));
    }

    columnIndexToLetter(index) {
        let column = '';
        while (index >= 0) {
            column = String.fromCharCode(65 + (index % 26)) + column;
            index = Math.floor(index / 26) - 1;
        }
        return column;
    }

    getTotalWidth() {
        return this.horizontalCells.length * this.baseSize * this.scale;
    }

    getTotalHeight() {
        return this.verticalCells.length * this.baseSize * this.scale;
    }
}