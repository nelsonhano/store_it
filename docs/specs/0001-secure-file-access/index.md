# 0001. Secure stored file access and private bucket storage

**Date**: 2026-11-18
**Status**: Accepted

## Summary

This decision locks down the Appwrite storage bucket to eliminate public file access. All file view and download requests will pass through authenticated Next.js server route handlers. The server verifies the caller session cookie and checks document permissions before streaming file data. This protects user privacy while preserving thumbnail previews and downloads.

## Requirements

**User stories**:
- As an authenticated user, I want my uploaded files kept strictly private so that unauthorized visitors cannot access my data.
- As a file owner, I want to download and preview my files seamlessly from the dashboard.
- As an authorized collaborator, I want to view and download files shared with my email address.

**Acceptance criteria**:
- **AC-1**: When an unauthenticated visitor or non authorized user requests a file view or download URL, the server returns a 404 Not Found response without confirming whether the file exists.
- **AC-2**: When the file owner requests `/api/files/[id]/view`, the server validates the session cookie, checks owner permissions, and streams the binary file inline with the correct MIME type header.
- **AC-3**: When an authenticated user whose email appears in the file users array requests `/api/files/[id]/view`, the server validates access and streams the file.
- **AC-4**: When an authorized user requests `/api/files/[id]/download`, the server streams the binary file with a Content Disposition attachment header containing the original file name.
- **AC-5**: The Appwrite storage bucket permissions revoke public read access so that direct unauthenticated requests to Appwrite storage endpoints fail.
- **AC-6**: Dashboard thumbnails and file cards load previews through the secure view route with private browser cache headers.
- **AC-7**: Uploading a new file writes the application relative route path `/api/files/[id]/view` into the file document url attribute.

## Decision

**Chosen option**: Option 1: Next.js server route handlers with streamed storage responses

Implement `/api/files/[id]/view` and `/api/files/[id]/download` route handlers in Next.js, streaming files from Appwrite storage after verifying session cookies and database document permissions.

## Rationale

Reasoning and options: see [rationale.md](rationale.md)

## Feature design

**Data model sketch**:

Existing collections remain intact with no new database attributes required:

1. `User` (collection `users`):
   - `$id`: String (Primary Key)
   - `fullName`: String
   - `email`: String
   - `accountId`: String

2. `File` (collection `files`):
   - `$id`: String (Primary Key)
   - `name`: String (original file name)
   - `type`: String (document, image, video, audio, other)
   - `extension`: String (file extension)
   - `size`: Integer (file size in bytes)
   - `url`: String (stores application relative route `/api/files/[id]/view`)
   - `bucketFileId`: String (storage reference)
   - `owner`: Relationship referencing User document ID
   - `accountId`: String
   - `users`: Array of Strings (normalized email addresses of shared recipients)

3. `Storage Bucket` (`appwriteConfig.bucketId`):
   - Access: Restricted to server admin client operations using the backend secret API key.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/files/[id]/view` | GET | `id` route parameter (file document ID) | Binary file stream with inline disposition and MIME header | Appwrite session cookie | 404 (unauthorized or missing), 500 |
| `/api/files/[id]/download` | GET | `id` route parameter (file document ID) | Binary file stream with attachment disposition header | Appwrite session cookie | 404 (unauthorized or missing), 500 |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Verify caller identity | `currentUser` document | Session client `account.get()` filtered against users collection |
| Locate file metadata | `file` document | Appwrite database document lookup by route parameter `id` |
| Authorize access | Access decision boolean | Check if `file.owner === currentUser.$id` or `file.users.includes(currentUser.email)` |
| Fetch storage binary | `fileBuffer` ArrayBuffer | Admin client `storage.getFileDownload(bucketId, file.bucketFileId)` |
| Content MIME type | `Content-Type` header string | Lookup helper mapping `file.extension` to standard MIME string |
| Download file name | `Content-Disposition` header string | Constructed from `file.name` formatted for safe header transport |
| Cache policy | `Cache-Control` header string | Set to `private, max-age=3600` for view route, and `no-store` for download route |

**Key invariants**:
- The Appwrite storage bucket must never have public read permissions enabled.
- Any request lacking a valid session cookie or matching authorization must receive a 404 Not Found response.
- File view and download responses must always set appropriate Content Type and Content Disposition headers.
- File email comparisons must use lowercase trimmed email values.

**Security model**:
- Unauthenticated access: Blocked with a 404 Not Found response to prevent file existence discovery.
- File owners: Full read and download access granted when user document ID matches file owner.
- Shared users: Read and download access granted when authenticated user email matches an entry in `file.users`.
- Third party visitors: Blocked with 404 Not Found.
- Storage isolation: Storage files are never directly exposed to the public internet.

**Critical test scenarios**:
- Happy path: File owner navigates to `/api/files/[id]/download` and receives the file binary as an attachment with original file name, verifies **AC-2**, **AC-4**.
- Shared user path: Authenticated collaborator listed in `users` visits `/api/files/[id]/view` and views the file, verifies **AC-3**.
- Unauthorized access: Logged in user not matching owner or shared list visits file URL and receives 404 Not Found, verifies **AC-1**.
- Unauthenticated access: Visitor without session cookie visits file URL and receives 404 Not Found, verifies **AC-1**.
- Direct storage protection: Direct curl request to Appwrite storage URL fails without credentials, verifies **AC-5**.
- Thumbnail caching: Image preview response contains `Cache-Control: private, max-age=3600`, verifies **AC-6**.

## Build plan

Order and slices follow the Tracer Bullet approach, establishing the secure server routes first, updating the application helpers, and finally locking the storage bucket:

1. [x] Create a MIME type lookup dictionary in `src/lib/utils.ts` mapping common file extensions to standard MIME strings, satisfies **AC-2**, **AC-4**.
2. [x] Implement route handler `src/app/api/files/[id]/view/route.ts` checking session cookies, validating owner or shared email access, and streaming binary data with inline disposition and private cache headers, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**.
3. [x] Implement route handler `src/app/api/files/[id]/download/route.ts` checking session cookies, validating access, and streaming binary data with attachment disposition, satisfies **AC-1**, **AC-4**.
4. [x] Update `constructFileUrl` and `constructDownloadUrl` helper functions in `src/lib/utils.ts` to generate `/api/files/[id]/view` and `/api/files/[id]/download` paths, satisfies **AC-6**, **AC-7**.
5. [x] Update `uploadFile` server action in `src/lib/actions/file.action.ts` so new file documents save `/api/files/[id]/view` in the `url` field, satisfies **AC-7**.
6. [x] Update `ActionDrop.tsx` and `Card.tsx` download and preview links to pass the file document ID, satisfies **AC-4**, **AC-6**.
7. [x] Update Appwrite storage bucket permissions in the Appwrite Console or via `node scripts/secure-bucket.mjs` to remove public read access, satisfies **AC-5**.

## Migration plan

**Strategy**: Strangler pattern with backward compatibility

**Phases**:
1. Deploy new `/api/files/[id]/view` and `/api/files/[id]/download` route handlers.
2. Update URL constructor functions and UI components so active sessions begin using the protected routes.
3. Run a one time script to update existing database records so the `url` field points to `/api/files/[id]/view`.
4. Remove public read permissions from the Appwrite storage bucket.

**Rollback**:
If route streaming encounters server issues, re-enable public read permissions on the Appwrite bucket and revert the URL helper functions.

**Risks**:
Locking down the Appwrite bucket before database URLs are migrated would break image thumbnails for existing files. Sequencing bucket lock down as the final step prevents this risk.

## Consequences

**Positive**:
- Storage bucket files are completely private.
- Unauthorized callers cannot enumerate or scrape stored files.
- Document level sharing is strictly enforced for all file downloads and previews.
- Works naturally with standard browser tags and download mechanisms.

**Negative / tradeoffs**:
- File streaming consumes Next.js server memory and bandwidth.
- Large file downloads depend on server process streaming efficiency.

**Neutral**:
- Existing file documents require a one time database update to align their stored URL fields.

## Follow-up

- [ ] Execute one time migration script to update existing file document `url` attributes to `/api/files/[id]/view`.
- [ ] Verify that Next.js server runtime handles multi megabyte file streams without memory accumulation.
