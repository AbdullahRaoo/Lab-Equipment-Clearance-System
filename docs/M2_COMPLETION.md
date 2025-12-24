# Stage 1 - M2 (Waleed) - Lab 1 & Lab 2 Setup

## Completed Tasks ✅

### 1. Lab Schemas Creation
- Created `lab1` and `lab2` PostgreSQL schemas
- Established proper schema structure and organization

### 2. Inventory Tables
- Designed flexible inventory structure with JSONB metadata
- Support for equipment tracking with multiple states (available, borrowed, maintenance, damaged, retired)
- Equipment condition tracking
- Borrower tracking with timestamps
- Location and purchase information

**Key Fields:**
- `equipment_code`: Unique identifier
- `metadata`: JSONB for flexible equipment properties (manufacturer, model, serial number, specs)
- `status`: Equipment availability status
- `condition`: Physical condition rating
- `current_borrower_id`: Links to central.users
- `borrowed_at`, `expected_return_date`: Borrowing workflow

### 3. Issues Tables
- Track equipment problems and damage reports
- Multiple issue types: damage, malfunction, lost, late_return, other
- Severity levels: low, medium, high, critical
- Resolution workflow with assignment tracking
- Financial tracking: damage costs and fines
- Attachment support via JSONB array

### 4. Returns Tables
- Equipment return workflow management
- Overdue tracking with automatic late fee calculation
- Condition inspection on return
- Status tracking: pending, returned, overdue, lost
- Link to borrower and equipment records

### 5. Performance Indexes
**Lab 1 Indexes:**
- Inventory: status, category, borrower, code, metadata (GIN)
- Issues: equipment, reporter, status, type, created_at
- Returns: equipment, borrower, status, expected_date, created_at

**Lab 2 Indexes:**
- Same comprehensive indexing structure as Lab 1
- Optimized for common query patterns

### 6. Auto-Update Triggers
- Timestamp triggers for all tables
- Automatic `updated_at` column maintenance
- Uses shared `central.update_updated_at_column()` function

### 7. Row Level Security (RLS)
**Inventory Policies:**
- Everyone can view inventory
- Lab admins can insert/update/delete
- Role-based access control

**Issues Policies:**
- Everyone can view issues
- Authenticated users can report issues
- Lab admins and reporters can update

**Returns Policies:**
- Users view their own returns
- Lab admins view all returns
- Controlled update access

### 8. Helper Functions
- `get_available_equipment_count()`: Count available equipment
- `get_user_borrowed_equipment()`: Get user's current borrows
- `get_overdue_returns()`: List overdue equipment

### 9. Sample Data
Included test data for both labs:
- Lab 1: Oscilloscope, Function Generator, Digital Caliper
- Lab 2: Power Supply, pH Meter, Multimeter

### 10. TypeScript Types
Created comprehensive type definitions:
- Equipment, Issue, Return interfaces
- Status and condition enums
- Extended types with relations
- API request/response types

### 11. Server Actions
**Inventory Actions:**
- `getLabInventory()`: Fetch all equipment
- `getAvailableEquipment()`: Filter available items
- `borrowEquipment()`: Handle borrowing workflow
- `returnEquipment()`: Process returns with late fee calculation

**Issue Actions:**
- `createIssue()`: Report equipment issues
- `getLabIssues()`: Fetch all issues
- `resolveIssue()`: Close issues with resolution

**Return Actions:**
- `getUserReturns()`: User's return history
- `getLabReturns()`: All lab returns

### 12. Frontend Pages
- Lab 1 Dashboard with stats and recent equipment
- Lab 2 Dashboard with stats and recent equipment
- Updated main dashboard with lab access links
- Responsive tables and status badges

## Files Created

### Database Scripts:
- `database/03_lab1_lab2_schemas.sql` - Schema and table definitions
- `database/04_lab1_lab2_rls.sql` - Security policies and helper functions

### TypeScript:
- `src/types/lab.ts` - Type definitions
- `src/app/actions/lab.ts` - Server actions
- `src/app/labs/lab1/page.tsx` - Lab 1 UI
- `src/app/labs/lab2/page.tsx` - Lab 2 UI

## Next Steps

**For M3:** Lab 3, 4, 5 schemas with similar structure
**For M4:** Cross-schema query functions and clearance logic
**Stage 2:** Triggers for status updates and business logic
