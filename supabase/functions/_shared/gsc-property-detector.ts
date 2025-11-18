/**
 * Helper functions for detecting and validating GSC property URLs
 */

export interface GSCProperty {
  siteUrl: string;
  permissionLevel: string;
}

/**
 * List all GSC properties that the Service Account has access to
 */
export async function listAvailableGSCProperties(accessToken: string): Promise<GSCProperty[]> {
  console.log('🔍 Listing available GSC properties...');
  
  const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Failed to list GSC properties:', errorData);
    throw new Error(`Failed to list GSC properties: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const properties: GSCProperty[] = data.siteEntry || [];
  
  console.log(`✅ Found ${properties.length} GSC properties:`, properties.map(p => p.siteUrl));
  
  return properties;
}

/**
 * Detect the correct GSC property URL from a site URL
 * Tests common variations: with/without www, with/without trailing slash, http/https
 */
export async function detectCorrectPropertyUrl(
  accessToken: string,
  siteUrl: string
): Promise<string | null> {
  console.log('🔍 Detecting correct property URL for:', siteUrl);
  
  // Get all available properties
  const availableProperties = await listAvailableGSCProperties(accessToken);
  const availableUrls = availableProperties.map(p => p.siteUrl);
  
  if (availableUrls.length === 0) {
    console.log('⚠️ No GSC properties available for this Service Account');
    return null;
  }

  // Normalize the input site URL
  const normalized = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Generate variations to test
  const variations = [
    `https://${normalized}`,
    `https://${normalized}/`,
    `http://${normalized}`,
    `http://${normalized}/`,
    `https://www.${normalized}`,
    `https://www.${normalized}/`,
    `http://www.${normalized}`,
    `http://www.${normalized}/`,
    // Remove www if present
    `https://${normalized.replace(/^www\./, '')}`,
    `https://${normalized.replace(/^www\./, '')}/`,
  ];

  console.log('🔍 Testing variations:', variations);

  // Find exact match
  for (const variation of variations) {
    if (availableUrls.includes(variation)) {
      console.log(`✅ Found exact match: ${variation}`);
      return variation;
    }
  }

  console.log('⚠️ No exact match found. Available properties:', availableUrls);
  
  // Return the first available property as fallback
  return availableUrls[0] || null;
}

/**
 * Compare configured URL with available properties and provide suggestions
 */
export async function comparePropertyUrl(
  accessToken: string,
  configuredUrl: string | null,
  siteUrl: string
): Promise<{
  available_properties: string[];
  configured_url: string | null;
  url_matches: boolean;
  suggested_url: string | null;
}> {
  const availableProperties = await listAvailableGSCProperties(accessToken);
  const availableUrls = availableProperties.map(p => p.siteUrl);
  
  const suggestedUrl = await detectCorrectPropertyUrl(accessToken, siteUrl);
  
  const urlMatches = configuredUrl 
    ? availableUrls.includes(configuredUrl)
    : false;

  return {
    available_properties: availableUrls,
    configured_url: configuredUrl,
    url_matches: urlMatches,
    suggested_url: suggestedUrl,
  };
}
