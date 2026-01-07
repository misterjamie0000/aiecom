import { FileText } from 'lucide-react';

export default function AdminPages() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">CMS Pages</h1>
      <p className="text-muted-foreground">Page management coming soon.</p>
    </div>
  );
}
