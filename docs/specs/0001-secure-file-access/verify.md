# Verify: Secure stored file access · spec 0001 · updated 2026-11-18
_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] In an incognito window, navigate to `/api/files/[id]/view` or `/api/files/[id]/download` without a session cookie → expect 404 Not Found response → AC-1
- [ ] Log in as file owner and click a file card in the dashboard → opens `/api/files/[id]/view` in a new tab rendering the file inline → AC-2, AC-6
- [ ] Log in as a collaborator listed in `file.users`, navigate to `/api/files/[id]/view` → file renders successfully → AC-3
- [ ] Log in as an authenticated user not listed as owner or in `file.users`, navigate to `/api/files/[id]/view` → expect 404 Not Found → AC-1
- [ ] In the dashboard action menu, click download → browser downloads file from `/api/files/[id]/download` with original filename → AC-4
- [ ] Upload a new file from dashboard → database record stores relative route `/api/files/[id]/view` in url field → AC-7

## Commands
- [x] `curl -i http://localhost:3000/api/files/<id>/view` without session cookie → returns HTTP 404 Not Found → AC-1
- [x] `node scripts/secure-bucket.mjs` → revokes public read permissions on bucket → AC-5
- [ ] `curl -i https://cloud.appwrite.io/v1/storage/buckets/<bucketId>/files/<fileId>/view?project=<projectId>` → returns HTTP 401 or 403 once bucket permissions are locked → AC-5

## Acceptance-criteria coverage
- AC-1 covered by unauthenticated and unauthorized access steps
- AC-2 covered by file owner view step
- AC-3 covered by shared collaborator access step
- AC-4 covered by file download action step
- AC-5 covered by direct Appwrite storage curl test and bucket lock script
- AC-6 covered by dashboard preview step
- AC-7 covered by new upload relative path inspection step
