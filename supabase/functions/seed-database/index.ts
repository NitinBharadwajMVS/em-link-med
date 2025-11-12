import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper function to generate short name from hospital name
function generateShortname(hospitalName: string): string {
  const specialCases: Record<string, string> = {
    'Fortis': 'Fortis',
    'Apollo': 'Apollo',
    'Manipal': 'Manipal',
    'Columbia Asia': 'Columbia',
    'Narayana': 'Narayana',
    'Sakra': 'Sakra',
    'St. John': 'StJohns',
    'BGS': 'BGS',
    'Aster': 'Aster',
    'Cloudnine': 'Cloudnine',
    'Sparsh': 'Sparsh',
    'Vikram': 'Vikram',
    'Motherhood': 'Motherhood',
    'HCG': 'HCG',
    'Ramaiah': 'Ramaiah',
    'Sagar': 'Sagar',
    'Baptist': 'Baptist',
    'KIMS': 'KIMS',
    'Rangadore': 'Rangadore',
    'Kauvery': 'Kauvery',
    'Rainbow': 'Rainbow',
    'Brindavan': 'Brindavan',
  };

  for (const [key, value] of Object.entries(specialCases)) {
    if (hospitalName.includes(key)) return value;
  }

  const words = hospitalName.split(' ').filter(w => 
    !['Hospital', 'Hospitals', 'Medical', 'Centre', 'Center', 'Road', 'Layout'].includes(w)
  );
  
  return words.slice(0, Math.min(2, words.length)).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Fetch hospitals from the hospitals_bangalore.json data
    const hospitalsResponse = await fetch('https://vtcnosxbkzxeojnhidiy.supabase.co/storage/v1/object/public/config/hospitals_bangalore.json');
    let hospitalsData = [];
    
    if (!hospitalsResponse.ok) {
      // Fallback: use embedded minimal dataset
      console.log('Using embedded hospital dataset');
      hospitalsData = [
        { id: "2", name: "Fortis Hospital Bannerghatta Road", latitude: 12.8854, longitude: 77.5981, address: "Bannerghatta Road", contact: "+91-80-66214444", distance: 2.5, equipment: ["CT Scan", "MRI", "Ventilator", "Defibrillator"], specialties: ["Cardiology", "Neurology", "Orthopedics"] },
        { id: "3", name: "Apollo Hospitals Bannerghatta", latitude: 12.8621, longitude: 77.5913, address: "Bannerghatta", contact: "+91-80-26304050", distance: 1.8, equipment: ["CT Scan", "MRI", "ICU"], specialties: ["Cardiology", "Oncology"] },
        { id: "5", name: "Narayana Multispeciality Hospital HSR Layout", latitude: 12.9121, longitude: 77.6446, address: "HSR Layout", contact: "+91-80-30905000", distance: 5.2, equipment: ["Ventilator", "Defibrillator"], specialties: ["Emergency", "Cardiology"] },
        { id: "6", name: "Sakra World Hospital", latitude: 12.9698, longitude: 77.7499, address: "Bellandur", contact: "+91-80-42222222", distance: 8.1, equipment: ["CT Scan", "MRI"], specialties: ["Orthopedics", "Neurology"] },
        { id: "7", name: "St. John's Medical College Hospital", latitude: 12.9326, longitude: 77.6225, address: "Koramangala", contact: "+91-80-49467777", distance: 6.3, equipment: ["ICU", "Ventilator"], specialties: ["Emergency", "General Medicine"] }
      ];
    } else {
      hospitalsData = await hospitalsResponse.json();
      // Exclude Manipal Whitefield
      hospitalsData = hospitalsData.filter((h: any) => !h.name.includes('Manipal') || !h.name.includes('Whitefield'));
    }

    const credentials = [];
    const errors = [];
    let successCount = 0;

    // Seed each hospital
    for (const hospital of hospitalsData) {
      const shortname = generateShortname(hospital.name);
      const username = shortname.toLowerCase();
      const internalEmail = `${username}@internal.example`;
      const password = `${shortname}@123`;

      try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: internalEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            username: username,
            hospital_id: hospital.id,
            hospital_name: hospital.name,
            role: 'hospital'
          }
        });

        if (authError) {
          console.error(`Auth error for ${hospital.name}: ${authError.message}`);
          errors.push({ hospital: hospital.name, error: authError.message });
          continue;
        }

        const authUid = authData.user.id;

        // 2. Insert hospital data
        const { error: hospitalError } = await supabase
          .from('hospitals')
          .upsert({
            id: hospital.id,
            name: hospital.name,
            distance: hospital.distance,
            latitude: hospital.latitude,
            longitude: hospital.longitude,
            address: hospital.address,
            contact: hospital.contact,
            equipment: hospital.equipment || [],
            specialties: hospital.specialties || []
          });

        if (hospitalError) {
          console.error(`Hospital insert error for ${hospital.name}: ${hospitalError.message}`);
          errors.push({ hospital: hospital.name, error: hospitalError.message });
          continue;
        }

        // 3. Link auth user to hospital in app_users
        const { error: appUserError } = await supabase
          .from('app_users')
          .upsert({
            auth_uid: authUid,
            username: username,
            role: 'hospital',
            linked_entity: hospital.id
          });

        if (appUserError) {
          console.error(`App user link error for ${hospital.name}: ${appUserError.message}`);
          errors.push({ hospital: hospital.name, error: appUserError.message });
          continue;
        }

        successCount++;
        credentials.push({
          hospital_id: hospital.id,
          hospital_name: hospital.name,
          shortname: shortname,
          username: username,
          internal_email: internalEmail,
          password: password,
          auth_uid: authUid
        });

      } catch (err: any) {
        console.error(`Unexpected error for ${hospital.name}: ${err.message}`);
        errors.push({ hospital: hospital.name, error: err.message });
      }
    }

    // Create demo ambulance account
    try {
      const { data: ambAuthData, error: ambAuthError } = await supabase.auth.admin.createUser({
        email: 'amb1@internal.example',
        password: '1234',
        email_confirm: true,
        user_metadata: {
          username: 'amb1',
          ambulance_number: 'AMB-001',
          role: 'ambulance'
        }
      });

      if (!ambAuthError && ambAuthData) {
        await supabase.from('ambulances').upsert({
          id: 'amb-001',
          ambulance_number: 'AMB-001',
          contact: '+91-9876543210',
          equipment: ['Defibrillator', 'Oxygen', 'Ventilator', 'Cardiac Monitor']
        });

        await supabase.from('app_users').upsert({
          auth_uid: ambAuthData.user.id,
          username: 'amb1',
          role: 'ambulance',
          linked_entity: 'amb-001'
        });

        credentials.push({
          hospital_id: 'amb-001',
          hospital_name: 'Demo Ambulance',
          shortname: 'AMB-001',
          username: 'amb1',
          internal_email: 'amb1@internal.example',
          password: '1234',
          auth_uid: ambAuthData.user.id
        });
        successCount++;
      }
    } catch (err: any) {
      console.error(`Ambulance creation error: ${err.message}`);
    }

    // Create demo admin account
    try {
      const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
        email: 'hos1@internal.example',
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          username: 'hos1',
          role: 'admin'
        }
      });

      if (!adminAuthError && adminAuthData) {
        await supabase.from('app_users').upsert({
          auth_uid: adminAuthData.user.id,
          username: 'hos1',
          role: 'admin',
          linked_entity: null
        });

        credentials.push({
          hospital_id: 'admin',
          hospital_name: 'Admin Account',
          shortname: 'Admin',
          username: 'hos1',
          internal_email: 'hos1@internal.example',
          password: 'admin123',
          auth_uid: adminAuthData.user.id
        });
        successCount++;
      }
    } catch (err: any) {
      console.error(`Admin creation error: ${err.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seeding complete: ${successCount} accounts created`,
        successCount,
        errorCount: errors.length,
        credentials,
        errors
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 500
      }
    );
  }
});
