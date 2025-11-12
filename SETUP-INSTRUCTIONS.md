# Supabase Integration Setup Instructions

## 🎯 Overview

This project is now fully integrated with Supabase for authentication, real-time alerts, and data persistence. All hospital users have dedicated auth accounts, and alerts are filtered by hospital in real-time.

## 🔐 Security Warnings

**CRITICAL:** The following credentials are for DEMO/DEVELOPMENT ONLY and MUST be rotated before production:

1. All hospital passwords follow the pattern: `{ShortName}@123` (e.g., `Fortis@123`)
2. Demo ambulance: `amb1` / password: `1234`
3. Demo admin: `hos1` / password: `admin123`
4. The `SUPABASE_SERVICE_ROLE_KEY` has elevated privileges - keep it secret!

## 📋 Database Schema

The following tables have been created:

### `hospitals`
- Stores hospital information (name, location, equipment, specialties)
- Seeded from `hospitals_bangalore.json` (excluding Manipal Whitefield)
- RLS enabled: Public read, authenticated write

### `ambulances`
- Stores ambulance information (ambulance_number, equipment, location)
- Demo ambulance: `AMB-001`
- RLS enabled: Public read, authenticated write

### `app_users`
- Links Supabase Auth users to hospitals or ambulances
- Fields: `auth_uid`, `username`, `role`, `linked_entity`
- Roles: `hospital`, `ambulance`, `admin`
- RLS enabled: Users can view their own data, admins can view all

### `alerts`
- Stores pre-alert notifications with patient vitals and triage info
- Real-time enabled via Supabase Realtime
- RLS policies ensure hospitals only see their own alerts
- Ambulances can see alerts they created

## 🚀 Seeding the Database

### Prerequisites

1. Get your Supabase service role key from:
   ```
   https://supabase.com/dashboard/project/vtcnosxbkzxeojnhidiy/settings/api
   ```

2. Install dependencies:
   ```bash
   cd scripts
   npm install
   ```

### Running the Seed Script

The seed script will:
- Create Supabase Auth accounts for all hospitals
- Insert hospital data into the database
- Link auth users to hospitals in `app_users`
- Create demo ambulance (`amb1`) and admin (`hos1`) accounts
- Generate a CSV file with all credentials

**Run the script:**

```bash
cd scripts
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here npm run seed
```

### Seed Script Output

After successful seeding, you'll find:
- `hospital-credentials.csv` - Contains all usernames and passwords
- Console output showing success/failure for each hospital

## 🔑 Hospital Login Credentials

Each hospital can log in using either:

1. **Username** (recommended): Short name like `fortis`, `apollo`, `narayana`
2. **Email** (internal): Format `{username}@internal.example`
3. **Password**: Format `{ShortName}@123`

### Examples:

| Hospital Name | Username | Password |
|--------------|----------|----------|
| Fortis Hospital Bannerghatta Road | `fortis` | `Fortis@123` |
| Apollo Hospitals Bannerghatta | `apollo` | `Apollo@123` |
| Narayana Multispeciality Hospital | `narayana` | `Narayana@123` |
| Sakra World Hospital | `sakra` | `Sakra@123` |
| St. John's Medical College | `stjohns` | `StJohns@123` |

### Demo Accounts:

- **Ambulance**: `amb1` / password: `1234` (linked to `AMB-001`)
- **Admin**: `hos1` / password: `admin123`

## 🔄 How It Works

### Ambulance Flow:

1. Ambulance logs in with username `amb1` and password `1234`
2. Selects a hospital from the map/list (sorted by ETA)
3. Fills in patient details, vitals, and triage level
4. Sends pre-alert → Creates an `alerts` record with `hospital_id`
5. Alert is immediately broadcast via Supabase Realtime

### Hospital Flow:

1. Hospital logs in with username (e.g., `fortis`) or email
2. Dashboard subscribes to real-time alerts filtered by `hospital_id`
3. Only alerts where `hospital_id = linked_entity` are received
4. Hospital can accept/decline alerts
5. Status changes sync in real-time

### Real-time Filtering:

The hospital dashboard uses Supabase Realtime with filtering:

```typescript
supabase
  .channel('alerts-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'alerts',
    filter: `hospital_id=eq.${currentHospitalId}`
  }, handleNewAlert)
  .subscribe()
```

RLS policies ensure:
- Hospitals can only SELECT alerts where `hospital_id` matches their `linked_entity`
- Ambulances can only SELECT alerts they created
- Both can UPDATE alerts they're involved with

## 🛡️ Row Level Security (RLS) Policies

### Hospitals Table:
- ✅ Public read access
- ✅ Authenticated users can insert/update

### Ambulances Table:
- ✅ Public read access
- ✅ Authenticated users can manage

### app_users Table:
- ✅ Users can view their own data
- ✅ Admins can view all users

### alerts Table:
- ✅ Hospitals can only view their own alerts (filtered by `hospital_id`)
- ✅ Ambulances can view alerts they created (filtered by `ambulance_id`)
- ✅ Authenticated users can create alerts
- ✅ Users can update relevant alerts

## 📝 CSV Credentials Format

The generated `hospital-credentials.csv` contains:

```csv
hospital_id,hospital_name,shortname,username,internal_email,password,auth_uid
2,"Fortis Hospital Bannerghatta Road",Fortis,fortis,fortis@internal.example,Fortis@123,uuid-here
3,"Apollo Hospitals Bannerghatta",Apollo,apollo,apollo@internal.example,Apollo@123,uuid-here
...
```

## ⚠️ Production Checklist

Before deploying to production:

- [ ] Rotate ALL passwords (use strong, random passwords)
- [ ] Remove or disable demo accounts (`amb1`, `hos1`)
- [ ] Review and tighten RLS policies
- [ ] Set up proper password reset flow
- [ ] Enable 2FA for admin accounts
- [ ] Audit all access logs
- [ ] Never commit `hospital-credentials.csv` to git
- [ ] Store `SUPABASE_SERVICE_ROLE_KEY` securely (e.g., in environment variables)
- [ ] Set up email verification for new accounts
- [ ] Configure Supabase Auth settings (password requirements, lockout policies)

## 🧪 Testing

### Test Hospital Login:
1. Go to `/hospital-login`
2. Enter username: `fortis`
3. Enter password: `Fortis@123`
4. Should redirect to hospital dashboard

### Test Ambulance Login:
1. Go to `/ambulance-login`
2. Enter username: `amb1`
3. Enter password: `1234`
4. Should redirect to ambulance dashboard

### Test Real-time Alerts:
1. Login as hospital (e.g., `fortis`)
2. In another browser/incognito, login as ambulance (`amb1`)
3. Send a pre-alert to Fortis Hospital
4. Hospital dashboard should immediately show the new alert

## 📚 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/vtcnosxbkzxeojnhidiy
- **Auth Users**: https://supabase.com/dashboard/project/vtcnosxbkzxeojnhidiy/auth/users
- **Database Editor**: https://supabase.com/dashboard/project/vtcnosxbkzxeojnhidiy/editor
- **SQL Editor**: https://supabase.com/dashboard/project/vtcnosxbkzxeojnhidiy/sql/new
- **API Settings**: https://supabase.com/dashboard/project/vtcnosxbkzxeojnhidiy/settings/api

## 🐛 Troubleshooting

### "Invalid login credentials"
- Ensure the seed script ran successfully
- Check username/password match (case-sensitive)
- Verify user exists in Auth > Users

### "No alerts showing on hospital dashboard"
- Verify hospital is logged in
- Check that alert's `hospital_id` matches the logged-in hospital's `linked_entity`
- Open browser console and check for RLS policy errors

### "Cannot insert into alerts table"
- Ensure user is authenticated
- Check that `hospital_id` and `ambulance_id` exist in their respective tables
- Verify RLS policies allow insertion

### Seed script fails
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check Supabase project is active
- Verify network connectivity
- Check for duplicate entries (if re-running)

## 📞 Support

For issues or questions:
1. Check Supabase logs in the dashboard
2. Review RLS policies in Database > Policies
3. Check Auth logs in Auth > Logs
4. Verify table data in Database > Table Editor

---

**Remember:** This is a demo system. For production use, implement proper security measures, password policies, and access controls!
