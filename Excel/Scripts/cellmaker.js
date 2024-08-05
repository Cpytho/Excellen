class HeaderCell {
    constructor(x, y, width, height, value,row,col) {
        this.x = x;
        this.y = y;
        this.row = row;
        this.col = col;
        this.width = width;
        this.height = height;
        this.value = value;
        this.isSelected = false;
    }
}


export class HeaderCellManager {
    constructor(visibleWidth, visibleHeight, scale = 1) {
        this.minCellSize = 30;
        this.baseCellWidth = 80;
        this.baseCellHeight = 40;
        this.scale = scale;
        this.visibleWidth = visibleWidth*2;
        this.visibleHeight = visibleHeight*2;
        this.horizontalHeaderCells = [];
        this.verticalHeaderCells = [];
        this.update(visibleWidth, visibleHeight, scale);
    }

    update(visibleWidth, visibleHeight, scale) {
        this.visibleWidth = visibleWidth;
        this.visibleHeight = visibleHeight;
        this.scale = scale;
        this.updateCells();
    }

    updateCells() {
        const cellWidth = Math.max(this.minCellSize, this.baseCellWidth * this.scale);
        const cellHeight = Math.max(this.minCellSize, this.baseCellHeight * this.scale);

        this.horizontalHeaderCells = [];
        this.verticalHeaderCells = [];

        let valueCounter = 1;

        // Horizontal header cells
        let x = 0;
        while (x <= this.visibleWidth+cellWidth) {
            this.horizontalHeaderCells.push(new HeaderCell(x, 0, cellWidth, this.minCellSize, this.numberToColumnName(valueCounter++),valueCounter,0));
            x += cellWidth;
        }

        // Vertical header cells
        let y = 0;
        valueCounter = 1;
        while (y <= this.visibleHeight+cellHeight) {
            this.verticalHeaderCells.push(new HeaderCell(0, y, this.minCellSize, cellHeight, valueCounter++,0,valueCounter));
            y += cellHeight;
        }
    }

    numberToColumnName(num) {
        let columnName = '';
        while (num >= 0) {
            columnName = String.fromCharCode(65 + (num % 26)) + columnName;
            num = Math.floor(num / 26)-1;
        }
        return columnName;
    }

    getHorizontalHeaderCells(scrollX) {
        const cellWidth = Math.max(this.minCellSize, this.baseCellWidth * this.scale);
        const startIndex = Math.floor(scrollX / cellWidth);
        return this.horizontalHeaderCells.map((cell, index) => ({
            ...cell,
            value: this.numberToColumnName(startIndex + index),
            x: (startIndex + index) * cellWidth
        }));
    }

    getVerticalHeaderCells(scrollY) {
        const cellHeight = Math.max(this.minCellSize, this.baseCellHeight * this.scale);
        const startIndex = Math.floor(scrollY / cellHeight);
        return this.verticalHeaderCells.map((cell, index) => ({
            ...cell,
            value: startIndex + index + 1,
            y: (startIndex + index) * cellHeight
        }));
    }

    getTotalWidth() {
        const cellWidth = Math.max(this.minCellSize, this.baseCellWidth * this.scale);
        return this.horizontalHeaderCells.length * cellWidth;
    }

    getTotalHeight() {
        const cellHeight = Math.max(this.minCellSize, this.baseCellHeight * this.scale);
        return this.verticalHeaderCells.length * cellHeight;
    }
}
