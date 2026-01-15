import { format } from 'date-fns';

// Types for Tally-compatible exports
export interface SalesVoucherItem {
  voucherDate: string;
  voucherNumber: string;
  partyName: string;
  gstin: string;
  state: string;
  itemName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

export interface InventoryItem {
  date: string;
  voucherNo: string;
  itemName: string;
  sku: string;
  hsnCode: string;
  unit: string;
  openingStock: number;
  inwardQty: number;
  outwardQty: number;
  closingStock: number;
  rate: number;
  value: number;
}

export interface CustomerLedger {
  customerName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  contactPerson: string;
  phone: string;
  email: string;
  openingBalance: number;
}

export interface ProductMaster {
  itemName: string;
  sku: string;
  hsnCode: string;
  category: string;
  unit: string;
  gstRate: number;
  openingStock: number;
  openingValue: number;
  mrp: number;
  sellingPrice: number;
}

// CSV Generation
export function generateSalesCSV(items: SalesVoucherItem[]): string {
  const headers = [
    'Voucher Date',
    'Voucher Number',
    'Party Name',
    'GSTIN',
    'State',
    'Item Name',
    'HSN Code',
    'Quantity',
    'Unit',
    'Rate',
    'Taxable Value',
    'CGST Rate (%)',
    'CGST Amount',
    'SGST Rate (%)',
    'SGST Amount',
    'IGST Rate (%)',
    'IGST Amount',
    'Total Amount',
  ];

  const rows = items.map((item) => [
    item.voucherDate,
    item.voucherNumber,
    `"${item.partyName}"`,
    item.gstin || '',
    item.state || '',
    `"${item.itemName}"`,
    item.hsnCode || '',
    item.quantity,
    item.unit || 'PCS',
    item.rate.toFixed(2),
    item.taxableValue.toFixed(2),
    item.cgstRate.toFixed(2),
    item.cgstAmount.toFixed(2),
    item.sgstRate.toFixed(2),
    item.sgstAmount.toFixed(2),
    item.igstRate.toFixed(2),
    item.igstAmount.toFixed(2),
    item.totalAmount.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function generateInventoryCSV(items: InventoryItem[]): string {
  const headers = [
    'Date',
    'Voucher No',
    'Item Name',
    'SKU',
    'HSN Code',
    'Unit',
    'Opening Stock',
    'Inward Qty',
    'Outward Qty',
    'Closing Stock',
    'Rate',
    'Value',
  ];

  const rows = items.map((item) => [
    item.date,
    item.voucherNo,
    `"${item.itemName}"`,
    item.sku || '',
    item.hsnCode || '',
    item.unit || 'PCS',
    item.openingStock,
    item.inwardQty,
    item.outwardQty,
    item.closingStock,
    item.rate.toFixed(2),
    item.value.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function generateCustomerCSV(customers: CustomerLedger[]): string {
  const headers = [
    'Customer Name',
    'Address',
    'City',
    'State',
    'Pincode',
    'GSTIN',
    'PAN',
    'Contact Person',
    'Phone',
    'Email',
    'Opening Balance',
  ];

  const rows = customers.map((c) => [
    `"${c.customerName}"`,
    `"${c.address}"`,
    c.city,
    c.state,
    c.pincode,
    c.gstin || '',
    c.pan || '',
    `"${c.contactPerson}"`,
    c.phone || '',
    c.email || '',
    c.openingBalance.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function generateProductMasterCSV(products: ProductMaster[]): string {
  const headers = [
    'Item Name',
    'SKU',
    'HSN Code',
    'Category',
    'Unit',
    'GST Rate (%)',
    'Opening Stock',
    'Opening Value',
    'MRP',
    'Selling Price',
  ];

  const rows = products.map((p) => [
    `"${p.itemName}"`,
    p.sku || '',
    p.hsnCode || '',
    `"${p.category || ''}"`,
    p.unit || 'PCS',
    p.gstRate.toFixed(2),
    p.openingStock,
    p.openingValue.toFixed(2),
    p.mrp?.toFixed(2) || '',
    p.sellingPrice.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

// Tally XML Generation for native import
export function generateSalesXML(items: SalesVoucherItem[], companyName: string = 'My Company'): string {
  const vouchersByOrder = items.reduce((acc, item) => {
    if (!acc[item.voucherNumber]) {
      acc[item.voucherNumber] = [];
    }
    acc[item.voucherNumber].push(item);
    return acc;
  }, {} as Record<string, SalesVoucherItem[]>);

  const vouchers = Object.entries(vouchersByOrder).map(([voucherNo, items]) => {
    const firstItem = items[0];
    const totalAmount = items.reduce((sum, i) => sum + i.totalAmount, 0);
    
    const inventoryEntries = items.map((item) => `
          <ALLINVENTORYENTRIES.LIST>
            <STOCKITEMNAME>${escapeXml(item.itemName)}</STOCKITEMNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <RATE>${item.rate}/PCS</RATE>
            <AMOUNT>${item.taxableValue}</AMOUNT>
            <ACTUALQTY>${item.quantity} PCS</ACTUALQTY>
            <BILLEDQTY>${item.quantity} PCS</BILLEDQTY>
          </ALLINVENTORYENTRIES.LIST>`).join('');

    return `
        <VOUCHER VCHTYPE="Sales" ACTION="Create">
          <DATE>${formatDateForTally(firstItem.voucherDate)}</DATE>
          <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
          <VOUCHERNUMBER>${voucherNo}</VOUCHERNUMBER>
          <PARTYLEDGERNAME>${escapeXml(firstItem.partyName)}</PARTYLEDGERNAME>
          <BASICBASEPARTYNAME>${escapeXml(firstItem.partyName)}</BASICBASEPARTYNAME>
          <PARTYGSTIN>${firstItem.gstin || ''}</PARTYGSTIN>
          <PLACEOFSUPPLY>${firstItem.state || ''}</PLACEOFSUPPLY>
          ${inventoryEntries}
          <LEDGERENTRIES.LIST>
            <LEDGERNAME>${escapeXml(firstItem.partyName)}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-${totalAmount}</AMOUNT>
          </LEDGERENTRIES.LIST>
          <LEDGERENTRIES.LIST>
            <LEDGERNAME>Sales Account</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>${items.reduce((s, i) => s + i.taxableValue, 0)}</AMOUNT>
          </LEDGERENTRIES.LIST>
        </VOUCHER>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          ${vouchers.join('')}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function generateStockItemsXML(products: ProductMaster[], companyName: string = 'My Company'): string {
  const stockItems = products.map((p) => `
        <STOCKITEM NAME="${escapeXml(p.itemName)}" ACTION="Create">
          <NAME>${escapeXml(p.itemName)}</NAME>
          <GSTAPPLICABLE>Applicable</GSTAPPLICABLE>
          <GSTTYPEOFSUPPLY>Goods</GSTTYPEOFSUPPLY>
          <HSNCODE>${p.hsnCode || ''}</HSNCODE>
          <TAXABILITY>Taxable</TAXABILITY>
          <BASEUNITS>${p.unit || 'PCS'}</BASEUNITS>
          <OPENINGBALANCE>${p.openingStock} ${p.unit || 'PCS'}</OPENINGBALANCE>
          <OPENINGVALUE>${p.openingValue}</OPENINGVALUE>
          <RATEOFDUTY>${p.gstRate}</RATEOFDUTY>
        </STOCKITEM>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          ${stockItems.join('')}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function generateLedgersXML(customers: CustomerLedger[], companyName: string = 'My Company'): string {
  const ledgers = customers.map((c) => `
        <LEDGER NAME="${escapeXml(c.customerName)}" ACTION="Create">
          <NAME>${escapeXml(c.customerName)}</NAME>
          <PARENT>Sundry Debtors</PARENT>
          <ISBILLWISEON>Yes</ISBILLWISEON>
          <AFFECTSSTOCK>No</AFFECTSSTOCK>
          <OPENINGBALANCE>${c.openingBalance}</OPENINGBALANCE>
          <ADDRESS.LIST>
            <ADDRESS>${escapeXml(c.address)}</ADDRESS>
            <ADDRESS>${c.city}, ${c.state} - ${c.pincode}</ADDRESS>
          </ADDRESS.LIST>
          <LEDGERPHONE>${c.phone || ''}</LEDGERPHONE>
          <LEDGEREMAIL>${c.email || ''}</LEDGEREMAIL>
          <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
          <PARTYGSTIN>${c.gstin || ''}</PARTYGSTIN>
          <PANNUMBER>${c.pan || ''}</PANNUMBER>
        </LEDGER>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          ${ledgers.join('')}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

// Helper functions
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDateForTally(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, 'yyyyMMdd');
  } catch {
    return dateStr;
  }
}

// Download utility
export function downloadFile(content: string, filename: string, type: 'csv' | 'xml'): void {
  const mimeType = type === 'csv' ? 'text/csv' : 'application/xml';
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
