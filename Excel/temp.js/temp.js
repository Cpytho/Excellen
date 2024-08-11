drawSparseMatrixValues() {
  // Example of a check within the method:
  const cellValue = this.spreadsheetManager.sparseMatrix.getCell(row, col);
  if (cellValue !== undefined && cellValue !== null) {
    // Proceed with rendering the cell value
    context.fillText(cellValue.toString(), x, y);
  }
  // Else, skip rendering or render an empty string
}
