# Template Management API Documentation

## Overview
The Template Management API provides functionality for Marketing Managers to create, manage, and use message templates with parameterized content. Templates support HTML, text, and image formats with dynamic parameter replacement.

## Base URL
```
/api/templates
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get All Templates
**GET** `/api/templates`

Retrieves all templates for the authenticated marketing manager with pagination and filtering.

#### Query Parameters
- `search` (string, optional): Search templates by name or content
- `type` (string, optional): Filter by template type (`html`, `text`, `image`)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "template_id",
      "name": "Welcome Message",
      "content": "Hello #FirstName #LastName, welcome to our team!",
      "type": "text",
      "parameters": ["FirstName", "LastName"],
      "imageUrl": null,
      "createdBy": {
        "_id": "user_id",
        "name": "Marketing Manager",
        "email": "manager@example.com"
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "stats": {
    "totalTemplates": 25,
    "htmlTemplates": 10,
    "textTemplates": 12,
    "imageTemplates": 3
  }
}
```

### 2. Get Template by ID
**GET** `/api/templates/:id`

Retrieves a specific template by its ID.

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "template_id",
    "name": "Welcome Message",
    "content": "Hello #FirstName #LastName, welcome to our team!",
    "type": "text",
    "parameters": ["FirstName", "LastName"],
    "imageUrl": null,
    "createdBy": {
      "_id": "user_id",
      "name": "Marketing Manager",
      "email": "manager@example.com"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Create Template
**POST** `/api/templates`

Creates a new template.

#### Request Body
```json
{
  "name": "Welcome Message",
  "content": "Hello #FirstName #LastName, welcome to our team!",
  "type": "text",
  "parameters": ["FirstName", "LastName"],
  "imageUrl": null
}
```

#### Validation Rules
- `name`: Required, 2-100 characters, must be unique per user
- `content`: Required, 1-10000 characters
- `type`: Optional, must be one of: `html`, `text`, `image` (default: `text`)
- `parameters`: Optional array of parameter names (auto-extracted from content if not provided)
- `imageUrl`: Optional, valid URL

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "template_id",
    "name": "Welcome Message",
    "content": "Hello #FirstName #LastName, welcome to our team!",
    "type": "text",
    "parameters": ["FirstName", "LastName"],
    "imageUrl": null,
    "createdBy": {
      "_id": "user_id",
      "name": "Marketing Manager",
      "email": "manager@example.com"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Template created successfully"
}
```

### 4. Update Template
**PUT** `/api/templates/:id`

Updates an existing template.

#### Request Body
```json
{
  "name": "Updated Welcome Message",
  "content": "Hello #FirstName #LastName, welcome to our team! Your ID is #MRId",
  "type": "text",
  "parameters": ["FirstName", "LastName", "MRId"]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "template_id",
    "name": "Updated Welcome Message",
    "content": "Hello #FirstName #LastName, welcome to our team! Your ID is #MRId",
    "type": "text",
    "parameters": ["FirstName", "LastName", "MRId"],
    "imageUrl": null,
    "createdBy": {
      "_id": "user_id",
      "name": "Marketing Manager",
      "email": "manager@example.com"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Template updated successfully"
}
```

### 5. Delete Template
**DELETE** `/api/templates/:id`

Soft deletes a template (sets `isActive` to false).

#### Response
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### 6. Upload Template Image
**POST** `/api/templates/upload-image`

Uploads an image file for image templates.

#### Request
- Content-Type: `multipart/form-data`
- Body: `image` file

#### Response
```json
{
  "success": true,
  "data": {
    "imageUrl": "/uploads/template_image_1234567890.jpg"
  },
  "message": "Image uploaded successfully"
}
```

### 7. Get Template Statistics
**GET** `/api/templates/stats`

Retrieves template statistics for the authenticated user.

#### Response
```json
{
  "success": true,
  "data": {
    "totalTemplates": 25,
    "htmlTemplates": 10,
    "textTemplates": 12,
    "imageTemplates": 3,
    "avgParameters": 2.5
  }
}
```

### 8. Export Templates
**GET** `/api/templates/export`

Exports templates to CSV format.

#### Query Parameters
- `type` (string, optional): Filter by template type

#### Response
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename=templates.csv`

## Template Parameter System

### Parameter Format
Parameters in templates use the format `#ParameterName` (e.g., `#FirstName`, `#LastName`, `#MRId`).

### Auto-Extraction
When creating or updating templates, parameters are automatically extracted from the content if not explicitly provided.

### Parameter Validation
The system validates that all required parameters are provided when processing templates for campaigns.

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Template name already exists"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Template not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create template"
}
```

## Template Types

### 1. Text Templates
- Plain text content with parameters
- Suitable for SMS and simple WhatsApp messages
- Example: `"Hello #FirstName, your target is #TargetAmount"`

### 2. HTML Templates
- Rich HTML content with parameters
- Suitable for email and web-based messaging
- Example: `"<h1>Hello #FirstName</h1><p>Your target is <strong>#TargetAmount</strong></p>"`

### 3. Image Templates
- Image-based templates with optional text overlay
- Suitable for visual messaging
- Uses `imageUrl` field for the image file

## Usage Examples

### Creating a Welcome Template
```bash
curl -X POST /api/templates \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New MR Welcome",
    "content": "Welcome #FirstName #LastName! Your MR ID is #MRId. You are assigned to #GroupName group.",
    "type": "text"
  }'
```

### Creating an HTML Template
```bash
curl -X POST /api/templates \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Report",
    "content": "<h2>Monthly Report for #Month</h2><p>Hello #FirstName, your performance: #Performance%</p>",
    "type": "html"
  }'
```

### Searching Templates
```bash
curl -X GET "/api/templates?search=welcome&type=text" \
  -H "Authorization: Bearer <token>"
```

## Database Schema

### Template Collection
```javascript
{
  _id: ObjectId,
  name: String (unique, required),
  content: String (required),
  type: String (enum: ['html', 'text', 'image']),
  imageUrl: String (optional),
  parameters: [String],
  createdBy: ObjectId (ref: 'User'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Considerations

1. **User Isolation**: Templates are isolated per marketing manager
2. **Input Validation**: All inputs are validated and sanitized
3. **File Upload Security**: Image uploads are validated for type and size
4. **Parameter Injection Prevention**: Parameters are safely replaced without code execution
5. **Soft Delete**: Templates are soft-deleted to maintain data integrity

## Performance Considerations

1. **Indexing**: Templates are indexed by `createdBy` and `isActive` for efficient querying
2. **Pagination**: All list endpoints support pagination
3. **Caching**: Consider implementing caching for frequently accessed templates
4. **File Storage**: Images are stored in the `/uploads` directory with unique filenames
