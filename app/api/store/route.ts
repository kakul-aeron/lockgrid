import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import admin from 'firebase-admin';
import { rateLimit } from '@/lib/ratelimiter';

export async function POST(request: Request) {
    // For local development, fallback to localhost if x-forwarded-for is not present
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';

    const isAllowed = await rateLimit(clientIp);
    if (!isAllowed) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests. Please try again later.' }), { status: 429 });
    }

    try {
        const payload = await request.json();
        const { lookupKey, salt, iv, ciphertext, fileCiphertext, fileIv, fileName } = payload;
        
        console.log('Store API - Lookup Key:', lookupKey);
        
        if (!lookupKey || !salt || !iv || !ciphertext) {
            return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        let isNumberUnique = false; 
        let uniqueNumber = null;

        while (!isNumberUnique) {
            uniqueNumber = Math.floor(1000 + Math.random() * 9000);
            const querySnapshot = await db.collection('encrypted_data')
                .where('lookupKey', '==', lookupKey)
                .where('uniqueNumber', '==', uniqueNumber)
                .limit(1)
                .get();

            if (querySnapshot.empty) {
                isNumberUnique = true;
            }
        }
        
        console.log('Store API - Generated Unique Number:', uniqueNumber);

        const docData: { [key: string]: any } = {
            lookupKey,
            uniqueNumber,
            salt,
            iv,
            ciphertext,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (typeof fileCiphertext !== 'undefined') docData.fileCiphertext = fileCiphertext;
        if (typeof fileIv !== 'undefined') docData.fileIv = fileIv;
        if (typeof fileName !== 'undefined') docData.fileName = fileName;

        await db.collection('encrypted_data').add(docData);

        return new NextResponse(JSON.stringify({ success: true, message: 'Data stored successfully', uniqueNumber: uniqueNumber }), { status: 200 });

    } catch (error) {
        console.error('API Error:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}