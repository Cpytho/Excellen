import { Emaker } from './eMaker.js';

/**
 * Class to manage border highlighting for selected cells in an Excel-like grid.
 */
class ExcelBorderHighlighter {
    /**
     * @param {HTMLElement} excelContainer - The container element holding the Excel grid.
     */
    constructor(excelContainer) {
        /** @type {HTMLElement} */
        this.excelContainer = excelContainer;
        /** @type {HTMLElement|null} */
        this.selectedDiv = null;
        this.handleClick = this.handleClick.bind(this);
        this.addClickListener();
    }
  
    /**
     * Handles click events to highlight the selected cell's border.
     * @param {MouseEvent} event - The click event object.
     */
    handleClick(event) {
        /** @type {HTMLElement|null} */
        if (this.selectedDiv) {
            this.selectedDiv.style.border = '1px solid black';
        }
  
        /** @type {HTMLElement|null} */
        const targetDiv = event.target.closest('div[aria-rowindex][aria-colindex]');
        
        if (targetDiv) {
            targetDiv.style.border = '1px solid red';
            this.selectedDiv = targetDiv;
        }
    }
  
    /**
     * Adds click event listener to the Excel container.
     */
    addClickListener() {
        this.excelContainer.addEventListener('click', this.handleClick);
    }
}

/**
 * Class representing an Excel cell.
 */
class Excel {
    /**
     * @param {HTMLElement} rowContainer - The container element for the row.
     * @param {number} row - The row index of the cell.
     * @param {number} col - The column index of the cell.
     */
    constructor(rowContainer, row, col) {
        /** @type {HTMLElement} */
        this.rowContainer = rowContainer;
        /** @type {number} */
        this.col = col;
        /** @type {number} */
        this.row = row;
        this.init();
    }

    /**
     * Initializes the Excel cell.
     */
    init() {
        this.constructExcel();
    }
 
    /**
     * Constructs and appends the cell element to the row container.
     */
    constructExcel() {
        /** @type {HTMLElement} */
        const excel = document.createElement('div');
        excel.className = 'excel resizable';
        excel.setAttribute('id', `rowCol${this.row}_${this.col}`);
        excel.setAttribute('role', 'gridcell');
        excel.setAttribute('aria-rowindex', this.row);
        excel.setAttribute('aria-colindex', this.col);
        excel.style.flex = '1';
        this.rowContainer.appendChild(excel);
        /** @type {HTMLElement} */
        this.element = excel;
        new Emaker(excel, this.row, this.col);
    }
}

/**
 * Class to manage the creation and resizing of the grid.
 */
class Grid_maker {
    /**
     * @param {HTMLElement} mainContainer - The main container element for the grid.
     * @param {number} maxRow - Maximum number of rows allowed.
     * @param {number} maxCol - Maximum number of columns allowed.
     */
    constructor(mainContainer, maxRow, maxCol) {
        /** @type {HTMLElement} */
        this.mainContainer = mainContainer;
        /** @type {number} */
        this.maxRow = maxRow;
        /** @type {number} */
        this.maxCol = maxCol;
        /** @type {number} */
        this.currentRowCount = 0;
        /** @type {Array<Array<Excel>>} */
        this.rowArr = [];
        this.init();
    }

    /**
     * Adds a new row to the grid.
     */
    addNewRow() {
        if (this.currentRowCount >= this.maxRow) {
            alert("No more rows can be added");
            return;
        }

        this.currentRowCount += 1;
        /** @type {HTMLElement} */
        const row = document.createElement('div');
        row.className = 'row';
        row.id = `row_${this.currentRowCount}`;
        row.style.flex = '1';

        const excel = new Excel(row, this.currentRowCount, 1);
        this.rowArr[this.currentRowCount - 1] = [excel];
        this.mainContainer.appendChild(row);
    }

    /**
     * Adds a new column to a specified row.
     * @param {number} rowNum - The index of the row to which the column should be added.
     */
    addNewCol(rowNum) {
        if (rowNum > this.currentRowCount) return;
        /** @type {number} */
        let colCount = this.rowArr[rowNum - 1].length;
        if (colCount >= this.maxCol) {
            alert("No more columns can be added");
            return;
        }

        colCount += 1;
        /** @type {HTMLElement} */
        const row = document.getElementById(`row_${rowNum}`);
        const excel = new Excel(row, rowNum, colCount);
        this.rowArr[rowNum - 1].push(excel);
    }

    /**
     * Adds resize handles to rows and columns.
     */
    addResizeHandles() {
        this.rowArr.forEach((row, rowIndex) => {
            /** @type {HTMLElement} */
            const rowElement = document.getElementById(`row_${rowIndex + 1}`);

            // Add row resize handle
            if (rowIndex < this.rowArr.length - 1) {
                /** @type {HTMLElement} */
                const rowResizeHandle = document.createElement('div');
                rowResizeHandle.className = 'row-resize-handle';
                rowElement.appendChild(rowResizeHandle);
            }

            row.forEach((cell, colIndex) => {
                // Add column resize handle
                if (colIndex < row.length - 1) {
                    /** @type {HTMLElement} */
                    const colResizeHandle = document.createElement('div');
                    colResizeHandle.className = 'col-resize-handle';
                    cell.element.appendChild(colResizeHandle);
                }
            });
        });
    }

    /**
     * Handles resizing of rows and columns.
     */
    handleResize() {
        /** @type {boolean} */
        let isResizing = false;
        /** @type {HTMLElement|null} */
        let currentElement = null;
        /** @type {number} */
        let startX, startY;
        /** @type {number} */
        let startWidth, startHeight;
        /** @type {string} */
        let resizeType = '';

        const startResize = (e) => {
            if (e.target.classList.contains('col-resize-handle')) {
                currentElement = e.target.closest('.excel');
                resizeType = 'column';
                
            } else if (e.target.classList.contains('row-resize-handle')) {
                currentElement = e.target.closest('.row');
                resizeType = 'row';
            } else {
                return;
            }

            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = currentElement.offsetWidth;
            startHeight = currentElement.offsetHeight;

            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
            e.preventDefault();
        };

        const resize = (e) => {
            if (!isResizing) return;

            if (resizeType === 'column') {
                /** @type {number} */
                const width = startWidth + (e.clientX - startX);
                currentElement.style.width = `${width}px`;
                currentElement.style.flex = 'none'; // Override flex settings
            } else if (resizeType === 'row') {
                /** @type {number} */
                const height = startHeight + (e.clientY - startY);
                // Ensure the height does not go below a minimum value (e.g., 50px)
                /** @type {number} */
                const newHeight = Math.max(height, 50);
                currentElement.style.height = `${newHeight}px`;
                currentElement.style.flex = 'none'; // Override flex settings
            }

            // Force a reflow/repaint to make sure the changes are applied
            currentElement.style.display = 'none';
            currentElement.offsetHeight; // Trigger reflow
            currentElement.style.display = '';
        };

        const stopResize = () => {
            isResizing = false;
            currentElement = null;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        };

        this.mainContainer.addEventListener('mousedown', startResize);
    }

    /**
     * Initializes the grid maker by adding initial rows and columns, and setting up resizing and highlighting.
     */
    init() {
        this.mainContainer.style.display = 'flex';
        this.mainContainer.style.flexDirection = 'column';
        this.addNewRow();
        this.addNewCol(1);
        
        this.addResizeHandles();
        this.handleResize();
        this.borderHighlighter = new ExcelBorderHighlighter(this.mainContainer);
    }
}

/**
 * Initializes the Grid_maker with a specified main container and grid size.
 * @param {HTMLElement} mainContainer - The main container element for the grid.
 */
function init(mainContainer) {
    new Grid_maker(mainContainer, 3, 3);
}

document.addEventListener('DOMContentLoaded', () => {
    /** @type {HTMLElement} */
    let mainContainer = document.getElementById("mainContainer");
    init(mainContainer);
});
