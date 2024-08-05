class HeaderCell {
    constructor(x, y, width, height, value) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.value = value;
        this.isSelected = false;
    }
}


export class HeaderCellManager {
    constructor(visibleWidth, visibleHeight, scale = 1) {
        this.minCellSize = 40;
        this.baseCellWidth = 100;
        this.baseCellHeight = 80;
        this.scale = scale;
        this.verticalHeaderCells = [];
        this.horizontalHeaderCells = [];
        this.update(visibleWidth, visibleHeight, scale);
    }

    update(visibleWidth, visibleHeight, scale) {
        this.scale = scale;
        this.initializeHeaderCells(visibleWidth, visibleHeight);
    }

    initializeHeaderCells(visibleWidth, visibleHeight) {
        this.verticalHeaderCells = [];
        this.horizontalHeaderCells = [];

        const cellWidth = Math.max(this.minCellSize, this.baseCellWidth * this.scale);
        const cellHeight = Math.max(this.minCellSize, this.baseCellHeight * this.scale);

        let valueCounter = 1;

        // Horizontal header cells
        let x = 0;
        while (x < visibleWidth) {
            this.horizontalHeaderCells.push(new HeaderCell(x, 0, cellWidth, this.minCellSize, this.numberToColumnName(valueCounter++)));
            x += cellWidth;
        }

        // Vertical header cells
        let y = 0;
        valueCounter = 1;
        while (y < visibleHeight) {
            this.verticalHeaderCells.push(new HeaderCell(0, y, this.minCellSize, cellHeight, valueCounter++));
            y += cellHeight;
        }
    }

    numberToColumnName(num) {
        let columnName = '';
        while (num > 0) {
            num--;
            columnName = String.fromCharCode(65 + (num % 26)) + columnName;
            num = Math.floor(num / 26);
        }
        return columnName;
    }

    getVerticalHeaderCells() {
        return this.verticalHeaderCells;
    }

    getHorizontalHeaderCells() {
        return this.horizontalHeaderCells;
    }
}
