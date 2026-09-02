// @ts-check
const ExcelJS = require('exceljs');

/**
 * Reads an Excel worksheet into an array of row objects, using the first
 * row as column headers (e.g. { JobTitle: 'Test Lead', JobDescription: '...' }).
 * @param {string} filePath
 * @param {string} [sheetName] defaults to the first sheet in the workbook
 * @returns {Promise<Record<string, string>[]>}
 */
async function readExcelData(filePath, sheetName) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];
  if (!worksheet) {
    throw new Error(`Worksheet "${sheetName}" not found in ${filePath}`);
  }

  const headerRow = worksheet.getRow(1);
  const headers = /** @type {string[]} */ ([]);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value).trim();
  });

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const record = /** @type {Record<string, string>} */ ({});
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (header) record[header] = cell.value == null ? '' : String(cell.value);
    });
    rows.push(record);
  });

  return rows;
}

module.exports = { readExcelData };
