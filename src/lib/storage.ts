import { supabaseAdmin } from './supabaseAdmin';

export type StorageBucket = 'avatars' | 'posts' | 'stories' | 'documents' | 'evidence';

/**
 * Uploads a file buffer or blob to Supabase Storage using the privileged service role.
 */
export async function uploadAdminFile(
  bucket: StorageBucket,
  path: string,
  fileBody: Buffer | Blob | Uint8Array,
  contentType = 'image/jpeg'
): Promise<{ path: string; publicUrl?: string; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, fileBody, {
        contentType,
        upsert: true,
      });

    if (error) {
      return { path: '', error: new Error(error.message) };
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
      error: null,
    };
  } catch (err: any) {
    return { path: '', error: err };
  }
}

/**
 * Generates a signed URL for private evidence or RSBSA documents so admins can inspect them.
 */
export async function getAdminSignedUrl(
  bucket: 'documents' | 'evidence',
  path: string,
  expiresInSeconds = 7200 // 2 hours
): Promise<string | null> {
  if (!path) return null;
  const cleanPath = path.replace(/^https?:\/\/[^/]+\/[^/]+\/[^/]+\//, '');
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(cleanPath, expiresInSeconds);

  if (error || !data) {
    return null;
  }
  return data.signedUrl;
}

/**
 * Gets the public URL of an asset in avatars, posts, or stories.
 */
export function getAdminPublicUrl(bucket: 'avatars' | 'posts' | 'stories', path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
