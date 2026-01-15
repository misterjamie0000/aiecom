import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  FileSpreadsheet, 
  FileCode, 
  Download, 
  Calendar,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Receipt,
  Loader2,
  Info,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTallyExport, ExportType, ExportFormat } from '@/hooks/useTallyExport';

interface ExportOption {
  id: ExportType;
  name: string;
  description: string;
  icon: React.ElementType;
  formats: ExportFormat[];
  requiresDateRange: boolean;
  tallyImportable: boolean;
}

const exportOptions: ExportOption[] = [
  {
    id: 'sales',
    name: 'Sales Vouchers',
    description: 'Export sales invoices with GST breakup for Tally Sales Voucher import',
    icon: ShoppingCart,
    formats: ['csv', 'xml'],
    requiresDateRange: true,
    tallyImportable: true,
  },
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'Stock summary with opening, inward, outward, and closing quantities',
    icon: Package,
    formats: ['csv'],
    requiresDateRange: true,
    tallyImportable: false,
  },
  {
    id: 'customers',
    name: 'Customer Ledgers',
    description: 'Customer master data for Tally Ledger import',
    icon: Users,
    formats: ['csv', 'xml'],
    requiresDateRange: false,
    tallyImportable: true,
  },
  {
    id: 'products',
    name: 'Product Master',
    description: 'Product catalog with HSN codes and GST rates for Tally Stock Items',
    icon: FileText,
    formats: ['csv', 'xml'],
    requiresDateRange: false,
    tallyImportable: true,
  },
  {
    id: 'gst-summary',
    name: 'GST Summary (HSN-wise)',
    description: 'HSN-wise tax summary for GST returns filing (GSTR-1)',
    icon: Receipt,
    formats: ['csv'],
    requiresDateRange: true,
    tallyImportable: false,
  },
];

const presetRanges = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Last 7 Days', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 Days', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Last Month', getValue: () => ({ 
    from: startOfMonth(subDays(startOfMonth(new Date()), 1)), 
    to: endOfMonth(subDays(startOfMonth(new Date()), 1)) 
  })},
];

export default function ExportCenter() {
  const [selectedExport, setSelectedExport] = useState<ExportType>('sales');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [companyName, setCompanyName] = useState('GlowMart');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const exportMutation = useTallyExport();

  const currentOption = exportOptions.find((o) => o.id === selectedExport)!;

  const handleExport = () => {
    exportMutation.mutate({
      type: selectedExport,
      format: selectedFormat,
      dateRange: currentOption.requiresDateRange ? dateRange : undefined,
      companyName,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Center</h1>
        <p className="text-muted-foreground mt-1">
          Export data in Tally-compatible formats for seamless accounting integration
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Tally Integration:</strong> Export sales, inventory, and customer data in formats 
          that can be directly imported into Tally ERP. XML format is recommended for native Tally import.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Options */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Type</CardTitle>
              <CardDescription>Select what data to export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {exportOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => {
                    setSelectedExport(option.id);
                    if (!option.formats.includes(selectedFormat)) {
                      setSelectedFormat(option.formats[0]);
                    }
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedExport === option.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <option.icon className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.name}</span>
                      {option.tallyImportable && (
                        <Badge variant={selectedExport === option.id ? 'secondary' : 'outline'} className="text-xs">
                          Tally
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${
                      selectedExport === option.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {option.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <currentOption.icon className="w-5 h-5" />
                {currentOption.name}
              </CardTitle>
              <CardDescription>{currentOption.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format Selection */}
              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="flex gap-3">
                  {currentOption.formats.map((fmt) => (
                    <Button
                      key={fmt}
                      variant={selectedFormat === fmt ? 'default' : 'outline'}
                      onClick={() => setSelectedFormat(fmt)}
                      className="flex-1"
                    >
                      {fmt === 'csv' ? (
                        <>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          CSV (Excel/Tally Import)
                        </>
                      ) : (
                        <>
                          <FileCode className="w-4 h-4 mr-2" />
                          XML (Native Tally)
                        </>
                      )}
                    </Button>
                  ))}
                </div>
                {selectedFormat === 'xml' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    XML can be directly imported into Tally using Gateway of Tally → Import Data
                  </p>
                )}
              </div>

              {/* Date Range (if applicable) */}
              {currentOption.requiresDateRange && (
                <div className="space-y-3">
                  <Label>Date Range</Label>
                  
                  {/* Preset Ranges */}
                  <div className="flex flex-wrap gap-2">
                    {presetRanges.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        onClick={() => setDateRange(preset.getValue())}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>

                  {/* Custom Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">From</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Calendar className="w-4 h-4 mr-2" />
                            {format(dateRange.from, 'dd MMM yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">To</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Calendar className="w-4 h-4 mr-2" />
                            {format(dateRange.to, 'dd MMM yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Name (for XML) */}
              {selectedFormat === 'xml' && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name (for Tally)</Label>
                  <div className="flex gap-2">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-2" />
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name as in Tally"
                    />
                  </div>
                </div>
              )}

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="w-full"
                size="lg"
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {currentOption.name}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Tally Import Instructions */}
          {currentOption.tallyImportable && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Import in Tally</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="xml">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="xml">XML Import</TabsTrigger>
                    <TabsTrigger value="csv">CSV Import</TabsTrigger>
                  </TabsList>
                  <TabsContent value="xml" className="space-y-3 mt-4">
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Steps for XML Import:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Open Tally ERP 9 / Tally Prime</li>
                        <li>Go to <strong>Gateway of Tally → Import Data</strong></li>
                        <li>Select the exported XML file</li>
                        <li>Tally will automatically create vouchers/masters</li>
                        <li>Review and accept the imported data</li>
                      </ol>
                    </div>
                  </TabsContent>
                  <TabsContent value="csv" className="space-y-3 mt-4">
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Steps for CSV Import:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Open the CSV file in Excel</li>
                        <li>Review and adjust data if needed</li>
                        <li>In Tally, go to <strong>Gateway of Tally → Import Data</strong></li>
                        <li>Use <strong>Data Import Tool</strong> to map columns</li>
                        <li>Select the CSV file and import</li>
                      </ol>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
