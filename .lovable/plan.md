
# Customer Management Fix & Detail Page

## Problem Identified (समस्या)
The Customers page only shows 1 customer (the admin) because the `profiles` table has RLS policies that only allow users to view their **own** profile. There's no policy for admins to view all customer profiles.

**Database Evidence:**
- Total profiles in database: 2 users
- Current RLS on profiles: `auth.uid() = id` (users can only see themselves)
- Missing: Admin policy to SELECT all profiles

## Solution Overview (समाधान)

### Phase 1: Database Fix - Add Admin RLS Policy
Add a new RLS policy to allow admins to view all customer profiles:
```sql
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Phase 2: Enhanced Customers Hook
Update `src/hooks/useCustomers.ts` to fetch customers with aggregated statistics:
- Total orders count & value
- Cart items count
- Wishlist items count  
- Loyalty points balance
- Reviews count
- Return requests count
- Total addresses

### Phase 3: Update Customers List Page
Enhance `src/pages/admin/Customers.tsx`:
- Add summary statistics columns (Total Orders, Total Spent, etc.)
- Add clickable row to navigate to detail page
- Add "View Details" button for each customer
- Show customer status badges (Active, New, VIP based on order value)

### Phase 4: Create Customer Detail Page
Create `src/pages/admin/CustomerDetail.tsx` with tabs for:

**Tab 1: Overview**
- Customer profile info (name, email, phone, avatar)
- Account statistics cards (Total Orders, Total Spent, Loyalty Points, etc.)
- Recent activity timeline

**Tab 2: Orders**
- Full order history table with status, amount, date
- Order tracking timeline component (reuse existing)
- Quick actions (view order, cancel, etc.)

**Tab 3: Cart & Wishlist**
- Current cart items with product details
- Wishlist items with product info
- Price tracking (if products are on sale)

**Tab 4: Addresses**
- All saved addresses
- Default address highlighted
- Address type badges (Home, Work, Other)

**Tab 5: Activity**
- Recently viewed products
- Search history
- Review history with ratings
- Return/Replacement requests

**Tab 6: Loyalty**
- Points balance
- Points transaction history
- Tier status (if applicable)

### Phase 5: Add Route for Customer Detail
Update `src/App.tsx`:
```tsx
<Route path="customers/:customerId" element={<AdminCustomerDetail />} />
```

---

## Technical Details

### Files to Create:
1. `src/pages/admin/CustomerDetail.tsx` - Main customer detail page with tabs

### Files to Modify:
1. `src/hooks/useCustomers.ts` - Add hooks for customer detail data
2. `src/pages/admin/Customers.tsx` - Add statistics columns and detail link
3. `src/App.tsx` - Add customer detail route

### Database Migration:
```sql
-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Customer Detail Hook Structure:
```typescript
// New hooks to add
export function useCustomer(customerId: string) // Single customer profile
export function useCustomerOrders(customerId: string) // Customer's orders
export function useCustomerCart(customerId: string) // Customer's cart items
export function useCustomerWishlist(customerId: string) // Customer's wishlist
export function useCustomerAddresses(customerId: string) // Customer's addresses
export function useCustomerLoyalty(customerId: string) // Customer's loyalty points
export function useCustomerReviews(customerId: string) // Customer's reviews
export function useCustomerStats(customerId: string) // Aggregated stats
```

### UI Components Used:
- Tabs component for different sections
- Card components for statistics
- Table components for order history
- Avatar and Badge for customer info
- OrderTrackingTimeline (existing) for order status
