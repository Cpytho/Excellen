import { SheetRenderer } from './SheetRenderer.js'; // Adjust the path if necessary
import { SparseMatrix } from './ds.js';

export class Sheet {
    /**
     * Represents a single sheet in the spreadsheet application.
     * @param {string} name - The name of the sheet.
     * @param {number} row - The row index of the sheet.
     * @param {number} col - The column index of the sheet.
     * @param {number} index - The index of the sheet in the list of sheets.
     */
    constructor(name, row, col, index) {
        /** @type {string} */
        this.name = name; // The name of the sheet
        /** @type {number} */
        this.row = row; // The row index of the sheet
        /** @type {number} */
        this.col = col; // The column index of the sheet
        /** @type {number} */
        this.index = index; // The index of the sheet in the list
        /** @type {Object} */
        this.elements = this.createElements(); // DOM elements for the sheet
        /** @type {SparseMatrix} */
        this.sparsematrix = null; // SparseMatrix instance for managing sheet data
        /** @type {SheetRenderer} */
        this.renderer = null; // SheetRenderer instance for rendering the sheet
        setTimeout(() => {
            this.sparsematrix = new SparseMatrix(this); // Initialize SparseMatrix
            this.renderer = new SheetRenderer(this); // Initialize SheetRenderer
        }, 0);
    }

    /**
     * Creates and returns the DOM elements for the sheet.
     * @returns {Object} An object containing the topSection and middleSection elements.
     */
    createElements() {
        return {
            topSection: this.createTopSection(),
            middleSection: this.createMiddleSection()
        };
    }

    /**
     * Creates the top section of the sheet.
     * @returns {HTMLElement} The top section DOM element.
     */
    createTopSection() {
        const topSection = document.createElement('div');
        topSection.id = `topsection_${this.row}_${this.col}_${this.index}`;
        topSection.className = 'topSection';

        const nothing = document.createElement('div');
        nothing.id = `nothing_${this.row}_${this.col}_${this.index}`;
        nothing.className = 'nothing';

        const upperCanvas = document.createElement('div');
        upperCanvas.id = `upperCanvas_${this.row}_${this.col}_${this.index}`;
        upperCanvas.className = 'upperCanvas';

        const horizontalCanvas = document.createElement('canvas');
        horizontalCanvas.id = `horizontalCanvas_${this.row}_${this.col}_${this.index}`;
        horizontalCanvas.className = 'horizontalCanvas';

        upperCanvas.appendChild(horizontalCanvas);
        topSection.appendChild(nothing);
        topSection.appendChild(upperCanvas);

        return topSection;
    }

    /**
     * Creates the middle section of the sheet.
     * @returns {HTMLElement} The middle section DOM element.
     */
    createMiddleSection() {
        const midSection = document.createElement('div');
        midSection.id = `midSection_${this.row}_${this.col}_${this.index}`;
        midSection.className = 'middleSection';

        const verticalCanvasWrapper = document.createElement('div');
        verticalCanvasWrapper.id = `verticalCanvasWrapper_${this.row}_${this.col}_${this.index}`;
        verticalCanvasWrapper.className = 'verticalCanvas';

        const verticalCanvas = document.createElement('canvas');
        verticalCanvas.id = `verticalCanvas_${this.row}_${this.col}_${this.index}`;

        verticalCanvasWrapper.appendChild(verticalCanvas);

        const fullCanvas = document.createElement('div');
        fullCanvas.id = `fullCanvas_${this.row}_${this.col}_${this.index}`;
        fullCanvas.className = 'fullCanvas';

        const spreadsheetCanvas = document.createElement('canvas');
        spreadsheetCanvas.id = `spreadsheetCanvas_${this.row}_${this.col}_${this.index}`;
        spreadsheetCanvas.className = 'spreadsheetCanvas';

        const verticalScroll = this.createScrollbar('vertical');
        const horizontalScroll = this.createScrollbar('horizontal');

        const inputEle = document.createElement('input');
        inputEle.setAttribute('type', 'text');
        inputEle.id = `input_${this.row}_${this.col}_${this.index}`;
        inputEle.className = 'input';

        fullCanvas.appendChild(inputEle);
        fullCanvas.appendChild(spreadsheetCanvas);
        fullCanvas.appendChild(verticalScroll);
        fullCanvas.appendChild(horizontalScroll);

        midSection.appendChild(verticalCanvasWrapper);
        midSection.appendChild(fullCanvas);

        return midSection;
    }

    /**
     * Creates a scrollbar for the sheet.
     * @param {string} orientation - The orientation of the scrollbar ('vertical' or 'horizontal').
     * @returns {HTMLElement} The scrollbar DOM element.
     */
    createScrollbar(orientation) {
        const scroll = document.createElement('div');
        scroll.id = `${orientation}Scroll_${this.row}_${this.col}_${this.index}`;
        scroll.className = `${orientation}Scroll`;
        
        const bar = document.createElement('div');
        bar.id = `${orientation}Bar_${this.row}_${this.col}_${this.index}`;
        bar.className = `${orientation}Bar`;
        
        scroll.appendChild(bar);
        return scroll;
    }
}

export class Emaker {
    /**
     * Manages the Excel spreadsheet application and its sheets.
     * @param {HTMLElement} excel - The container element for the Excel grid.
     * @param {number} row - The row index of the cell.
     * @param {number} col - The column index of the cell.
     */
    constructor(excel, row, col) {
        /** @type {number} */
        this.row = row; // The row index for the spreadsheet
        /** @type {number} */
        this.col = col; // The column index for the spreadsheet
        /** @type {HTMLElement} */
        this.excel = excel; // The container element for the Excel grid
        /** @type {Array<{ name: string, instance: Sheet }>} */
        this.sheets = [{ name: 'Sheet1', instance: new Sheet('Sheet1', this.row, this.col, 0) }]; // List of sheets
        /** @type {number} */
        this.activeSheetIndex = 0; // Index of the currently active sheet
        this.createExcel();
    }

    /**
     * Creates the main Excel container and initializes the UI.
     */
    createExcel() {
        this.excel.innerHTML = '';
        /** @type {HTMLElement} */
        const wrapper = document.createElement('div');
        wrapper.className = 'excelWrapper';

        /** @type {HTMLElement} */
        this.contentArea = document.createElement('div');
        this.contentArea.className = 'contentArea';
        this.updateContentArea();

        /** @type {HTMLElement} */
        const sheetBar = this.createSheetBar();

        wrapper.appendChild(this.contentArea);
        wrapper.appendChild(sheetBar);
        this.excel.appendChild(wrapper);
    }

    /**
     * Updates the content area with the currently active sheet's elements.
     */
    updateContentArea() {
        this.contentArea.innerHTML = '';
        /** @type {Sheet} */
        const activeSheet = this.sheets[this.activeSheetIndex].instance;
        this.contentArea.appendChild(activeSheet.elements.topSection);
        this.contentArea.appendChild(activeSheet.elements.middleSection);
    }

    /**
     * Creates the sheet bar that contains sheet controls and tabs.
     * @returns {HTMLElement} The sheet bar DOM element.
     */
    createSheetBar() {
        /** @type {HTMLElement} */
        const sheetBar = document.createElement('div');
        sheetBar.className = 'sheet-bar';

        /** @type {HTMLElement} */
        const controls = document.createElement('div');
        controls.className = 'sheet-controls';
        controls.innerHTML = `<button class="add-sheet">+</button>`;

        /** @type {HTMLElement} */
        const tabs = document.createElement('div');
        tabs.className = 'sheet-tabs';
        this.updateSheetTabs(tabs);

        /** @type {HTMLElement} */
        const scroll = document.createElement('div');
        scroll.className = 'sheet-scroll';
        scroll.innerHTML = `
            <button class="scroll-left">◀</button>
            <button class="scroll-right">▶</button>
        `;

        sheetBar.appendChild(controls);
        sheetBar.appendChild(tabs);
        sheetBar.appendChild(scroll);

        controls.querySelector('.add-sheet').onclick = () => this.addSheet();
        tabs.onclick = (e) => {
            if (e.target.classList.contains('sheet-tab')) {
                this.switchSheet(parseInt(e.target.dataset.index, 10));
            } else if (e.target.classList.contains('close-tab')) {
                this.removeSheet(parseInt(e.target.dataset.index, 10));
            }
        };

        return sheetBar;
    }

    /**
     * Updates the sheet tabs with the list of sheets.
     * @param {HTMLElement} tabsContainer - The container element for the sheet tabs.
     */
    updateSheetTabs(tabsContainer) {
        tabsContainer.innerHTML = this.sheets.map((sheet, index) => `
            <div class="sheet-tab ${index === this.activeSheetIndex ? 'active' : ''}" data-index="${index}">
                ${sheet.name}
                <button class="close-tab" data-index="${index}">✖</button>
            </div>
        `).join('');
    }

    /**
     * Adds a new sheet to the spreadsheet.
     */
    addSheet() {
        const newIndex = this.sheets.length;
        const newName = `Sheet${newIndex + 1}`;
        this.sheets.push({ name: newName, instance: new Sheet(newName, this.row, this.col, newIndex) });
        this.switchSheet(newIndex);
        this.updateSheetTabs(this.excel.querySelector('.sheet-tabs'));
    }

    /**
     * Switches to a different sheet.
     * @param {number} index - The index of the sheet to switch to.
     */
    switchSheet(index) {
        if (index !== this.activeSheetIndex && index >= 0 && index < this.sheets.length) {
            this.activeSheetIndex = index;
            this.updateContentArea();
            this.updateSheetTabs(this.excel.querySelector('.sheet-tabs'));
        }
    }

    /**
     * Removes a sheet from the spreadsheet.
     * @param {number} index - The index of the sheet to remove.
     */
    removeSheet(index) {
        if (this.sheets.length <= 1) {
            alert("You cannot remove the last sheet.");
            return;
        }

        // Remove the sheet from the array
        this.sheets.splice(index, 1);

        // Update the active sheet index if needed
        if (index === this.activeSheetIndex) {
            // Switch to the previous sheet or the first sheet if the last one is removed
            this.activeSheetIndex = Math.max(0, index - 1);
        } else if (index < this.activeSheetIndex) {
            // Adjust activeSheetIndex if the removed sheet was before the currently active one
            this.activeSheetIndex--;
        }

        this.updateContentArea();
        this.updateSheetTabs(this.excel.querySelector('.sheet-tabs'));
    }
}
