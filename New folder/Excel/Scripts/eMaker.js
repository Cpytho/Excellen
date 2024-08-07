import {SheetRenderer} from './SheetRenderer.js' // Adjust the path if necessary
import {SparseMatrix} from './ds.js'

export class Sheet {
    constructor(name, row, col, index) {
        
        this.name = name;  // Keeping name for potential future use
        this.row = row;
        this.col = col;
        this.index = index;
        this.elements = this.createElements();
        setTimeout(() => {
            this.sparsematrix = new SparseMatrix(this);   
            this.renderer = new SheetRenderer(this);   
        }, 0);
    }

    createElements() {
        return {
            topSection: this.createTopSection(),
            middleSection: this.createMiddleSection()
        };
    }

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
        inputEle.id = `input_${this.row}_${this.col}_${this.index}`
        inputEle.className = 'input';

        fullCanvas.appendChild(inputEle);
        fullCanvas.appendChild(spreadsheetCanvas);
        fullCanvas.appendChild(verticalScroll);
        fullCanvas.appendChild(horizontalScroll);

        midSection.appendChild(verticalCanvasWrapper);
        midSection.appendChild(fullCanvas);

        return midSection;
    }

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
    constructor(excel,row,col) {
        this.row  = row;
        this.col = col;
        this.excel = excel;
        this.sheets = [{ name: 'Sheet1', instance: new Sheet('Sheet1', this.row, this.col, 0) }];
        this.activeSheetIndex = 0;
        this.createExcel();
    }

    createExcel() {
        this.excel.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'excelWrapper';

        this.contentArea = document.createElement('div');
        this.contentArea.className = 'contentArea';
        this.updateContentArea();

        const sheetBar = this.createSheetBar();

        wrapper.appendChild(this.contentArea);
        wrapper.appendChild(sheetBar);
        this.excel.appendChild(wrapper);
    }

    updateContentArea() {
        this.contentArea.innerHTML = '';
        const activeSheet = this.sheets[this.activeSheetIndex].instance;
        this.contentArea.appendChild(activeSheet.elements.topSection);
        this.contentArea.appendChild(activeSheet.elements.middleSection);
    }

    createSheetBar() {
        const sheetBar = document.createElement('div');
        sheetBar.className = 'sheet-bar';

        const controls = document.createElement('div');
        controls.className = 'sheet-controls';
        controls.innerHTML = `<button class="add-sheet">+</button>`;

        const tabs = document.createElement('div');
        tabs.className = 'sheet-tabs';
        this.updateSheetTabs(tabs);

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
                this.switchSheet(parseInt(e.target.dataset.index));
            } else if (e.target.classList.contains('close-tab')) {
                this.removeSheet(parseInt(e.target.dataset.index));
            }
        };

        return sheetBar;
    }

    updateSheetTabs(tabsContainer) {
        tabsContainer.innerHTML = this.sheets.map((sheet, index) => `
            <div class="sheet-tab ${index === this.activeSheetIndex ? 'active' : ''}" data-index="${index}">
                ${sheet.name}
                <button class="close-tab" data-index="${index}">✖</button>
            </div>
        `).join('');
    }

    addSheet() {
        const newIndex = this.sheets.length;
        const newName = `Sheet${newIndex + 1}`;
        this.sheets.push({ name: newName, instance: new Sheet(newName, this.row, this.col, newIndex) });
        this.switchSheet(newIndex);
        this.updateSheetTabs(this.excel.querySelector('.sheet-tabs'));
    }

    switchSheet(index) {
        if (index !== this.activeSheetIndex && index >= 0 && index < this.sheets.length) {
            this.activeSheetIndex = index;
            this.updateContentArea();
            this.updateSheetTabs(this.excel.querySelector('.sheet-tabs'));
        }
    }

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
