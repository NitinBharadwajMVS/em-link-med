# Backend Upgrade Changelog - Full Hospital-Ambulance-Patient IoT Integration

## Summary
Complete backend overhaul implementing a relational Supabase schema where patients, alerts, hospitals, ambulances, and IoT devices are fully linked with automatic hospital transfer sync and real-time vitals streaming.

---

## 1️⃣ Database Schema Changes

### New Tables Created
- **`patients`** - Central patient records table
  - `id` (uuid, PK)
  - `name`, `age`, `gender`, `contact`, `complaint`
  - `triage_level` (critical/urgent/stable)
  - `vitals` (jsonb)
  - `medical_history` (text[])
  - `current_hospital_id` (text, FK → hospitals.id)
  - `ambulance_id` (text, FK → ambulances.id)
  - `created_at`, `updated_at` (timestamptz)
  - **RLS Policies**: Ambulances see their patients, hospitals see patients at their facility, admins see all

### Table Alterations
- **`alerts`**
  - Added `patient_id` (uuid, FK → patients.id ON DELETE CASCADE)
  - Kept `patient_name` and other patient fields for historical snapshots
  - Now references patient record instead of duplicating all data

- **`ambulances`**
  - Added `device_id` (text, UNIQUE, FK → live_vitals.device_id)
  - Links ambulance to specific IoT sensor device

- **`live_vitals`**
  - Added `ambulance_id` (text, FK → ambulances.id)
  - Bidirectional mapping with ambulances via device_id

### Triggers Created
- **`update_alert_on_hospital_change`**
  - Fires AFTER UPDATE on `patients.current_hospital_id`
  - Automatically updates all pending/acknowledged alerts for that patient:
    - Sets `alerts.hospital_id = NEW.current_hospital_id`
    - Updates `updated_at = now()`
    - Appends audit log entry with hospital transfer details (from, to, timestamp, event: 'hospital_transfer')
  - Ensures hospital changes propagate instantly without manual alert updates

---

## 2️⃣ Authentication & Credentials Update

### Hospital Login Updates
- **Default password changed to `12345678`** for all hospitals
- Format: `username@internal.example` / `12345678`
- Examples:
  - Fortis: `fortis@internal.example` / `12345678`
  - Apollo: `apollo@internal.example` / `12345678`
  - All other hospitals follow same pattern

### Updated Files
- `supabase/functions/seed-database/index.ts`
  - Line 83: Changed from `${shortname}@123` to `'12345678'`

---

## 3️⃣ Application Logic Changes

### AppContext.tsx - Core Changes
**Function Signature Updates:**
- `addPatient(patient: Patient): Promise<string>` - Now returns patient UUID from DB
- `updatePatient(patientId: string, updates: Partial<Patient>): Promise<void>` - New function
- `sendAlert(patientId: string, ...)` - Now takes patientId instead of full Patient object
- `changeHospital(patientId: string, newHospitalId, reason)` - Updates patient record, trigger handles alerts

**Implementation Details:**
- **addPatient**: Inserts into `patients` table, links to `ambulance_id`, returns DB-generated UUID
- **sendAlert**: 
  1. Updates `patients.current_hospital_id`
  2. Fetches patient data from DB
  3. Creates alert with `patient_id` reference
  4. Includes patient snapshot fields for historical record
- **changeHospital**: Simply updates `patients.current_hospital_id` - the trigger propagates changes to all related alerts automatically
- **Load patients**: Fetches patients for current ambulance on mount

### PatientForm.tsx - Workflow Updates
**New Patient Flow:**
1. Create patient in DB via `addPatient()` → get UUID
2. Send alert with `patientId` instead of full object
3. Patient record links to ambulance via `ambulance_id`

**Existing Patient Flow:**
1. Select patient from DB
2. Update vitals/triage via `updatePatient()`
3. Send new alert referencing same `patient_id`

**Key Changes:**
- Line 21: Added `updatePatient` from context
- Lines 44-125: Refactored to use patient UUID workflow
- Handles errors for both patient creation and alert sending

### LiveVitalsDisplay.tsx - IoT Integration
**New Features:**
- Automatically detects `device_id` linked to current ambulance
- Subscribes to real-time `live_vitals` updates for that device
- Falls back to simulated data if no device linked
- Displays device ID in UI when connected

**Implementation:**
- Lines 11-43: Device detection logic
- Lines 45-89: Real-time Supabase subscription to `live_vitals` table filtered by `device_id`
- Lines 91-107: Simulated fallback mode
- UI indicator shows yellow dots for simulated, green for live device

---

## 4️⃣ IoT Device Linkage

### Device-to-Ambulance Mapping
- Each ambulance can have ONE `device_id` linked
- `live_vitals` updates are filtered by this `device_id`
- Real-time subscription ensures instant vitals display in ambulance UI
- Vitals snapshot stored in `alerts.vitals` when pre-alert sent

### Hospital Real-Time Dashboard
- Hospitals receive alerts with vitals snapshot
- If ambulance updates vitals before drop-off, hospital sees updated values via real-time alert updates
- No need for separate vitals streaming to hospital - handled through alert updates

---

## 5️⃣ Security & Access Control

### Row Level Security (RLS) Policies

**patients table:**
- Ambulances: SELECT/ALL on own patients (`ambulance_id` match)
- Hospitals: SELECT on patients at their facility (`current_hospital_id` match)
- Admins: SELECT all

**alerts table:**
- Hospitals: SELECT alerts where `hospital_id` matches
- Ambulances: SELECT alerts where `ambulance_id` matches
- Both: UPDATE relevant alerts

**Maintained Existing:**
- `hospitals`: Public SELECT, authenticated INSERT/UPDATE
- `ambulances`: Public SELECT, authenticated ALL
- `live_vitals`: Public SELECT, authenticated ALL
- `app_users`: RLS already in place for admin/user views

---

## 6️⃣ Preserved Functionality

### Existing Features Maintained
✅ Enlarged hospital list UI with distance/ETA display  
✅ "Manipal Whitefield" exclusion in seed script  
✅ Real-time alert subscriptions filtered by `hospital_id`  
✅ Hospital and ambulance login via `app_users` mapping  
✅ Admin (hos1) sees all alerts  
✅ Audit log tracking for all status changes  
✅ Complete case workflow  
✅ Mark hospital unavailable  

---

## 7️⃣ Files Modified

### Supabase Migrations
- `20251112_patients_table.sql` - Created patients table, added patient_id to alerts, device_id linkage, hospital change trigger
- `20251112_fix_search_path.sql` - Fixed security warning for update_timestamp function

### Edge Functions
- `supabase/functions/seed-database/index.ts` - Updated hospital password to `12345678`

### Application Code
- `src/contexts/AppContext.tsx` - Patient CRUD, updated sendAlert/changeHospital signatures, patient loading
- `src/components/ambulance/PatientForm.tsx` - Refactored to use patient UUID workflow
- `src/components/ambulance/LiveVitalsDisplay.tsx` - IoT device integration with real-time vitals

---

## 8️⃣ Database Verification SQL

```sql
-- Check patients table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients';

-- Check device linkage
SELECT a.id, a.ambulance_number, a.device_id, lv.spo2_pct, lv.hr_bpm
FROM ambulances a
LEFT JOIN live_vitals lv ON a.device_id = lv.device_id;

-- Check patient-alert linkage
SELECT p.name, p.triage_level, a.status, a.hospital_id
FROM patients p
JOIN alerts a ON p.id = a.patient_id;

-- Check trigger function exists
SELECT proname FROM pg_proc WHERE proname = 'update_alert_on_hospital_change';
```

---

## 9️⃣ Testing Checklist

### End-to-End Flow Test
1. ✅ Login as ambulance (amb1 / 1234)
2. ✅ Create new patient with vitals
3. ✅ Send pre-alert to hospital → patient gets UUID, alert links via `patient_id`
4. ✅ Login as hospital → see alert with patient details
5. ✅ Change hospital in ambulance UI → trigger updates alert automatically
6. ✅ Check audit log has "hospital_transfer" event
7. ✅ Verify live vitals display shows device_id (simulated if no device)
8. ✅ Complete case → alert status = completed

### IoT Device Test (if device available)
1. Insert test device in `live_vitals`: `INSERT INTO live_vitals (device_id, spo2_pct, hr_bpm) VALUES ('TEST-001', 95, 80);`
2. Link to ambulance: `UPDATE ambulances SET device_id = 'TEST-001' WHERE id = 'amb-001';`
3. Update vitals: `UPDATE live_vitals SET spo2_pct = 92, hr_bpm = 110 WHERE device_id = 'TEST-001';`
4. Verify ambulance UI shows real-time update without page refresh

---

## 🔟 Known Issues & Notes

### Security Warnings (Non-blocking)
- ⚠️ "Leaked Password Protection Disabled" - Supabase Auth setting, requires manual configuration in dashboard
- ✅ Function search_path warning - **FIXED** in migration

### Migration Compatibility
- All existing alerts preserved with patient snapshot fields
- New alerts require `patient_id` but old alerts will still display correctly
- Hospital transfers only work for patients in `patients` table (new patients after this migration)

---

## 1️⃣1️⃣ Production Deployment Notes

### Before Production
1. Re-run seed script to ensure all hospital credentials are `12345678`
2. Link real IoT devices to ambulances via `device_id`
3. Enable Supabase leaked password protection in Auth settings
4. Review all RLS policies for production security requirements
5. Test hospital transfer trigger with real patient flow

### Rollback Plan
If issues occur, migrations can be reverted in reverse order:
1. Remove trigger: `DROP TRIGGER IF EXISTS trigger_update_alert_on_hospital_change ON patients;`
2. Drop function: `DROP FUNCTION IF EXISTS update_alert_on_hospital_change();`
3. Remove columns: `ALTER TABLE alerts DROP COLUMN patient_id;` (etc.)
4. Drop patients table: `DROP TABLE patients;`

---

## Summary Verification

✅ **Schema**: `patients` table created with proper FKs and RLS  
✅ **Linkage**: `patient_id` in alerts, `device_id` in ambulances, bidirectional vitals mapping  
✅ **Trigger**: Automatic alert updates on hospital change  
✅ **Auth**: All hospitals use `12345678` password  
✅ **Application**: Patient CRUD, hospital transfer, IoT real-time vitals  
✅ **Security**: RLS policies enforce ambulance/hospital/admin access rules  
✅ **Preserved**: All existing UI, workflows, and functionality intact  

**The system is now a fully integrated hospital-ambulance-patient coordination platform with IoT support.**
