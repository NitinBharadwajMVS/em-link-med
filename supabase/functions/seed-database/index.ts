import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper function to generate username from hospital name (first significant word)
function generateUsername(hospitalName: string): string {
  const specialCases: Record<string, string> = {
    'Fortis': 'fortis',
    'Apollo': 'apollo',
    'Manipal': 'manipal',
    'Columbia Asia': 'columbia',
    'Narayana': 'narayana',
    'Sakra': 'sakra',
    'St. John': 'stjohn',
    'BGS': 'bgs',
    'Aster': 'aster',
    'Cloudnine': 'cloudnine',
    'Sparsh': 'sparsh',
    'Vikram': 'vikram',
    'Motherhood': 'motherhood',
    'HCG': 'hcg',
    'Ramaiah': 'ramaiah',
    'Sagar': 'sagar',
    'Baptist': 'baptist',
    'KIMS': 'kims',
    'Rangadore': 'rangadore',
    'Kauvery': 'kauvery',
    'Rainbow': 'rainbow',
    'Brindavan': 'brindavan',
  };

  for (const [key, value] of Object.entries(specialCases)) {
    if (hospitalName.includes(key)) return value;
  }

  // Get first significant word (not common words)
  const words = hospitalName.split(' ').filter(w => 
    !['Hospital', 'Hospitals', 'Medical', 'Centre', 'Center', 'Road', 'Layout'].includes(w)
  );
  
  return words[0]?.toLowerCase() || hospitalName.split(' ')[0].toLowerCase();
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
      // Fallback: use embedded hospital dataset with 25 Bangalore hospitals
      console.log('Using embedded hospital dataset');
      hospitalsData = [
        { id: "2", name: "Fortis Hospital Bannerghatta Road", latitude: 12.8854, longitude: 77.5981, address: "Bannerghatta Road", contact: "+91-80-66214444", distance: 2.5, equipment: ["CT Scan", "MRI", "Ventilator", "Defibrillator"], specialties: ["Cardiology", "Neurology", "Orthopedics"] },
        { id: "3", name: "Apollo Hospitals Bannerghatta", latitude: 12.8621, longitude: 77.5913, address: "Bannerghatta", contact: "+91-80-26304050", distance: 1.8, equipment: ["CT Scan", "MRI", "ICU"], specialties: ["Cardiology", "Oncology"] },
        { id: "5", name: "Narayana Multispeciality Hospital HSR Layout", latitude: 12.9121, longitude: 77.6446, address: "HSR Layout", contact: "+91-80-30905000", distance: 5.2, equipment: ["Ventilator", "Defibrillator"], specialties: ["Emergency", "Cardiology"] },
        { id: "6", name: "Sakra World Hospital", latitude: 12.9698, longitude: 77.7499, address: "Bellandur", contact: "+91-80-42222222", distance: 8.1, equipment: ["CT Scan", "MRI"], specialties: ["Orthopedics", "Neurology"] },
        { id: "7", name: "St. John's Medical College Hospital", latitude: 12.9326, longitude: 77.6225, address: "Koramangala", contact: "+91-80-49467777", distance: 6.3, equipment: ["ICU", "Ventilator"], specialties: ["Emergency", "General Medicine"] },
        { id: "8", name: "Manipal Hospital Whitefield", latitude: 12.9698, longitude: 77.7499, address: "Whitefield", contact: "+91-80-46631000", distance: 7.5, equipment: ["CT Scan", "MRI", "ICU", "Ventilator"], specialties: ["Cardiology", "Orthopedics", "Neurology"] },
        { id: "9", name: "Columbia Asia Hospital Hebbal", latitude: 13.0358, longitude: 77.5970, address: "Hebbal", contact: "+91-80-39897000", distance: 9.2, equipment: ["CT Scan", "Defibrillator", "ICU"], specialties: ["Emergency", "General Surgery"] },
        { id: "10", name: "BGS Gleneagles Global Hospital", latitude: 12.9716, longitude: 77.5946, address: "Kengeri", contact: "+91-80-46801000", distance: 8.4, equipment: ["MRI", "CT Scan", "Ventilator"], specialties: ["Cardiology", "Oncology", "Nephrology"] },
        { id: "11", name: "Aster CMI Hospital", latitude: 13.0098, longitude: 77.6413, address: "Hebbal", contact: "+91-80-43420100", distance: 10.1, equipment: ["CT Scan", "MRI", "ICU"], specialties: ["Neurology", "Oncology", "Cardiology"] },
        { id: "12", name: "Cloudnine Hospital Jayanagar", latitude: 12.9250, longitude: 77.5937, address: "Jayanagar", contact: "+91-80-45006500", distance: 4.8, equipment: ["ICU", "Ventilator"], specialties: ["Gynecology", "Pediatrics", "Neonatology"] },
        { id: "13", name: "Sparsh Hospital Rajarajeshwari Nagar", latitude: 12.9200, longitude: 77.5100, address: "RR Nagar", contact: "+91-80-43255555", distance: 11.5, equipment: ["CT Scan", "MRI", "Defibrillator"], specialties: ["Orthopedics", "Sports Medicine"] },
        { id: "14", name: "Vikram Hospital Cunningham Road", latitude: 12.9926, longitude: 77.6007, address: "Cunningham Road", contact: "+91-80-42891000", distance: 7.8, equipment: ["CT Scan", "Ventilator", "ICU"], specialties: ["General Medicine", "Emergency"] },
        { id: "15", name: "Motherhood Hospital Indiranagar", latitude: 12.9716, longitude: 77.6412, address: "Indiranagar", contact: "+91-80-46651200", distance: 6.7, equipment: ["ICU", "Ventilator"], specialties: ["Gynecology", "Obstetrics", "Pediatrics"] },
        { id: "16", name: "HCG Cancer Centre", latitude: 12.9352, longitude: 77.6245, address: "Koramangala", contact: "+91-80-40206868", distance: 6.2, equipment: ["CT Scan", "MRI", "Radiation Therapy"], specialties: ["Oncology", "Radiation Oncology"] },
        { id: "17", name: "Ramaiah Memorial Hospital", latitude: 13.0296, longitude: 77.5665, address: "MSR Nagar", contact: "+91-80-23602222", distance: 9.8, equipment: ["CT Scan", "MRI", "ICU", "Ventilator"], specialties: ["Cardiology", "Neurology", "Emergency"] },
        { id: "18", name: "Sagar Hospital Banashankari", latitude: 12.9250, longitude: 77.5600, address: "Banashankari", contact: "+91-80-26692222", distance: 5.9, equipment: ["CT Scan", "Defibrillator", "Ventilator"], specialties: ["General Surgery", "Orthopedics"] },
        { id: "19", name: "Baptist Hospital Bellary Road", latitude: 13.0296, longitude: 77.5946, address: "Bellary Road", contact: "+91-80-22266666", distance: 10.5, equipment: ["ICU", "Ventilator", "CT Scan"], specialties: ["Cardiology", "Emergency"] },
        { id: "20", name: "KIMS Hospital BTM Layout", latitude: 12.9165, longitude: 77.6101, address: "BTM Layout", contact: "+91-80-41315555", distance: 4.2, equipment: ["CT Scan", "MRI", "ICU"], specialties: ["Cardiology", "Neurology", "General Medicine"] },
        { id: "21", name: "Rangadore Memorial Hospital", latitude: 12.9352, longitude: 77.6101, address: "Indiranagar", contact: "+91-80-25599100", distance: 6.5, equipment: ["CT Scan", "Ventilator"], specialties: ["General Medicine", "Surgery"] },
        { id: "22", name: "Kauvery Hospital Electronic City", latitude: 12.8456, longitude: 77.6603, address: "Electronic City", contact: "+91-80-68212121", distance: 12.3, equipment: ["CT Scan", "MRI", "ICU", "Ventilator"], specialties: ["Cardiology", "Neurology", "Emergency"] },
        { id: "23", name: "Rainbow Children's Hospital Marathahalli", latitude: 12.9591, longitude: 77.6970, address: "Marathahalli", contact: "+91-80-49693939", distance: 9.7, equipment: ["ICU", "Ventilator", "Pediatric Care"], specialties: ["Pediatrics", "Neonatology"] },
        { id: "24", name: "Brindavan Hospital Malleswaram", latitude: 13.0027, longitude: 77.5665, address: "Malleswaram", contact: "+91-80-23461000", distance: 8.6, equipment: ["CT Scan", "Defibrillator"], specialties: ["General Medicine", "Cardiology"] },
        { id: "25", name: "Vydehi Hospital Whitefield", latitude: 12.9698, longitude: 77.7500, address: "Whitefield", contact: "+91-80-28413381", distance: 14.2, equipment: ["CT Scan", "MRI", "ICU", "Ventilator"], specialties: ["Cardiology", "Neurology", "Oncology"] }
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
      const username = generateUsername(hospital.name);
      const internalEmail = `${username}@internal.example`;
      const password = username; // Password same as username

      try {
        // 1. Check if user exists, if so update password, otherwise create new user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(u => u.email === internalEmail);
        
        let authUid: string;
        
        if (existingUser) {
          // Update existing user's password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password }
          );
          
          if (updateError) {
            console.error(`Password update error for ${hospital.name}: ${updateError.message}`);
            errors.push({ hospital: hospital.name, error: updateError.message });
            continue;
          }
          
          authUid = existingUser.id;
          console.log(`Updated password for ${hospital.name}`);
        } else {
          // Create new auth user
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

          authUid = authData.user.id;
          console.log(`Created new user for ${hospital.name}`);
        }

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
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAmb = existingUsers?.users.find(u => u.email === 'amb1@internal.example');
      
      let ambAuthId: string;
      
      if (existingAmb) {
        await supabase.auth.admin.updateUserById(existingAmb.id, { password: '1234' });
        ambAuthId = existingAmb.id;
        console.log('Updated ambulance password');
      } else {
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

        if (ambAuthError || !ambAuthData) {
          throw new Error(ambAuthError?.message || 'Failed to create ambulance');
        }
        
        ambAuthId = ambAuthData.user.id;
        console.log('Created new ambulance user');
      }

      if (ambAuthId) {
        await supabase.from('ambulances').upsert({
          id: 'amb-001',
          ambulance_number: 'AMB-001',
          contact: '+91-9876543210',
          equipment: ['Defibrillator', 'Oxygen', 'Ventilator', 'Cardiac Monitor']
        });

        await supabase.from('app_users').upsert({
          auth_uid: ambAuthId,
          username: 'amb1',
          role: 'ambulance',
          linked_entity: 'amb-001'
        });

        credentials.push({
          hospital_id: 'amb-001',
          hospital_name: 'Demo Ambulance',
          username: 'amb1',
          internal_email: 'amb1@internal.example',
          password: '1234',
          auth_uid: ambAuthId
        });
        successCount++;
      }
    } catch (err: any) {
      console.error(`Ambulance creation error: ${err.message}`);
    }

    // Create demo admin account
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAdmin = existingUsers?.users.find(u => u.email === 'hos1@internal.example');
      
      let adminAuthId: string;
      
      if (existingAdmin) {
        await supabase.auth.admin.updateUserById(existingAdmin.id, { password: 'admin123' });
        adminAuthId = existingAdmin.id;
        console.log('Updated admin password');
      } else {
        const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
          email: 'hos1@internal.example',
          password: 'admin123',
          email_confirm: true,
          user_metadata: {
            username: 'hos1',
            role: 'admin'
          }
        });

        if (adminAuthError || !adminAuthData) {
          throw new Error(adminAuthError?.message || 'Failed to create admin');
        }
        
        adminAuthId = adminAuthData.user.id;
        console.log('Created new admin user');
      }

      if (adminAuthId) {
        await supabase.from('app_users').upsert({
          auth_uid: adminAuthId,
          username: 'hos1',
          role: 'admin',
          linked_entity: null
        });

        credentials.push({
          hospital_id: 'admin',
          hospital_name: 'Admin Account',
          username: 'hos1',
          internal_email: 'hos1@internal.example',
          password: 'admin123',
          auth_uid: adminAuthId
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
