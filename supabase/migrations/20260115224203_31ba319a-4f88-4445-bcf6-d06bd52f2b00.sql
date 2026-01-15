-- Fix search_path for functions
ALTER FUNCTION generate_po_number() SET search_path = public;
ALTER FUNCTION update_inventory_on_po_receive() SET search_path = public;
ALTER FUNCTION update_po_totals() SET search_path = public;