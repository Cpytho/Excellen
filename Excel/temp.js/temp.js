class FlexGrid {
    constructor(container) {
      this.container = container;
      this.init();
    }
  
    init() {
      this.container.addEventListener('mousedown', this.startResize.bind(this));
    }
  
    startResize(e) {
      if (e.target.classList.contains('cell')) {
        const cell = e.target;
        const isHorizontal = e.offsetX > cell.offsetWidth - 10;
        const isVertical = e.offsetY > cell.offsetHeight - 10;
  
        if (isHorizontal || isVertical) {
          const initialX = e.clientX;
          const initialY = e.clientY;
          const initialWidth = cell.offsetWidth;
          const initialHeight = cell.offsetHeight;
  
          const moveHandler = (moveEvent) => {
            if (isHorizontal) {
              const deltaX = moveEvent.clientX - initialX;
              cell.style.flex = `0 0 ${initialWidth + deltaX}px`;
            }
            if (isVertical) {
              const deltaY = moveEvent.clientY - initialY;
              cell.closest('.row').style.flex = `0 0 ${initialHeight + deltaY}px`;
            }
          };
  
          const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
          };
  
          document.addEventListener('mousemove', moveHandler);
          document.addEventListener('mouseup', upHandler);
        }
      }
    }
  }
  
  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('mainContainer');
    new FlexGrid(container);
  });