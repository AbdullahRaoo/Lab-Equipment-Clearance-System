-- Add quantity columns to support bulk items
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 20;

-- Add quantity_requested to borrow_request_items
ALTER TABLE public.borrow_request_items ADD COLUMN IF NOT EXISTS quantity_requested INTEGER DEFAULT 1;

-- Optional: Update existing items to have quantity 20 (handled by DEFAULT 20, but safe to be explicit if nulls exist)
UPDATE public.inventory SET quantity = 20 WHERE quantity IS NULL OR quantity = 1;
UPDATE public.borrow_request_items SET quantity_requested = 1 WHERE quantity_requested IS NULL;
