# Scope

**Workflow**: Alpha

## At a glance

| Feature | Status | Spec |
|---|---|---|
| Secure stored file access | done | [0001](../specs/0001-secure-file-access/index.md) |

## Features

### Secure stored file access (done)

**Spec**: [0001](../specs/0001-secure-file-access/index.md)
**Intent**: Lock down Appwrite storage bucket permissions and route file viewing and downloads through authenticated Next.js server endpoints.
**Done when**: Unauthenticated requests to files receive 404, file owners and shared recipients can view and download files, and direct public storage access is blocked.

- [x] Design it (spec): [0001](../specs/0001-secure-file-access/index.md)
- [x] Build it: /develop secure-stored-file-access
  - [x] Implement authenticated file view and download route handlers with MIME and cache headers (satisfies AC-1, AC-2, AC-3, AC-4, AC-6)
  - [x] Update application URL helpers, upload actions, and dashboard card links to use protected routes (satisfies AC-4, AC-6, AC-7)
  - [x] Revoke public read permissions on Appwrite storage bucket and verify access restrictions (satisfies AC-5)
  (code in src/app/api/files, src/lib/server/file-handler.ts)
- [x] Verify it: /check verify secure-stored-file-access
