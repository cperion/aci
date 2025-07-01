import { getSession, saveSession, clearSession, getPortalUrl, getCurrentEnvironment, setCurrentEnvironment, listEnvironments } from '../session.js';
import type { Environment } from '../session.js';
import { UserSession } from '@esri/arcgis-rest-auth';
import { handleError } from '../errors/handler.js';
import { validateUrl, isEnterprisePortal, normalizeBasePortalUrl, buildSharingRestUrl } from '../services/validator.js';
const read = require('read').read;

/**
 * Secure password prompt using the read library
 */
async function securePasswordPrompt(message: string): Promise<string> {
  try {
    const password = await read({ 
      prompt: message, 
      silent: true,
      replace: '*'  // Show asterisks for visual feedback
    });
    return password;
  } catch (err) {
    if ((err as Error).message === 'canceled') {
      throw new Error('Password input canceled');
    }
    throw err;
  }
}

interface LoginOptions {
  token?: string;
  username?: string;
  portal?: string;
  env?: Environment;
}

export async function loginCommand(options: LoginOptions): Promise<void> {
  try {
    // Persist environment selection if specified
    if (options.env) {
      setCurrentEnvironment(options.env);
    }
    
    // Get portal URL from environment or explicit portal option
    const inputPortal = options.portal || getPortalUrl(options.env);
    const basePortalUrl = normalizeBasePortalUrl(inputPortal);
    const sharingRestUrl = buildSharingRestUrl(basePortalUrl);
    
    const envName = options.env || getCurrentEnvironment();
    console.log(`Environment: ${envName}`);
    
    if (inputPortal !== sharingRestUrl) {
      console.log(`Normalized portal URL: ${inputPortal} → ${sharingRestUrl}`);
    }
    console.log(`Authenticating with portal: ${sharingRestUrl}`);
    
    // Validate portal URL
    if (!validateUrl(sharingRestUrl)) {
      throw new Error(`Invalid portal URL: ${sharingRestUrl}`);
    }
    
    // Enterprise token-based authentication (primary)
    if (options.token) {
      await handleTokenLogin(sharingRestUrl, options.token, options.env);
      return;
    }
    
    // Username/password authentication (fallback)
    if (options.username) {
      await handleUsernameLogin(sharingRestUrl, basePortalUrl, options.username, options.env);
      return;
    }
    
    // Provide appropriate guidance based on portal type
    if (isEnterprisePortal(sharingRestUrl)) {
      showEnterpriseAuthInstructions(sharingRestUrl);
    } else {
      showArcGISOnlineInstructions();
    }
    
  } catch (error) {
    handleError(error, 'Authentication failed');
  }
}

async function handleTokenLogin(sharingRestUrl: string, token: string, env?: Environment): Promise<void> {
  console.log('Validating API token...');
  
  // Create session with token - let saveSession handle expiration
  const basePortalUrl = normalizeBasePortalUrl(sharingRestUrl);
  const session = new UserSession({
    portal: basePortalUrl,
    token
  });
  
  try {
    // Validate token by making a test request
    await session.getUser();
    await saveSession(session, env);
    console.log('✓ Enterprise session established successfully');
    console.log(`✓ Authenticated as: ${session.username || 'unknown user'}`);
  } catch (error) {
    throw new Error('Invalid token or portal unreachable. Please verify your token and portal URL.');
  }
}

async function handleUsernameLogin(sharingRestUrl: string, basePortalUrl: string, username: string, env?: Environment): Promise<void> {
  // Secure password prompt with masking
  const password = await securePasswordPrompt('Enter password: ');
  
  console.log('Authenticating with username/password...');
  
  try {
    console.log(`Attempting authentication with base portal: ${basePortalUrl}`);
    
    const session = new UserSession({
      username,
      password,
      portal: basePortalUrl
    });

    // Trigger authentication by requesting a token
    const token = await session.getToken(basePortalUrl);
    
    if (!token) {
      throw new Error('No token received from portal');
    }
    
    await saveSession(session, env);
    console.log('✓ Authentication successful');
    console.log(`✓ Authenticated as: ${username}`);
    console.log(`✓ Token: ${token.substring(0, 20)}...`);
    
  } catch (error) {
    // Fallback to manual token generation with corrected parameters
    console.log('UserSession authentication failed, trying manual token generation...');
    await fallbackTokenGeneration(sharingRestUrl, basePortalUrl, username, password, env);
  }
}

async function fallbackTokenGeneration(sharingRestUrl: string, basePortalUrl: string, username: string, password: string, env?: Environment): Promise<void> {
  try {
    // Use the correct generateToken endpoint - use the full sharing/rest URL
    const tokenUrl = `${sharingRestUrl}/generateToken`;
    
    console.log(`Trying manual token generation at: ${tokenUrl}`);
    
    const requestBody = new URLSearchParams({
      username,
      password,
      expiration: '120', // 2 hours in minutes
      referer: 'https://www.arcgis.com', // Use referer instead of client
      f: 'json'
    });
    
    console.log(`Request body params: ${Array.from(requestBody.entries()).map(([k,v]) => k === 'password' ? `${k}=***` : `${k}=${v}`).join(', ')}`);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers: [Available]`);

    if (!response.ok) {
      const responseText = await response.text();
      console.log(`Response body: ${responseText}`);
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log(`Raw response: ${responseText}`);
    
    const tokenData = JSON.parse(responseText);
    console.log(`Parsed response:`, tokenData);
    
    if (tokenData.error) {
      const error = tokenData.error;
      let errorMsg = error.message || 'Unknown error';
      
      // Add specific error details if available
      if (error.details && error.details.length > 0) {
        errorMsg += `\nDetails: ${error.details.join(', ')}`;
      }
      
      // Add error code if available
      if (error.code) {
        errorMsg += `\nError Code: ${error.code}`;
      }
      
      // Provide specific guidance based on error type
      if (error.code === 400) {
        if (error.details?.some((d: any) => d.toLowerCase().includes('too many invalid logins'))) {
          errorMsg += '\n\n⚠️  Account temporarily locked due to too many failed login attempts.';
          errorMsg += '\n   Please wait a few minutes before trying again or contact your administrator.';
        } else if (error.details?.some((d: any) => d.toLowerCase().includes('invalid credentials'))) {
          errorMsg += '\n\n⚠️  Invalid username or password.';
          errorMsg += '\n   Please verify your credentials and try again.';
        }
      }
      
      throw new Error(`Authentication failed: ${errorMsg}`);
    }
    
    if (!tokenData.token) {
      throw new Error('No token received from portal');
    }
    
    // Create session with generated token
    const session = new UserSession({
      portal: basePortalUrl,
      token: tokenData.token,
      username,
      tokenExpires: new Date(tokenData.expires || Date.now() + 7200000) // 2 hours default
    });
    
    await saveSession(session, env);
    console.log('✓ Manual token generation successful');
    console.log(`✓ Authenticated as: ${username}`);
    console.log(`✓ Token expires: ${session.tokenExpires.toLocaleString()}`);
    
  } catch (error) {
    // Re-throw authentication errors as-is (they're already well formatted)
    if ((error as Error).message.startsWith('Authentication failed:')) {
      throw error;
    }
    throw new Error(`Manual token generation failed: ${(error as Error).message}`);
  }
}

function showEnterpriseAuthInstructions(portal: string): void {
  // Use the same normalization logic as the rest of the app
  const basePortal = normalizeBasePortalUrl(portal);
  
  console.log('');
  console.log('Enterprise Authentication Options:');
  console.log('');
  console.log('Option 1: Username/Password Authentication');
  console.log(`   arc login --portal ${portal} --username YOUR_USERNAME`);
  console.log('');
  console.log('Option 2: API Token Authentication');
  console.log('1. Access your portal:');
  console.log(`   ${basePortal}/home/user.html`);
  console.log('2. Navigate to "My Settings" > "Developer Settings"');
  console.log('3. Generate a new API Token with appropriate privileges');
  console.log('4. Run the following command:');
  console.log(`   arc login --portal ${portal} --token YOUR_API_TOKEN`);
  console.log('');
  console.log('Note: Username/password auth automatically generates a token via:');
  console.log(`   ${portal}/generateToken`);
  console.log('');
}

function showArcGISOnlineInstructions(): void {
  console.log('');
  console.log('ArcGIS Online Authentication:');
  console.log('OAuth2 flow will be available in a future update.');
  console.log('');
  console.log('For now, use manual token authentication:');
  console.log('1. Go to https://developers.arcgis.com/sign-in/');
  console.log('2. Sign in to your ArcGIS account');
  console.log('3. Generate a token');
  console.log('4. Run: arc login --token <your-token>');
  console.log('');
}

interface LogoutOptions {
  env?: Environment;
  all?: boolean;
}

export async function logoutCommand(options: LogoutOptions = {}): Promise<void> {
  try {
    if (options.all) {
      // Import the function we need
      const { clearAllSessions } = await import('../session.js');
      await clearAllSessions();
      console.log('Successfully logged out from all environments');
    } else {
      await clearSession(options.env);
      const envName = options.env || getCurrentEnvironment();
      console.log(`Successfully logged out from environment: ${envName}`);
    }
  } catch (error) {
    handleError(error, 'Logout failed');
  }
}

// New command to show current environment status
export async function statusCommand(): Promise<void> {
  try {
    const currentEnv = getCurrentEnvironment();
    const session = await getSession(currentEnv);
    
    console.log(`Current environment: ${currentEnv}`);
    
    if (session) {
      console.log(`Authenticated as: ${session.username || 'API Token User'}`);
      console.log(`Portal: ${session.portal}`);
      
      // Check token expiration
      if (session.tokenExpires) {
        const remaining = session.tokenExpires.getTime() - Date.now();
        const minutes = Math.floor(remaining / 60000);
        console.log(`Token expires in: ${minutes} minutes`);
      }
    } else {
      console.log('Not authenticated');
    }
    
    // Show all available environments
    const envs = listEnvironments();
    console.log('\nAvailable environments:');
    Object.entries(envs).forEach(([name, portal]) => {
      const marker = name === currentEnv ? ' (current)' : '';
      console.log(`  ${name}: ${portal}${marker}`);
    });
  } catch (error) {
    handleError(error, 'Status check failed');
  }
}