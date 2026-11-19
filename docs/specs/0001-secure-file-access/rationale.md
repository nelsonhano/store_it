# 0001. Secure stored file access and private bucket storage: Decision Record

## Context

The application currently creates files in an Appwrite storage bucket configured with public read permissions (meaning anyone can read files without credentials). The file document in the database stores a direct public Appwrite URL. Anyone who knows or discovers the Appwrite project identifier and a bucket file identifier can view or download stored files directly from Appwrite.

This creates a serious data privacy vulnerability. Users upload personal documents, images, and media expecting private storage. In addition, the file sharing feature records authorized email addresses on database file records, but this sharing restriction is not enforced when files are fetched directly through public storage URLs.

Leaving this unaddressed means any leaked or guessed file identifier exposes user data to the public internet. The system needs private storage bucket permissions and an authenticated application layer gate to verify ownership and shared access before serving any file.

## Options considered

### Option 1: Next.js server route handlers with streamed storage responses (Chosen)

Create dedicated route handlers at `/api/files/[id]/view` and `/api/files/[id]/download`. The route handler inspects the incoming session cookie, fetches the file record using the admin client, validates ownership or email sharing, and streams the binary buffer from Appwrite storage to the client.

**Pros**:
- Storage bucket remains completely private with zero public read permissions.
- Centralizes all access control, audit logging, and header handling inside the Next.js server.
- Works cleanly with standard browser elements including image tags and anchor download links.

**Cons**:
- File binary traffic flows through the Next.js application server, consuming server bandwidth and memory during transfers.

### Option 2: Appwrite file level permissions with client SDK downloads

Configure the Appwrite bucket with file level security. During upload, assign explicit read permissions for the creator user account ID. Use the client side Appwrite SDK in the browser to download files directly from Appwrite.

**Pros**:
- Offloads file transfer bandwidth entirely to Appwrite servers.

**Cons**:
- Breaks standard HTML image tags and simple anchor links because browser asset requests do not carry Appwrite client SDK authentication headers.
- Requires complex synchronization whenever a file is shared with new email addresses that may not yet have an Appwrite user account.

### Option 3: Short lived signed storage tokens via server actions

Generate temporary signed storage download URLs on demand using server actions, redirecting the browser directly to Appwrite storage for each download.

**Pros**:
- Keeps server bandwidth low while maintaining authenticated gate checks.

**Cons**:
- Image thumbnails in lists and galleries would each require generating and refreshing temporary tokens, causing high request latency and rendering complexity.
- Appwrite does not provide built in pre signed URLs for arbitrary third party downloads without session tokens.

## Rationale

Option 1 is selected because it completely isolates the storage bucket from public access while providing a straightforward developer experience. The application already manages user sessions through HTTP cookies and stores fine grained file sharing emails inside database documents. Handling file access in server routes allows immediate verification of both owner document IDs and shared email lists.

Passing file streams through Next.js server routes also allows standard image tags and file cards to function without custom client SDK wrappers. Adding a private browser cache header on view routes prevents repeated file downloads during navigation, keeping server load manageable for typical file sizes.
