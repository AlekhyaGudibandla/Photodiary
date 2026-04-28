require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupBucket() {
    const BUCKET_NAME = process.env.SUPABASE_MEDIA_BUCKET || 'diary-media';
    console.log(`Checking bucket: ${BUCKET_NAME}`);

    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    const existing = buckets.find(b => b.name === BUCKET_NAME);
    if (existing) {
        console.log(`Bucket ${BUCKET_NAME} already exists. Updating to public...`);
        const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 10485760,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'video/mp4']
        });
        if (updateError) console.error('Error updating bucket:', updateError);
        else console.log(`Bucket ${BUCKET_NAME} updated to public.`);
    } else {
        console.log(`Creating bucket ${BUCKET_NAME}...`);
        const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'video/mp4']
        });

        if (createError) {
            console.error('Error creating bucket:', createError);
        } else {
            console.log(`Bucket ${BUCKET_NAME} created successfully.`);
        }
    }
}

setupBucket();
