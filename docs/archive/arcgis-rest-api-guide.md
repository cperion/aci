# ArcGIS REST API Guide

## Table of Contents
1. [ArcGIS REST JS API](#arcgis-rest-js-api)
2. [ArcGIS Server Admin API (Direct REST)](#arcgis-server-admin-api-direct-rest)
3. [Other Admin APIs Requiring Direct REST](#other-admin-apis-requiring-direct-rest)

## ArcGIS REST JS API

The official TypeScript/JavaScript library from Esri for working with ArcGIS REST services.

### Installation

```bash
npm install @esri/arcgis-rest-request @esri/arcgis-rest-auth @esri/arcgis-rest-portal @esri/arcgis-rest-feature-service
```

### 1. @esri/arcgis-rest-request (Core Module)

The foundation for all other packages, handling HTTP requests to ArcGIS REST endpoints.

```typescript
import { request, cleanUrl, appendCustomParams } from "@esri/arcgis-rest-request";

// Core features:
- request() - Make authenticated HTTP requests to ArcGIS REST endpoints
- cleanUrl() - Normalize URLs
- appendCustomParams() - Add custom parameters
- Error handling with ArcGISRequestError
- Automatic token handling
- Request/response interceptors
```

### 2. @esri/arcgis-rest-auth (Authentication)

Handles all authentication flows for ArcGIS services.

```typescript
import { ArcGISIdentityManager, ApplicationSession, UserSession } from "@esri/arcgis-rest-auth";

// Authentication methods:
- UserSession - For user login (OAuth 2.0, username/password)
  • beginOAuth2() - Start OAuth flow
  • completeOAuth2() - Complete OAuth flow
  • fromCredential() - From existing credential
  • serialize()/deserialize() - Persist sessions
  • getToken() - Get valid token
  • refreshSession() - Refresh expired tokens

- ApplicationSession - For app credentials
  • Used for server-to-server communication
  • No user context required

- ArcGISIdentityManager - Manages multiple sessions
  • Portal federation support
  • Token management across services
```

### 3. @esri/arcgis-rest-portal (Portal & Content Management)

Comprehensive portal and content operations.

```typescript
import { 
  searchItems, getItem, createItem, updateItem, removeItem,
  getUser, searchUsers, createGroup, searchGroups,
  shareItemWithGroup, unshareItemWithGroup,
  addItemResource, updateItemResource,
  moveItem, protectItem, unprotectItem
} from "@esri/arcgis-rest-portal";

// Item Management:
- searchItems() - Search portal items with queries
- getItem() - Get item details
- createItem() - Create new items
- updateItem() - Update existing items
- removeItem() - Delete items
- moveItem() - Move between folders
- protectItem()/unprotectItem() - Prevent deletion

// User & Group Management:
- getUser() - Get user profile
- searchUsers() - Find users
- createGroup() - Create groups
- updateGroup() - Modify groups
- searchGroups() - Find groups
- joinGroup()/leaveGroup()

// Sharing & Permissions:
- shareItemWithGroup()
- unshareItemWithGroup()
- setItemAccess() - public/org/private
- reassignItem() - Transfer ownership

// Resources:
- addItemResource() - Attach files
- updateItemResource() - Update attachments
- removeItemResource() - Delete attachments

// Folders:
- createFolder()
- removeFolder()
- getUserContent() - List user's items/folders
```

### 4. @esri/arcgis-rest-feature-service (Feature Service Operations)

Work with feature data - query, edit, analyze.

```typescript
import {
  queryFeatures, getFeature, addFeatures, updateFeatures, deleteFeatures,
  queryRelated, getAttachments, addAttachment, updateAttachment, deleteAttachments,
  getLayer, getLayers, getService,
  applyEdits, calculateStatistics, queryTopFeatures
} from "@esri/arcgis-rest-feature-service";

// Query Operations:
- queryFeatures() - Query with SQL where clause, geometry, etc.
- getFeature() - Get single feature by ID
- queryRelated() - Query related records
- queryTopFeatures() - Get top features by attribute

// Editing:
- addFeatures() - Insert new features
- updateFeatures() - Update existing features  
- deleteFeatures() - Delete features
- applyEdits() - Batch add/update/delete

// Attachments:
- getAttachments() - List feature attachments
- addAttachment() - Upload files to features
- updateAttachment() - Replace attachments
- deleteAttachments() - Remove attachments

// Service Info:
- getService() - Service metadata
- getLayer() - Layer properties
- getLayers() - All layers in service

// Analysis:
- calculateStatistics() - Get field statistics
- generateRenderer() - Create data-driven symbology
```

### 5. @esri/arcgis-rest-geocoding (Geocoding Services)

Address and coordinate conversions.

```typescript
import {
  geocode, reverseGeocode, suggest, bulkGeocode,
  getGeocoderInfo
} from "@esri/arcgis-rest-geocoding";

// Geocoding Operations:
- geocode() - Convert addresses to coordinates
  • Single line input
  • Multi-field input
  • Place name search
  • Extent/location biasing

- reverseGeocode() - Convert coordinates to addresses
  • Get nearest address
  • Custom search radius
  • Return intersection info

- suggest() - Autocomplete suggestions
  • Real-time typing suggestions
  • Category filtering

- bulkGeocode() - Batch geocoding
  • Process multiple addresses
  • Async batch operations

- getGeocoderInfo() - Service capabilities
```

### 6. @esri/arcgis-rest-routing (Routing & Directions)

Network analysis and routing.

```typescript
import {
  solveRoute, solveServiceArea, solveClosestFacility,
  solveLocationAllocation, solveVehicleRoutingProblem,
  solveOriginDestinationCostMatrix
} from "@esri/arcgis-rest-routing";

// Routing Operations:
- solveRoute() - Point-to-point directions
  • Multiple stops
  • Barriers/restrictions
  • Travel modes (driving, walking, trucking)
  • Time-based routing
  • Return directions

- solveServiceArea() - Drive/walk time polygons
  • Multiple facilities
  • Break values (5, 10, 15 min)
  • Detailed/generalized polygons

- solveClosestFacility() - Find nearest locations
  • Incidents to facilities
  • Travel cost cutoffs
  • Number of facilities to find

- solveVehicleRoutingProblem() - Fleet routing
  • Multiple vehicles
  • Capacities/time windows
  • Pickup/delivery orders

- solveOriginDestinationCostMatrix() - Travel time/distance matrix
```

### 7. @esri/arcgis-rest-demographics (GeoEnrichment)

Demographic and lifestyle data.

```typescript
import {
  queryDemographicData, getAvailableCountries,
  getAvailableDataCollections, getAvailableGeographyLevels
} from "@esri/arcgis-rest-demographics";

// Demographics Operations:
- queryDemographicData() - Get demographic info
  • Population, income, age
  • Lifestyle/consumer data
  • Business data
  • Custom study areas

- getAvailableCountries() - Supported countries
- getAvailableDataCollections() - Data variables
- getAvailableGeographyLevels() - Geographic units
```

### Common Types and Utilities

```typescript
// Common Types (used across all packages):
interface IRequestOptions {
  authentication?: UserSession | ApplicationSession;
  portal?: string;
  fetch?: Function;
  headers?: Headers;
}

interface IItem {
  id: string;
  owner: string;
  title: string;
  type: string;
  // ... many more properties
}

interface IFeature {
  attributes: Record<string, any>;
  geometry?: IGeometry;
}

// Error Handling:
class ArcGISRequestError extends Error {
  code: string | number;
  response: Response;
  url: string;
  options: IRequestOptions;
}

// Geometry Types:
IPoint, IPolyline, IPolygon, IEnvelope, ISpatialReference
```

### Complete Example - TypeScript Setup

```typescript
// 1. Installation
npm install @esri/arcgis-rest-request @esri/arcgis-rest-auth @esri/arcgis-rest-portal @esri/arcgis-rest-feature-service

// 2. Authentication Setup
import { UserSession } from "@esri/arcgis-rest-auth";

const session = new UserSession({
  clientId: "YOUR_CLIENT_ID",
  redirectUri: "http://localhost:3000/auth",
  portal: "https://www.arcgis.com/sharing/rest"
});

// 3. Portal Operations
import { searchItems, createItem } from "@esri/arcgis-rest-portal";

const items = await searchItems({
  q: "type:Feature Service",
  num: 10,
  authentication: session
});

// 4. Feature Service Operations  
import { queryFeatures, addFeatures } from "@esri/arcgis-rest-feature-service";

const results = await queryFeatures({
  url: "https://services.arcgis.com/.../FeatureServer/0",
  where: "STATE = 'CA'",
  outFields: ["*"],
  authentication: session
});

// 5. Geocoding
import { geocode } from "@esri/arcgis-rest-geocoding";

const result = await geocode({
  address: "380 New York Street, Redlands CA",
  authentication: session
});
```

## ArcGIS Server Admin API (Direct REST)

The ArcGIS REST JS API doesn't include server administration capabilities. You'll need to make direct REST calls for these operations.

### What's NOT Covered by JS API

#### 1. Server Administration
```typescript
// Direct REST endpoints you'll need to call:
POST https://server.domain.com/arcgis/admin/generateToken
GET  https://server.domain.com/arcgis/admin/services
POST https://server.domain.com/arcgis/admin/services/createService
POST https://server.domain.com/arcgis/admin/services/[service]/start
POST https://server.domain.com/arcgis/admin/services/[service]/stop
POST https://server.domain.com/arcgis/admin/services/[service]/delete
```

#### 2. Service Management
- Create/delete services
- Start/stop services  
- Edit service properties
- Service statistics
- Service status monitoring
- Service manifest operations

#### 3. Server Operations
- Server logs
- Server directories
- Data store management
- Machine management (add/remove)
- Cluster management
- KML/WFS/WCS/WMS capabilities

#### 4. Security Administration
- User/role management
- Token administration
- Security configuration
- Service permissions

#### 5. System Management
- Server properties
- Handler management
- Extension management
- Upload service definitions
- Cache management for map services

### Example: Direct REST Calls for Admin

```typescript
import { request } from "@esri/arcgis-rest-request";

// Generate admin token
async function getAdminToken(serverUrl: string, username: string, password: string) {
  const response = await fetch(`${serverUrl}/admin/generateToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${username}&password=${password}&f=json&expiration=60`
  });
  return response.json();
}

// List all services
async function listServices(serverUrl: string, token: string) {
  const response = await fetch(`${serverUrl}/admin/services?f=json&token=${token}`);
  return response.json();
}

// Stop a service
async function stopService(serverUrl: string, servicePath: string, token: string) {
  const response = await fetch(`${serverUrl}/admin/services/${servicePath}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `f=json&token=${token}`
  });
  return response.json();
}

// Start a service
async function startService(serverUrl: string, servicePath: string, token: string) {
  const response = await fetch(`${serverUrl}/admin/services/${servicePath}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `f=json&token=${token}`
  });
  return response.json();
}

// Get service configuration
async function getServiceConfig(serverUrl: string, servicePath: string, token: string) {
  const response = await fetch(`${serverUrl}/admin/services/${servicePath}?f=json&token=${token}`);
  return response.json();
}

// Update service configuration
async function updateServiceConfig(serverUrl: string, servicePath: string, token: string, config: any) {
  const response = await fetch(`${serverUrl}/admin/services/${servicePath}/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `service=${encodeURIComponent(JSON.stringify(config))}&f=json&token=${token}`
  });
  return response.json();
}

// Get server logs
async function getServerLogs(serverUrl: string, token: string, filter: string = 'SEVERE') {
  const response = await fetch(`${serverUrl}/admin/logs/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `f=json&token=${token}&filter={"logLevel":"${filter}"}`
  });
  return response.json();
}

// Upload service definition
async function uploadServiceDefinition(serverUrl: string, token: string, file: File) {
  const formData = new FormData();
  formData.append('itemFile', file);
  formData.append('f', 'json');
  formData.append('token', token);

  const response = await fetch(`${serverUrl}/admin/uploads/upload`, {
    method: 'POST',
    body: formData
  });
  return response.json();
}

// Create new service from definition
async function createService(serverUrl: string, token: string, uploadId: string) {
  const response = await fetch(`${serverUrl}/admin/services/createService`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `f=json&token=${token}&uploadId=${uploadId}&uploadFormat=sd`
  });
  return response.json();
}
```

## Other Admin APIs Requiring Direct REST

### 1. ArcGIS Portal Admin API
Different from the Portal API - focuses on system administration.

```typescript
// Portal Admin endpoints:
POST https://portal.domain.com/portal/portaladmin/generateToken
GET  https://portal.domain.com/portal/portaladmin/system
POST https://portal.domain.com/portal/portaladmin/system/licenses/update
GET  https://portal.domain.com/portal/portaladmin/logs
POST https://portal.domain.com/portal/portaladmin/system/indexer/reindex
```

Operations include:
- System properties configuration
- Federation management
- License management
- Portal logs
- Database/index management
- Web adaptor configuration

### 2. GeoEvent Server Admin
Real-time data processing administration.

```typescript
// GeoEvent endpoints:
GET  https://geoevent.domain.com/geoevent/admin/
POST https://geoevent.domain.com/geoevent/admin/input/create
POST https://geoevent.domain.com/geoevent/admin/output/create
POST https://geoevent.domain.com/geoevent/admin/geoeventdefinition/create
```

Operations include:
- Input/output connector management
- GeoEvent definitions
- Real-time analytics configuration
- Stream service management

### 3. ArcGIS Data Store Admin
Manages various data storage types.

```typescript
// Data Store endpoints:
GET  https://datastore.domain.com:2443/arcgis/datastoreadmin/configure
POST https://datastore.domain.com:2443/arcgis/datastoreadmin/data/backup
POST https://datastore.domain.com:2443/arcgis/datastoreadmin/data/restore
```

Operations include:
- Backup/restore operations
- Data store configuration
- Relational data store management
- Tile cache data store management
- Spatiotemporal big data store management

### 4. Workflow Manager Server
Job and workflow administration.

```typescript
// Workflow Manager endpoints:
POST https://workflow.domain.com/workflow/admin/jobs/create
GET  https://workflow.domain.com/workflow/admin/jobtypes
POST https://workflow.domain.com/workflow/admin/workflows/create
```

Operations include:
- Job management
- Workflow configuration
- Job type definitions
- Step configurations

## Summary

- **Use ArcGIS REST JS API** for: Portal content management, feature service operations, geocoding, routing, and general data operations
- **Use Direct REST** for: Server administration, service management, system configuration, logs, and any infrastructure-level operations
- The JS API focuses on content and data operations, while administrative tasks require constructing REST calls manually
- All admin APIs require proper authentication tokens and typically run on different ports/endpoints than the standard services