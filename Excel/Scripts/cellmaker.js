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
    constructor(visibleWidth, visibleHeight, scale) {
        this.minCellSize = 30;
        this.baseCellWidth = 80;
        this.baseCellHeight = 40;
        this.scale = scale;
        this.visibleWidth = visibleWidth*2;
        this.visibleHeight = visibleHeight*2;
        this.horizontalHeaderCells = [];
        this.verticalHeaderCells = []; // Changed from Map to Array
        this.customHorizontalSizes = new Map();
        this.customVerticalSizes = new Map();
         this.totalWidth = 0;
        this.totalHeight = 0;
        // Initialize cells
        this.update(visibleWidth, visibleHeight, scale);
    }

    update(visibleWidth, visibleHeight, scale) {
        const oldScale = this.scale;
        this.visibleWidth = visibleWidth*2;
        this.visibleHeight = visibleHeight*2;
        this.scale = scale;
        this.resizeAllCells(oldScale, scale);
        this.updateCells();
    }

    resizeAllCells(oldScale, newScale) {
        const scaleFactor = newScale / oldScale;
        
        // Resize horizontal cells
        for (let cell of this.horizontalHeaderCells) {
            if (!this.customHorizontalSizes.has(cell.col - 1)) {
                cell.width *= scaleFactor;
            }
        }
        
        // Resize vertical cells
        for (let cell of this.verticalHeaderCells) {
            if (!this.customVerticalSizes.has(cell.row - 1)) {
                cell.height *= scaleFactor;
            }
        }
    }
    
    updateCells() {
        const cellWidth = Math.max(this.minCellSize, this.baseCellWidth * this.scale);
        const cellHeight = Math.max(this.minCellSize, this.baseCellHeight * this.scale);
    
        // Update horizontal cells
        const horizontalCellCount = Math.ceil(this.visibleWidth / cellWidth) + 1;
        while (this.horizontalHeaderCells.length < horizontalCellCount) {
            const i = this.horizontalHeaderCells.length;
            const width = this.customHorizontalSizes.get(i) || cellWidth;
            this.horizontalHeaderCells.push(new HeaderCell(0, 0, width, this.minCellSize, this.numberToColumnName(i + 1), 0, i + 1));
        }
    
        // Update vertical cells
        const verticalCellCount = Math.ceil(this.visibleHeight / cellHeight) + 1;
        while (this.verticalHeaderCells.length < verticalCellCount) {
            const i = this.verticalHeaderCells.length;
            const height = this.customVerticalSizes.get(i) || cellHeight;
            this.verticalHeaderCells.push(new HeaderCell(0, 0, this.minCellSize, height, i + 1, i + 1, 0));
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
        if (type === 'horizontal') {
            let position = 0;
            for (let i = 0; i < this.horizontalHeaderCells.length; i++) {
                const cell = this.horizontalHeaderCells[i];
                if (this.customHorizontalSizes.has(i)) {
                    cell.width = this.customHorizontalSizes.get(i);
                }
                cell.x = position;
                position += cell.width;
            }
        } else {
            let position = 0;
            for (let i = 0; i < this.verticalHeaderCells.length; i++) {
                const cell = this.verticalHeaderCells[i];
                if (this.customVerticalSizes.has(i)) {
                    cell.height = this.customVerticalSizes.get(i);
                }
                cell.y = position;
                position += cell.height;
            }
        }
    }

    findStartingIndex(type, scroll) {
        const cells = type === 'horizontal' ? this.horizontalHeaderCells : this.verticalHeaderCells;
        let low = 0;
        let high = cells.length - 1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const cell = cells[mid];
            const position = type === 'horizontal' ? cell.x : cell.y;
            const size = type === 'horizontal' ? cell.width : cell.height;

            if (position + size > scroll) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }

        return low < cells.length ? low : cells.length;
    }

    getHorizontalHeaderCells(scrollX) {
        const startIndex = this.findStartingIndex('horizontal', scrollX);
        const visibleCells = [];
        let position = this.horizontalHeaderCells[startIndex]?.x || 0;
    
        for (let i = startIndex; position < scrollX + (this.visibleWidth*2); i++) {
            if (i >= this.horizontalHeaderCells.length) {
                const width = this.getCellSize('horizontal', i);
                this.horizontalHeaderCells.push(new HeaderCell(position, 0, width, this.minCellSize, this.numberToColumnName(i + 1), 0, i + 1));
            }
            const cell = this.horizontalHeaderCells[i];
            visibleCells.push(cell);
            position += cell.width;
        }
    
        return visibleCells;
    }
    
    getVerticalHeaderCells(scrollY) {
        const startIndex = this.findStartingIndex('vertical', scrollY);
        const visibleCells = [];
        let position = this.verticalHeaderCells[startIndex]?.y || 0;
    
        for (let i = startIndex; position < scrollY + (this.visibleHeight*2); i++) {
            if (i >= this.verticalHeaderCells.length) {
                const height = this.getCellSize('vertical', i);
                this.verticalHeaderCells.push(new HeaderCell(0, position, this.minCellSize, height, i + 1, i + 1, 0));
            }
            const cell = this.verticalHeaderCells[i];
            visibleCells.push(cell);
            position += cell.height;
        }
    
        return visibleCells;
    }

    getTotalWidth() {
        return this.horizontalHeaderCells.reduce((total, cell) => total + cell.width, 0);
    }

    getTotalHeight() {
        return this.verticalHeaderCells.reduce((total, cell) => total + cell.height, 0);
    }

    getCellSize(type, index) {
        if (type === 'horizontal') {
            return this.customHorizontalSizes.get(index) || this.horizontalHeaderCells[index]?.width || this.baseCellWidth * this.scale;
        } else {
            return this.customVerticalSizes.get(index) || this.verticalHeaderCells[index]?.height || this.baseCellHeight * this.scale;
        }
    }
}
