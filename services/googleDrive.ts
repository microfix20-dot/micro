const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

/**
 * Initializes Google API scripts with user-provided credentials
 */
export const initializeGoogleDrive = async (
  clientId: string, 
  apiKey: string, 
  callback: (success: boolean) => void
) => {
  if (!window.gapi || !window.google) {
    console.warn("Google API scripts not found in index.html.");
    callback(false);
    return;
  }

  if (!clientId || !apiKey) {
    console.warn("Google Drive: Missing Client ID or API Key.");
    callback(false);
    return;
  }

  // Handle GAPI
  const initGapi = () => {
    window.gapi.load('client', async () => {
      try {
        // Guard against repeated init
        if (gapiInited) {
          if (gisInited) callback(true);
          return;
        }

        await window.gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: [DISCOVERY_DOC],
        });
        
        gapiInited = true;
        if (gisInited) callback(true);
      } catch (err: any) {
        console.error("GAPI Init Error:", err);
        // If discovery failed but library loaded, we might still be able to use it
        // but typically this error is fatal for the automated client.
        callback(false);
      }
    });
  };

  // Handle GIS
  const initGis = () => {
    try {
      if (gisInited) {
        if (gapiInited) callback(true);
        return;
      }

      tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: '', // assigned in handleAuthClick
      });
      gisInited = true;
      if (gapiInited) callback(true);
    } catch (err) {
      console.error("GIS Init Error:", err);
      callback(false);
    }
  };

  // Run both
  initGapi();
  initGis();
};

export const handleAuthClick = (onSuccess: (token: any) => void, onError: (error: any) => void) => {
  if (!tokenClient) {
    onError("Identity client not ready. Please check your Client ID.");
    return;
  }
  
  tokenClient.callback = async (resp: any) => {
    if (resp.error !== undefined) {
      console.error("Identity Auth Error:", resp);
      onError(resp);
      return;
    }
    onSuccess(resp);
  };

  if (window.gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
};

export const uploadBackupFile = async (data: string, existingFileId?: string): Promise<{ fileId: string }> => {
  const fileName = `FixMaster_Backup_${new Date().toISOString().split('T')[0]}.json`;
  const fileContent = data;
  const fileType = 'application/json';

  const file = new Blob([fileContent], { type: fileType });
  const metadata = {
    name: fileName,
    mimeType: fileType,
  };

  const accessToken = window.gapi.client.getToken()?.access_token;
  if (!accessToken) throw new Error("Authentication required for upload.");

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (existingFileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
    method = 'PATCH';
  }

  const response = await fetch(url, {
    method: method,
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form
  });

  if (!response.ok) {
     const err = await response.json();
     throw new Error(`Drive Upload Failed: ${err.error?.message || response.statusText}`);
  }

  const respData = await response.json();
  return { fileId: respData.id };
};

export const handleSignOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
};