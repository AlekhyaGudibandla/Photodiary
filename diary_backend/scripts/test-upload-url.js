require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    //   process.env.SUPABASE_ANON_KEY 
    process.env.SUPABASE_SERVICE_ROLE_KEY // Testing with service role key, same as backend now
);

async function testSignedUrl() {
    const BUCKET_NAME = 'diary-media'; // hardcoded as in backend
    console.log(`Testing signed URL for bucket: ${BUCKET_NAME}`);

    const filePath = `test-file-${Date.now()}.png`;

    try {
        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .createSignedUploadUrl(filePath);

        if (error) {
            console.error('Error creating signed URL:', error);
        } else {
            console.log('Signed URL created successfully:', data);
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

testSignedUrl();
