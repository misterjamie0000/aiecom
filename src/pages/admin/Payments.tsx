import { CreditCard } from 'lucide-react';

export default function AdminPayments() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <CreditCard className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Payments</h1>
      <p className="text-muted-foreground">Payment management coming soon.</p>
    </div>
  );
}
