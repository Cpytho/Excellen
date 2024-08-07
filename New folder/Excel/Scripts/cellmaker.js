class HeaderCell {
    constructor(x, y, width, height, value, row, col) {
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
        this.visibleWidth = visibleWidth;
        this.visibleHeight = visibleHeight;
        this.horizontalHeaderCells = new Map();
        this.verticalHeaderCells = new Map();
        this.customHorizontalSizes = new Map();
        this.customVerticalSizes = new Map();
        // Initialize cells
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

        // Update horizontal cells
        const horizontalCellCount = Math.ceil(this.visibleWidth / cellWidth) + 1;
        for (let i = 0; i < horizontalCellCount; i++) {
            const x = i * cellWidth;
            if (!this.horizontalHeaderCells.has(i)) {
                this.horizontalHeaderCells.set(i, new HeaderCell(x, 0, cellWidth, this.minCellSize, this.numberToColumnName(i + 1), 0, i + 1));
            } else {
                const cell = this.horizontalHeaderCells.get(i);
                if (!this.customHorizontalSizes.has(i)) {
                    cell.width = cellWidth;
                }
                cell.x = x;
            }
        }

        // Update vertical cells
        const verticalCellCount = Math.ceil(this.visibleHeight / cellHeight) + 1;
        for (let i = 0; i < verticalCellCount; i++) {
            const y = i * cellHeight;
            if (!this.verticalHeaderCells.has(i)) {
                this.verticalHeaderCells.set(i, new HeaderCell(0, y, this.minCellSize, cellHeight, i + 1, i + 1, 0));
            } else {
                const cell = this.verticalHeaderCells.get(i);
                if (!this.customVerticalSizes.has(i)) {
                    cell.height = cellHeight;
                }
                cell.y = y;
            }
        }

        // Update positions
        this.updateCellPositions('horizontal');
        this.updateCellPositions('vertical');
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

    setCustomCellSize(type, index, size) {
        if (type === 'horizontal') {
            this.customHorizontalSizes.set(index, Math.max(this.minCellSize, size));
        } else if (type === 'vertical') {
            this.customVerticalSizes.set(index, Math.max(this.minCellSize, size));
        }
        this.updateCellPositions(type);
    }

    updateCellPositions(type) {
        let cells = type === 'horizontal' ? this.horizontalHeaderCells : this.verticalHeaderCells;
        let customSizes = type === 'horizontal' ? this.customHorizontalSizes : this.customVerticalSizes;
        let position = 0;

        for (let [i, cell] of cells) {
            if (type === 'horizontal') {
                if (customSizes.has(i)) {
                    cell.width = customSizes.get(i);
                }
                cell.x = position;
                position += cell.width;
            } else {
                if (customSizes.has(i)) {
                    cell.height = customSizes.get(i);
                }
                cell.y = position;
                position += cell.height;
            }
        }
    }

    getHorizontalHeaderCells(scrollX) {
        const cellWidth = Math.max(this.minCellSize, this.baseCellWidth * this.scale);
        const startIndex = Math.floor(scrollX / cellWidth);
        const visibleCells = [];
        let position = startIndex * cellWidth;

        for (let i = startIndex; position < scrollX + this.visibleWidth; i++) {
            if (!this.horizontalHeaderCells.has(i)) {
                const width = this.baseCellWidth * this.scale;
                this.horizontalHeaderCells.set(i, new HeaderCell(position, 0, width, this.minCellSize, this.numberToColumnName(i + 1), 0, i + 1));
            }
            const cell = this.horizontalHeaderCells.get(i);
            cell.x = position;
            cell.width = cell.width; // Make sure the width is updated based on custom sizes
            visibleCells.push(cell);
            position += cell.width;
        }

        return visibleCells;
    }

    getVerticalHeaderCells(scrollY) {
        const cellHeight = Math.max(this.minCellSize, this.baseCellHeight * this.scale);
        const startIndex = Math.floor(scrollY / cellHeight);
        const visibleCells = [];
        let position = startIndex * cellHeight;

        for (let i = startIndex; position < scrollY + this.visibleHeight; i++) {
            if (!this.verticalHeaderCells.has(i)) {
                const height = this.baseCellHeight * this.scale;
                this.verticalHeaderCells.set(i, new HeaderCell(0, position, this.minCellSize, height, i + 1, i + 1, 0));
            }
            const cell = this.verticalHeaderCells.get(i);
            cell.y = position;
            cell.height = cell.height; // Make sure the height is updated based on custom sizes
            visibleCells.push(cell);
            position += cell.height;
        }

        return visibleCells;
    }

    getTotalWidth() {
        return Array.from(this.horizontalHeaderCells.values()).reduce((total, cell) => total + cell.width, 0);
    }

    getTotalHeight() {
        return Array.from(this.verticalHeaderCells.values()).reduce((total, cell) => total + cell.height, 0);
    }

    getCellSize(type, index) {
        if (type === 'horizontal') {
            return this.customHorizontalSizes.get(index) || this.horizontalHeaderCells.get(index)?.width || this.baseCellWidth * this.scale;
        } else {
            return this.customVerticalSizes.get(index) || this.verticalHeaderCells.get(index)?.height || this.baseCellHeight * this.scale;
        }
    }
}
