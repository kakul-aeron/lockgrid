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
        const { lookupKey, uniqueNumber } = payload;
        
        console.log('Receive API - Lookup Key:', lookupKey);
        console.log('Receive API - Unique Number:', uniqueNumber);

        if (!lookupKey) {
            return new NextResponse(JSON.stringify({ error: 'Missing lookupKey in request body' }), { status: 400 });
        }

        if (!uniqueNumber || uniqueNumber.length < 3) {
            return new NextResponse(JSON.stringify({ error: 'Missing or invalid unique code' }), { status: 400 });
        }
        
        const querySnapshot = await db.collection('encrypted_data')
                .where('lookupKey', '==', lookupKey)
                .where('uniqueNumber', '==', Number(uniqueNumber))
                .limit(1)
                .get();

        console.log('Query result empty?', querySnapshot.empty);
        console.log('Number of docs found:', querySnapshot.size);

        if (querySnapshot.empty) {
            return new NextResponse(JSON.stringify({ error: 'Data not found' }), { status: 404 });
        }

        const docRef = querySnapshot.docs[0].ref
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            return new NextResponse(JSON.stringify({ error: 'Data not found' }), { status: 404 });
        }

        const data = docSnapshot.data();
        
        // Data retrieval successful - return encrypted data
        return new NextResponse(JSON.stringify({
            salt: data?.salt,
            iv: data?.iv,
            ciphertext: data?.ciphertext,
            fileCiphertext: data?.fileCiphertext,
            fileIv: data?.fileIv, 
            fileName: data?.fileName
        }), { status: 200 });

    } catch (error) {
        console.error('API Error:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}