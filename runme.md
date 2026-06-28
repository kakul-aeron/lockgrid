npm ci
npm run dev
# test store
curl -s -X POST http://localhost:3000/api/store \
  -H "Content-Type: application/json" \
  -d '{"lookupKey":"myTest","salt":"s","iv":"i","ciphertext":"c"}'