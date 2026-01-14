import { useState } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  gst_percent: number;
  sku?: string | null;
}

interface ShippingAddress {
  full_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  payment_method?: string | null;
  payment_status: string;
  shipping_address: ShippingAddress;
  billing_address?: ShippingAddress | null;
}

interface InvoiceDownloadProps {
  order: Order;
  orderItems: OrderItem[];
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyGstin?: string;
}

export default function InvoiceDownload({
  order,
  orderItems,
  companyName = 'ShopBloom',
  companyAddress = '123 Business Street, City, State - 123456',
  companyPhone = '+91 1234567890',
  companyEmail = 'support@shopbloom.com',
  companyGstin = 'GSTIN123456789',
}: InvoiceDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Company Header with branding
      doc.setFillColor(79, 70, 229); // Primary color
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(companyAddress, 20, 33);
      doc.text(`Phone: ${companyPhone} | Email: ${companyEmail}`, 20, 40);

      // Invoice Title
      yPos = 60;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' });

      // Invoice Details Box
      yPos = 75;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos, pageWidth - 30, 25, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, yPos, pageWidth - 30, 25, 'S');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: INV-${order.order_number}`, 20, yPos + 10);
      doc.text(`Order No: ${order.order_number}`, 20, yPos + 18);
      doc.text(`Date: ${format(new Date(order.created_at), 'dd MMM yyyy')}`, pageWidth - 20, yPos + 10, { align: 'right' });
      doc.text(`GSTIN: ${companyGstin}`, pageWidth - 20, yPos + 18, { align: 'right' });

      // Billing & Shipping Address
      yPos = 110;
      const colWidth = (pageWidth - 40) / 2;

      // Shipping Address
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Ship To:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const shipping = order.shipping_address;
      doc.text(shipping?.full_name || '', 20, yPos + 8);
      doc.text(shipping?.address_line1 || '', 20, yPos + 14);
      if (shipping?.address_line2) {
        doc.text(shipping.address_line2, 20, yPos + 20);
      }
      doc.text(`${shipping?.city || ''}, ${shipping?.state || ''} - ${shipping?.pincode || ''}`, 20, yPos + 26);
      if (shipping?.phone) {
        doc.text(`Phone: ${shipping.phone}`, 20, yPos + 32);
      }

      // Billing Address
      const billing = order.billing_address || order.shipping_address;
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20 + colWidth + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(billing?.full_name || '', 20 + colWidth + 10, yPos + 8);
      doc.text(billing?.address_line1 || '', 20 + colWidth + 10, yPos + 14);
      if (billing?.address_line2) {
        doc.text(billing.address_line2, 20 + colWidth + 10, yPos + 20);
      }
      doc.text(`${billing?.city || ''}, ${billing?.state || ''} - ${billing?.pincode || ''}`, 20 + colWidth + 10, yPos + 26);

      // Items Table Header
      yPos = 155;
      doc.setFillColor(79, 70, 229);
      doc.rect(15, yPos, pageWidth - 30, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('S.No', 20, yPos + 7);
      doc.text('Product', 35, yPos + 7);
      doc.text('Qty', 115, yPos + 7);
      doc.text('Rate', 135, yPos + 7);
      doc.text('GST %', 155, yPos + 7);
      doc.text('Amount', pageWidth - 20, yPos + 7, { align: 'right' });

      // Items
      yPos = 168;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      orderItems.forEach((item, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
        }
        
        doc.text(String(index + 1), 20, yPos);
        
        // Truncate long product names
        const productName = item.product_name.length > 40 
          ? item.product_name.substring(0, 37) + '...' 
          : item.product_name;
        doc.text(productName, 35, yPos);
        doc.text(String(item.quantity), 115, yPos);
        doc.text(`₹${item.unit_price.toLocaleString()}`, 135, yPos);
        doc.text(`${item.gst_percent}%`, 155, yPos);
        doc.text(`₹${item.total_price.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
        
        yPos += 10;
      });

      // Summary Box
      yPos += 10;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, yPos, pageWidth - 15, yPos);
      
      yPos += 10;
      const summaryX = pageWidth - 80;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', summaryX, yPos);
      doc.text(`₹${order.subtotal.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
      
      if (order.discount_amount > 0) {
        yPos += 8;
        doc.setTextColor(34, 197, 94);
        doc.text('Discount:', summaryX, yPos);
        doc.text(`-₹${order.discount_amount.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }
      
      yPos += 8;
      doc.text('Shipping:', summaryX, yPos);
      doc.text(`₹${order.shipping_amount.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
      
      if (order.cgst_amount > 0) {
        yPos += 8;
        doc.text('CGST:', summaryX, yPos);
        doc.text(`₹${order.cgst_amount.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
      }
      
      if (order.sgst_amount > 0) {
        yPos += 8;
        doc.text('SGST:', summaryX, yPos);
        doc.text(`₹${order.sgst_amount.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
      }
      
      if (order.igst_amount > 0) {
        yPos += 8;
        doc.text('IGST:', summaryX, yPos);
        doc.text(`₹${order.igst_amount.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
      }
      
      // Total
      yPos += 12;
      doc.setFillColor(79, 70, 229);
      doc.rect(summaryX - 10, yPos - 6, pageWidth - summaryX + 5, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Total:', summaryX, yPos + 2);
      doc.text(`₹${order.total_amount.toLocaleString()}`, pageWidth - 20, yPos + 2, { align: 'right' });

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 25;
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Thank you for shopping with us!', pageWidth / 2, footerY, { align: 'center' });
      doc.text('This is a computer generated invoice and does not require a signature.', pageWidth / 2, footerY + 6, { align: 'center' });
      doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth / 2, footerY + 12, { align: 'center' });

      // Save PDF
      doc.save(`Invoice-${order.order_number}.pdf`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="rounded-full"
      onClick={generatePDF}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download Invoice
        </>
      )}
    </Button>
  );
}
