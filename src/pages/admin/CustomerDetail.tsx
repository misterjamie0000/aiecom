import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ShoppingBag, Heart, MapPin, Clock, Gift, Star, RotateCcw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useCustomer, 
  useCustomerStats 
} from '@/hooks/useCustomers';

// Tab Components
import CustomerOverviewTab from '@/components/admin/customer/CustomerOverviewTab';
import CustomerOrdersTab from '@/components/admin/customer/CustomerOrdersTab';
import CustomerCartWishlistTab from '@/components/admin/customer/CustomerCartWishlistTab';
import CustomerAddressesTab from '@/components/admin/customer/CustomerAddressesTab';
import CustomerActivityTab from '@/components/admin/customer/CustomerActivityTab';
import CustomerLoyaltyTab from '@/components/admin/customer/CustomerLoyaltyTab';

export default function AdminCustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  
  const { data: customer, isLoading: customerLoading } = useCustomer(customerId || '');
  const { data: stats, isLoading: statsLoading } = useCustomerStats(customerId || '');

  if (customerLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="link" onClick={() => navigate('/admin/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/customers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{customer.full_name || 'No Name'}</h1>
          <p className="text-muted-foreground">{customer.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="cart-wishlist" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart & Wishlist</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Addresses</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Loyalty</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CustomerOverviewTab customer={customer} stats={stats} />
        </TabsContent>

        <TabsContent value="orders">
          <CustomerOrdersTab customerId={customerId || ''} />
        </TabsContent>

        <TabsContent value="cart-wishlist">
          <CustomerCartWishlistTab customerId={customerId || ''} />
        </TabsContent>

        <TabsContent value="addresses">
          <CustomerAddressesTab customerId={customerId || ''} />
        </TabsContent>

        <TabsContent value="activity">
          <CustomerActivityTab customerId={customerId || ''} />
        </TabsContent>

        <TabsContent value="loyalty">
          <CustomerLoyaltyTab customerId={customerId || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
