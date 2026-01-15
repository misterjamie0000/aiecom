import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AddressData {
  id?: string;
  fullName: string;
  phone: string;
  alternativePhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

interface CheckoutAddressSectionProps {
  onContinue: (address: AddressData) => void;
}

const initialAddress: AddressData = {
  fullName: '',
  phone: '',
  alternativePhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
};

export default function CheckoutAddressSection({ onContinue }: CheckoutAddressSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressData>(initialAddress);
  const [saveAddress, setSaveAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch saved addresses
  const { data: savedAddresses = [], isLoading } = useQuery({
    queryKey: ['checkout-addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Auto-select first address
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId && !showForm) {
      setSelectedAddressId(savedAddresses[0].id);
    }
  }, [savedAddresses, selectedAddressId, showForm]);

  // Save address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: AddressData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const payload = {
        user_id: user.id,
        full_name: addressData.fullName,
        phone: addressData.phone,
        alternative_phone: addressData.alternativePhone || null,
        address_line1: addressData.addressLine1,
        address_line2: addressData.addressLine2 || null,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        country: 'India',
        is_default: savedAddresses.length === 0,
      };

      if (editingId) {
        const { error } = await supabase
          .from('addresses')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        return editingId;
      } else {
        const { data, error } = await supabase
          .from('addresses')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: (addressId) => {
      queryClient.invalidateQueries({ queryKey: ['checkout-addresses'] });
      toast.success(editingId ? 'Address updated!' : 'Address saved!');
      setSelectedAddressId(addressId);
      setShowForm(false);
      setEditingId(null);
      setAddress(initialAddress);
    },
    onError: (error: Error) => {
      toast.error('Failed to save address: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saveAddress) {
      saveAddressMutation.mutate(address);
    } else {
      onContinue(address);
    }
  };

  const handleContinueWithSelected = () => {
    const selected = savedAddresses.find(a => a.id === selectedAddressId);
    if (selected) {
      onContinue({
        id: selected.id,
        fullName: selected.full_name,
        phone: selected.phone,
        alternativePhone: selected.alternative_phone || '',
        addressLine1: selected.address_line1,
        addressLine2: selected.address_line2 || '',
        city: selected.city,
        state: selected.state,
        pincode: selected.pincode,
      });
    }
  };

  const handleEditAddress = (addr: typeof savedAddresses[0]) => {
    setAddress({
      id: addr.id,
      fullName: addr.full_name,
      phone: addr.phone,
      alternativePhone: addr.alternative_phone || '',
      addressLine1: addr.address_line1,
      addressLine2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setAddress(initialAddress);
    setEditingId(null);
    setShowForm(true);
  };

  const handlePrevAddress = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextAddress = () => {
    setCurrentIndex(prev => Math.min(savedAddresses.length - 1, prev + 1));
  };

  // Update selected when swiping
  useEffect(() => {
    if (savedAddresses[currentIndex]) {
      setSelectedAddressId(savedAddresses[currentIndex].id);
    }
  }, [currentIndex, savedAddresses]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // Show saved addresses or form
  if (savedAddresses.length > 0 && !showForm) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Select Delivery Address
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Add New
            </Button>
          </CardHeader>
          <CardContent>
            {/* Address Carousel */}
            <div className="relative">
              {savedAddresses.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 bg-background shadow-md rounded-full h-8 w-8"
                    onClick={handlePrevAddress}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 bg-background shadow-md rounded-full h-8 w-8"
                    onClick={handleNextAddress}
                    disabled={currentIndex === savedAddresses.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              <div className="overflow-hidden px-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                  >
                    {savedAddresses[currentIndex] && (
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === savedAddresses[currentIndex].id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedAddressId(savedAddresses[currentIndex].id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{savedAddresses[currentIndex].full_name}</p>
                              {savedAddresses[currentIndex].is_default && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {savedAddresses[currentIndex].phone}
                              {savedAddresses[currentIndex].alternative_phone && (
                                <>, {savedAddresses[currentIndex].alternative_phone}</>
                              )}
                            </p>
                            <p className="text-sm mt-1">
                              {savedAddresses[currentIndex].address_line1}
                              {savedAddresses[currentIndex].address_line2 && (
                                <>, {savedAddresses[currentIndex].address_line2}</>
                              )}
                            </p>
                            <p className="text-sm">
                              {savedAddresses[currentIndex].city}, {savedAddresses[currentIndex].state} - {savedAddresses[currentIndex].pincode}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAddress(savedAddresses[currentIndex]);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {selectedAddressId === savedAddresses[currentIndex].id && (
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Pagination dots */}
              {savedAddresses.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {savedAddresses.map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                      onClick={() => setCurrentIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            <Button 
              className="w-full mt-6" 
              size="lg" 
              onClick={handleContinueWithSelected}
              disabled={!selectedAddressId}
            >
              Continue to Payment
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show address form
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {editingId ? 'Edit Address' : savedAddresses.length > 0 ? 'Add New Address' : 'Delivery Address'}
          </CardTitle>
          {savedAddresses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setAddress(initialAddress);
              }}
            >
              ← Back to saved addresses
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternativePhone">Alternative Phone (Optional)</Label>
              <Input
                id="alternativePhone"
                type="tel"
                value={address.alternativePhone}
                onChange={(e) => setAddress({ ...address, alternativePhone: e.target.value })}
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1 *</Label>
              <Input
                id="addressLine1"
                value={address.addressLine1}
                onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                placeholder="House/Flat No., Building Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={address.addressLine2}
                onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                placeholder="Street, Area, Landmark"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  pattern="[0-9]{6}"
                  required
                />
              </div>
            </div>

            {/* Save address checkbox */}
            {!editingId && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="saveAddress"
                  checked={saveAddress}
                  onCheckedChange={(checked) => setSaveAddress(checked === true)}
                />
                <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
                  Save this address for future orders
                </Label>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={saveAddressMutation.isPending}
            >
              {saveAddressMutation.isPending 
                ? 'Saving...' 
                : editingId 
                  ? 'Update & Continue' 
                  : saveAddress 
                    ? 'Save & Continue to Payment' 
                    : 'Continue to Payment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
