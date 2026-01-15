import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format as formatDate } from 'date-fns';
import { toast } from 'sonner';
import {
  SalesVoucherItem,
  InventoryItem,
  CustomerLedger,
  ProductMaster,
  generateSalesCSV,
  generateInventoryCSV,
  generateCustomerCSV,
  generateProductMasterCSV,
  generateSalesXML,
  generateStockItemsXML,
  generateLedgersXML,
  downloadFile,
} from '@/lib/tallyFormat';

export type ExportFormat = 'csv' | 'xml';
export type ExportType = 'sales' | 'inventory' | 'customers' | 'products' | 'gst-summary';

interface ExportParams {
  type: ExportType;
  format: ExportFormat;
  dateRange?: {
    from: Date;
    to: Date;
  };
  companyName?: string;
}

interface GSTSummaryItem {
  hsnCode: string;
  description: string;
  totalQty: number;
  totalValue: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export function useTallyExport() {
  return useMutation({
    mutationFn: async ({ type, format: exportFormat, dateRange, companyName = 'GlowMart' }: ExportParams) => {
      const fromDate = dateRange?.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : null;
      const toDate = dateRange?.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : null;
      const timestamp = formatDate(new Date(), 'yyyyMMdd_HHmmss');

      switch (type) {
        case 'sales': {
          const salesData = await fetchSalesData(fromDate, toDate);
          const filename = `sales_vouchers_${timestamp}.${exportFormat}`;
          
          if (exportFormat === 'csv') {
            const content = generateSalesCSV(salesData);
            downloadFile(content, filename, 'csv');
          } else {
            const content = generateSalesXML(salesData, companyName);
            downloadFile(content, filename, 'xml');
          }
          return { count: salesData.length, type: 'sales vouchers' };
        }

        case 'inventory': {
          const inventoryData = await fetchInventoryData(fromDate, toDate);
          const filename = `inventory_report_${timestamp}.${exportFormat}`;
          
          if (exportFormat === 'csv') {
            const content = generateInventoryCSV(inventoryData);
            downloadFile(content, filename, 'csv');
          } else {
            toast.error('XML format not supported for inventory reports');
            return { count: 0, type: 'inventory' };
          }
          return { count: inventoryData.length, type: 'inventory items' };
        }

        case 'customers': {
          const customerData = await fetchCustomerData();
          const filename = `customer_ledgers_${timestamp}.${exportFormat}`;
          
          if (exportFormat === 'csv') {
            const content = generateCustomerCSV(customerData);
            downloadFile(content, filename, 'csv');
          } else {
            const content = generateLedgersXML(customerData, companyName);
            downloadFile(content, filename, 'xml');
          }
          return { count: customerData.length, type: 'customer ledgers' };
        }

        case 'products': {
          const productData = await fetchProductData();
          const filename = `product_master_${timestamp}.${exportFormat}`;
          
          if (exportFormat === 'csv') {
            const content = generateProductMasterCSV(productData);
            downloadFile(content, filename, 'csv');
          } else {
            const content = generateStockItemsXML(productData, companyName);
            downloadFile(content, filename, 'xml');
          }
          return { count: productData.length, type: 'products' };
        }

        case 'gst-summary': {
          const gstData = await fetchGSTSummary(fromDate, toDate);
          const filename = `gst_summary_${timestamp}.csv`;
          const content = generateGSTSummaryCSV(gstData);
          downloadFile(content, filename, 'csv');
          return { count: gstData.length, type: 'HSN codes' };
        }

        default:
          throw new Error('Invalid export type');
      }
    },
    onSuccess: (data) => {
      toast.success(`Exported ${data.count} ${data.type} successfully!`);
    },
    onError: (error: Error) => {
      toast.error('Export failed: ' + error.message);
    },
  });
}

// Data fetching functions
async function fetchSalesData(fromDate: string | null, toDate: string | null): Promise<SalesVoucherItem[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false });

  if (fromDate) {
    query = query.gte('created_at', fromDate);
  }
  if (toDate) {
    query = query.lte('created_at', toDate + 'T23:59:59');
  }

  const { data: orders, error } = await query;
  if (error) throw error;

  const salesItems: SalesVoucherItem[] = [];

  for (const order of orders || []) {
    const shippingAddress = order.shipping_address as any;
    const gstRate = 18; // Default GST rate

    for (const item of order.order_items || []) {
      const itemGstRate = item.gst_percent || gstRate;
      const taxableValue = item.total_price / (1 + itemGstRate / 100);
      const totalGst = item.total_price - taxableValue;
      
      // Determine if IGST or CGST+SGST based on state
      const isInterState = false; // You can add logic to determine this based on company state vs customer state

      salesItems.push({
        voucherDate: formatDate(new Date(order.created_at), 'yyyy-MM-dd'),
        voucherNumber: order.order_number,
        partyName: shippingAddress?.full_name || 'Customer',
        gstin: '', // Can be added to address in future
        state: shippingAddress?.state || '',
        itemName: item.product_name,
        hsnCode: item.sku?.startsWith('HSN') ? item.sku : '',
        quantity: item.quantity,
        unit: 'PCS',
        rate: item.unit_price,
        taxableValue: Number(taxableValue.toFixed(2)),
        cgstRate: isInterState ? 0 : itemGstRate / 2,
        cgstAmount: isInterState ? 0 : Number((totalGst / 2).toFixed(2)),
        sgstRate: isInterState ? 0 : itemGstRate / 2,
        sgstAmount: isInterState ? 0 : Number((totalGst / 2).toFixed(2)),
        igstRate: isInterState ? itemGstRate : 0,
        igstAmount: isInterState ? Number(totalGst.toFixed(2)) : 0,
        totalAmount: item.total_price,
      });
    }
  }

  return salesItems;
}

async function fetchInventoryData(fromDate: string | null, toDate: string | null): Promise<InventoryItem[]> {
  // Fetch products for current stock
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (prodError) throw prodError;

  // Fetch stock movements for the period
  let movementsQuery = supabase
    .from('stock_movements')
    .select('*')
    .order('created_at', { ascending: true });

  if (fromDate) {
    movementsQuery = movementsQuery.gte('created_at', fromDate);
  }
  if (toDate) {
    movementsQuery = movementsQuery.lte('created_at', toDate + 'T23:59:59');
  }

  const { data: movements, error: movError } = await movementsQuery;
  if (movError) throw movError;

  // Aggregate movements by product
  const movementsByProduct: Record<string, { inward: number; outward: number }> = {};
  
  for (const m of movements || []) {
    if (!movementsByProduct[m.product_id]) {
      movementsByProduct[m.product_id] = { inward: 0, outward: 0 };
    }
    // Use 'quantity' field instead of 'quantity_change'
    const qty = m.quantity || 0;
    if (['purchase', 'restock', 'adjustment_add', 'return'].includes(m.movement_type)) {
      movementsByProduct[m.product_id].inward += qty;
    } else if (['sale', 'adjustment_remove', 'damage'].includes(m.movement_type)) {
      movementsByProduct[m.product_id].outward += Math.abs(qty);
    }
  }

  return (products || []).map((p) => {
    const movement = movementsByProduct[p.id] || { inward: 0, outward: 0 };
    const closingStock = p.stock_quantity;
    const openingStock = closingStock - movement.inward + movement.outward;

    return {
      date: formatDate(new Date(), 'yyyy-MM-dd'),
      voucherNo: '-',
      itemName: p.name,
      sku: p.sku || '',
      hsnCode: p.hsn_code || '',
      unit: 'PCS',
      openingStock: openingStock > 0 ? openingStock : 0,
      inwardQty: movement.inward,
      outwardQty: movement.outward,
      closingStock,
      rate: p.price,
      value: closingStock * p.price,
    };
  });
}

async function fetchCustomerData(): Promise<CustomerLedger[]> {
  // Get unique customers from orders with their addresses
  const { data: orders, error } = await supabase
    .from('orders')
    .select('user_id, shipping_address, total_amount')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get profiles for email
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone');

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Aggregate by user
  const customerMap = new Map<string, CustomerLedger>();

  for (const order of orders || []) {
    if (customerMap.has(order.user_id)) continue;

    const address = order.shipping_address as any;
    const profile = profileMap.get(order.user_id);

    customerMap.set(order.user_id, {
      customerName: address?.full_name || profile?.full_name || 'Customer',
      address: address?.address_line1 || '',
      city: address?.city || '',
      state: address?.state || '',
      pincode: address?.pincode || '',
      gstin: '',
      pan: '',
      contactPerson: address?.full_name || '',
      phone: address?.phone || profile?.phone || '',
      email: profile?.email || '',
      openingBalance: 0,
    });
  }

  return Array.from(customerMap.values());
}

async function fetchProductData(): Promise<ProductMaster[]> {
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name)
    `)
    .order('name');

  if (prodError) throw prodError;

  return (products || []).map((p) => ({
    itemName: p.name,
    sku: p.sku || '',
    hsnCode: p.hsn_code || '',
    category: (p.category as any)?.name || '',
    unit: 'PCS',
    gstRate: p.gst_percent || 18,
    openingStock: p.stock_quantity,
    openingValue: p.stock_quantity * p.price,
    mrp: p.mrp || p.price,
    sellingPrice: p.price,
  }));
}

async function fetchGSTSummary(fromDate: string | null, toDate: string | null): Promise<GSTSummaryItem[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .not('status', 'eq', 'cancelled');

  if (fromDate) {
    query = query.gte('created_at', fromDate);
  }
  if (toDate) {
    query = query.lte('created_at', toDate + 'T23:59:59');
  }

  const { data: orders, error } = await query;
  if (error) throw error;

  // Aggregate by HSN code
  const hsnMap = new Map<string, GSTSummaryItem>();

  for (const order of orders || []) {
    for (const item of order.order_items || []) {
      const hsnCode = item.sku?.startsWith('HSN') ? item.sku : 'N/A';
      const gstRate = item.gst_percent || 18;
      const taxableValue = item.total_price / (1 + gstRate / 100);
      const totalGst = item.total_price - taxableValue;

      if (!hsnMap.has(hsnCode)) {
        hsnMap.set(hsnCode, {
          hsnCode,
          description: item.product_name,
          totalQty: 0,
          totalValue: 0,
          taxableValue: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalTax: 0,
        });
      }

      const summary = hsnMap.get(hsnCode)!;
      summary.totalQty += item.quantity;
      summary.totalValue += item.total_price;
      summary.taxableValue += taxableValue;
      summary.cgstAmount += totalGst / 2;
      summary.sgstAmount += totalGst / 2;
      summary.totalTax += totalGst;
    }
  }

  return Array.from(hsnMap.values());
}

function generateGSTSummaryCSV(items: GSTSummaryItem[]): string {
  const headers = [
    'HSN Code',
    'Description',
    'Total Qty',
    'Total Value',
    'Taxable Value',
    'CGST Amount',
    'SGST Amount',
    'IGST Amount',
    'Total Tax',
  ];

  const rows = items.map((item) => [
    item.hsnCode,
    `"${item.description}"`,
    item.totalQty,
    item.totalValue.toFixed(2),
    item.taxableValue.toFixed(2),
    item.cgstAmount.toFixed(2),
    item.sgstAmount.toFixed(2),
    item.igstAmount.toFixed(2),
    item.totalTax.toFixed(2),
  ]);

  // Add totals row
  const totals = items.reduce(
    (acc, item) => ({
      totalQty: acc.totalQty + item.totalQty,
      totalValue: acc.totalValue + item.totalValue,
      taxableValue: acc.taxableValue + item.taxableValue,
      cgstAmount: acc.cgstAmount + item.cgstAmount,
      sgstAmount: acc.sgstAmount + item.sgstAmount,
      igstAmount: acc.igstAmount + item.igstAmount,
      totalTax: acc.totalTax + item.totalTax,
    }),
    { totalQty: 0, totalValue: 0, taxableValue: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0 }
  );

  rows.push([
    'TOTAL',
    '""',
    totals.totalQty,
    totals.totalValue.toFixed(2),
    totals.taxableValue.toFixed(2),
    totals.cgstAmount.toFixed(2),
    totals.sgstAmount.toFixed(2),
    totals.igstAmount.toFixed(2),
    totals.totalTax.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
