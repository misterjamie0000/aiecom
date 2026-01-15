import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InventoryExportItem {
  sku: string;
  name: string;
  current_stock: number;
  low_stock_threshold: number;
  category: string;
}

export interface InventoryImportItem {
  sku: string;
  stock_quantity: number;
  adjustment_type: 'set' | 'add' | 'subtract';
}

export function useExportInventoryCsv() {
  return useMutation({
    mutationFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, low_stock_threshold, categories(name)')
        .order('name');
      
      if (error) throw error;
      
      const csvContent = generateCsv(products || []);
      downloadCsv(csvContent, `inventory-export-${new Date().toISOString().split('T')[0]}.csv`);
      
      return products?.length || 0;
    },
    onSuccess: (count) => {
      toast.success(`Exported ${count} products to CSV`);
    },
    onError: (error) => {
      toast.error('Failed to export inventory: ' + error.message);
    },
  });
}

export function useImportInventoryCsv() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const items = parseCsv(text);
      
      if (items.length === 0) {
        throw new Error('No valid items found in CSV');
      }
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (const item of items) {
        try {
          // Find product by SKU
          const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('id, stock_quantity')
            .eq('sku', item.sku)
            .single();
          
          if (fetchError || !product) {
            errors.push(`SKU "${item.sku}": Product not found`);
            errorCount++;
            continue;
          }
          
          let newQuantity: number;
          const previousQuantity = product.stock_quantity;
          
          switch (item.adjustment_type) {
            case 'set':
              newQuantity = item.stock_quantity;
              break;
            case 'add':
              newQuantity = previousQuantity + item.stock_quantity;
              break;
            case 'subtract':
              newQuantity = previousQuantity - item.stock_quantity;
              break;
            default:
              newQuantity = item.stock_quantity;
          }
          
          if (newQuantity < 0) {
            errors.push(`SKU "${item.sku}": Would result in negative stock`);
            errorCount++;
            continue;
          }
          
          // Insert stock movement record
          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert({
              product_id: product.id,
              movement_type: 'adjustment',
              quantity: newQuantity - previousQuantity,
              previous_quantity: previousQuantity,
              new_quantity: newQuantity,
              reason: `CSV Import (${item.adjustment_type})`,
            });
          
          if (movementError) {
            errors.push(`SKU "${item.sku}": Failed to record movement`);
            errorCount++;
            continue;
          }
          
          // Update product stock
          const { error: updateError } = await supabase
            .from('products')
            .update({ stock_quantity: newQuantity })
            .eq('id', product.id);
          
          if (updateError) {
            errors.push(`SKU "${item.sku}": Failed to update stock`);
            errorCount++;
            continue;
          }
          
          successCount++;
        } catch (err) {
          errors.push(`SKU "${item.sku}": ${err instanceof Error ? err.message : 'Unknown error'}`);
          errorCount++;
        }
      }
      
      return { successCount, errorCount, errors, totalItems: items.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      
      if (result.errorCount === 0) {
        toast.success(`Successfully imported ${result.successCount} stock updates`);
      } else {
        toast.warning(`Imported ${result.successCount} of ${result.totalItems} items. ${result.errorCount} errors.`);
      }
    },
    onError: (error) => {
      toast.error('Failed to import CSV: ' + error.message);
    },
  });
}

function generateCsv(products: any[]): string {
  const headers = ['SKU', 'Product Name', 'Current Stock', 'Low Stock Threshold', 'Category', 'Adjustment Type', 'New Stock'];
  const rows = products.map(p => [
    p.sku || '',
    p.name,
    p.stock_quantity.toString(),
    p.low_stock_threshold.toString(),
    p.categories?.name || '',
    'set', // Default adjustment type for import template
    p.stock_quantity.toString(), // Default to current stock for import template
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): InventoryImportItem[] {
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return [];
  }
  
  // Parse header row
  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
  
  // Find column indices
  const skuIndex = headers.findIndex(h => h.includes('sku'));
  const adjustmentTypeIndex = headers.findIndex(h => h.includes('adjustment') && h.includes('type'));
  const newStockIndex = headers.findIndex(h => h.includes('new') && h.includes('stock'));
  const stockIndex = headers.findIndex(h => h.includes('stock') && !h.includes('threshold') && !h.includes('new') && !h.includes('low'));
  
  if (skuIndex === -1) {
    throw new Error('CSV must have a "SKU" column');
  }
  
  // Determine which stock column to use
  const stockColumnIndex = newStockIndex !== -1 ? newStockIndex : stockIndex;
  
  if (stockColumnIndex === -1) {
    throw new Error('CSV must have a "New Stock" or "Stock" column');
  }
  
  const items: InventoryImportItem[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    
    if (values.length <= Math.max(skuIndex, stockColumnIndex)) {
      continue;
    }
    
    const sku = values[skuIndex]?.trim();
    const stockValue = parseInt(values[stockColumnIndex]?.trim() || '0');
    
    if (!sku || isNaN(stockValue)) {
      continue;
    }
    
    let adjustmentType: 'set' | 'add' | 'subtract' = 'set';
    if (adjustmentTypeIndex !== -1 && values[adjustmentTypeIndex]) {
      const typeValue = values[adjustmentTypeIndex].toLowerCase().trim();
      if (typeValue === 'add' || typeValue === '+') {
        adjustmentType = 'add';
      } else if (typeValue === 'subtract' || typeValue === '-') {
        adjustmentType = 'subtract';
      }
    }
    
    items.push({
      sku,
      stock_quantity: stockValue,
      adjustment_type: adjustmentType,
    });
  }
  
  return items;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  result.push(current);
  return result;
}

export function generateImportTemplate(): string {
  const headers = ['SKU', 'Adjustment Type', 'New Stock'];
  const exampleRows = [
    ['EXAMPLE-SKU-001', 'set', '100'],
    ['EXAMPLE-SKU-002', 'add', '50'],
    ['EXAMPLE-SKU-003', 'subtract', '10'],
  ];
  
  const instructions = [
    '# Instructions:',
    '# 1. SKU column is required - must match existing product SKUs',
    '# 2. Adjustment Type: "set" (replace stock), "add" (increase), "subtract" (decrease)',
    '# 3. New Stock: The quantity value for the adjustment',
    '# 4. Delete these instruction rows before importing',
    '',
  ];
  
  const csvData = [headers, ...exampleRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return instructions.join('\n') + csvData;
}

export function downloadImportTemplate(): void {
  const content = generateImportTemplate();
  downloadCsv(content, 'inventory-import-template.csv');
  toast.success('Import template downloaded');
}
