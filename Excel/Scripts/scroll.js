export class Scroll {
    constructor(fullCanvas, horizontalBar, horizontalScroll, verticalBar, verticalScroll, sheetRenderer) {
        this.fullCanvas = fullCanvas;
        this.horizontalBar = horizontalBar;
        this.horizontalScroll = horizontalScroll;
        this.verticalBar = verticalBar;
        this.verticalScroll = verticalScroll;
        this.sheetRenderer = sheetRenderer;

        this.horizontallyScrolled = 0;
        this.verticallyScrolled = 0;

        this.totalContentWidth = fullCanvas.width;
        this.totalContentHeight = fullCanvas.height;

        this.init();
    }

    init() {
        this.updateHorizontalScrollBar();
        this.updateVerticalScrollBar();
    }

    updateGrid() {
        this.sheetRenderer.updateContentOnScroll(this.horizontallyScrolled, this.verticallyScrolled);
    }

    updateHorizontalScrollBar() {
        let isScrolling = false;
        let startMouseX = 0;
        let startBarLeft = this.horizontalBar.offsetLeft;

        const updateScroll = (diffX) => {
            let newBarLeft = startBarLeft + diffX;
            let maxBarLeft = this.horizontalScroll.clientWidth - this.horizontalBar.offsetWidth;
            newBarLeft = Math.max(0, Math.min(newBarLeft, maxBarLeft));

            this.horizontallyScrolled = newBarLeft * this.totalContentWidth / this.horizontalScroll.clientWidth;

            this.horizontalBar.style.left = `${newBarLeft}px`;

            this.updateGrid();
        };

        this.horizontalBar.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            isScrolling = true;
            startMouseX = e.pageX;
            startBarLeft = this.horizontalBar.offsetLeft;

            const onMouseMove = (e) => {
                if (!isScrolling) return;
                e.preventDefault();
                const diffX = e.pageX - startMouseX;
                updateScroll(diffX);
            };

            const onMouseUp = () => {
                isScrolling = false;
                window.removeEventListener('pointermove', onMouseMove);
                window.removeEventListener('pointerup', onMouseUp);
            };

            window.addEventListener('pointermove', onMouseMove);
            window.addEventListener('pointerup', onMouseUp);
        });

        this.fullCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            updateScroll(e.deltaX);
        });
    }

    updateVerticalScrollBar() {
        let isScrolling = false;
        let startMouseY = 0;
        let startBarTop = this.verticalBar.offsetTop;

        const updateScroll = (diffY) => {
            let newBarTop = startBarTop + diffY;
            let maxBarTop = this.verticalScroll.clientHeight - this.verticalBar.offsetHeight;
            newBarTop = Math.max(0, Math.min(newBarTop, maxBarTop));

            this.verticallyScrolled = newBarTop * this.totalContentHeight / this.verticalScroll.clientHeight;

            this.verticalBar.style.top = `${newBarTop}px`;

            this.updateGrid();
        };

        this.verticalBar.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            isScrolling = true;
            startMouseY = e.pageY;
            startBarTop = this.verticalBar.offsetTop;

            const onMouseMove = (e) => {
                if (!isScrolling) return;
                e.preventDefault();
                const diffY = e.pageY - startMouseY;
                updateScroll(diffY);
            };

            const onMouseUp = () => {
                isScrolling = false;
                window.removeEventListener('pointermove', onMouseMove);
                window.removeEventListener('pointerup', onMouseUp);
            };

            window.addEventListener('pointermove', onMouseMove);
            window.addEventListener('pointerup', onMouseUp);
        });

        this.fullCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            updateScroll(e.deltaY);
        });
    }
}
