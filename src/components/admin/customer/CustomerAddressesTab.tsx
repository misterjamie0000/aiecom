import { MapPin, Home, Briefcase, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerAddresses } from '@/hooks/useCustomers';

interface CustomerAddressesTabProps {
  customerId: string;
}

const addressTypeIcons: Record<string, React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  work: <Briefcase className="h-4 w-4" />,
  office: <Building className="h-4 w-4" />,
};

export default function CustomerAddressesTab({ customerId }: CustomerAddressesTabProps) {
  const { data: addresses, isLoading } = useCustomerAddresses(customerId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (!addresses?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No addresses saved</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {addresses.map((address) => (
        <Card key={address.id} className={address.is_default ? 'ring-2 ring-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                {addressTypeIcons[address.address_type?.toLowerCase() || ''] || <MapPin className="h-4 w-4" />}
                <span className="capitalize">{address.address_type || 'Address'}</span>
              </div>
              <div className="flex gap-2">
                {address.is_default && <Badge>Default</Badge>}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{address.full_name}</p>
              <p>{address.address_line1}</p>
              {address.address_line2 && <p>{address.address_line2}</p>}
              <p>{address.city}, {address.state} - {address.pincode}</p>
              <p>{address.country}</p>
              <div className="pt-2 space-y-1 text-muted-foreground">
                <p>Phone: {address.phone}</p>
                {address.alternative_phone && (
                  <p>Alt Phone: {address.alternative_phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
