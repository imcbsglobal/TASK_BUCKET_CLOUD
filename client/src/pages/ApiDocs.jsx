import { useState } from 'react';
import Layout from '../components/Layout';

const ApiDocs = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState(null);

  const copyToClipboard = (text, endpoint) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const baseUrl = 'http://localhost:8000/api';
  const apiKey = 'imcbs-secret-key-2025';

  const endpoints = [
    {
      id: 'upload',
      method: 'POST',
      path: '/upload/',
      title: 'Upload Image',
      description: 'Upload a new image to Cloudflare R2 storage with optional metadata.',
      headers: [
        { key: 'X-API-Key', value: apiKey, description: 'Required API key for authentication' },
        { key: 'Content-Type', value: 'multipart/form-data', description: 'Required for file upload' }
      ],
      requestBody: {
        type: 'multipart/form-data',
        fields: [
          { name: 'image', type: 'file', required: true, description: 'Image file to upload (jpg, png, gif, webp, bmp)' },
          { name: 'name', type: 'string', required: false, description: 'Optional name/title for the image' },
          { name: 'description', type: 'string', required: false, description: 'Optional description of the image' }
        ]
      },
      successResponse: {
        status: 201,
        example: `{
  "success": true,
  "id": 1,
  "url": "https://your-r2-bucket.example.com/abc123.jpg",
  "filename": "abc123.jpg",
  "original_filename": "photo.jpg",
  "name": "My Photo",
  "description": "A beautiful sunset",
  "size": 245678,
  "uploaded_at": "2025-12-10T10:30:00Z"
}`
      },
      errorResponse: {
        status: 400,
        example: `{
  "success": false,
  "error": "No image file provided. Please send a file with key \\"image\\"."
}`
      },
      curlExample: `curl -X POST ${baseUrl}/upload/ \\
  -H "X-API-Key: ${apiKey}" \\
  -F "image=@/path/to/your/image.jpg" \\
  -F "name=My Photo" \\
  -F "description=A beautiful sunset"`
    },
    {
      id: 'list',
      method: 'GET',
      path: '/list/',
      title: 'List All Images',
      description: 'Retrieve a list of all uploaded images with their metadata.',
      headers: [
        { key: 'X-API-Key', value: apiKey, description: 'Required API key for authentication' }
      ],
      requestBody: null,
      successResponse: {
        status: 200,
        example: `{
  "success": true,
  "count": 2,
  "images": [
    {
      "id": 1,
      "filename": "abc123.jpg",
      "url": "https://your-r2-bucket.example.com/abc123.jpg",
      "original_filename": "photo.jpg",
      "name": "My Photo",
      "description": "A beautiful sunset",
      "size": 245678,
      "uploaded_at": "2025-12-10T10:30:00Z"
    },
    {
      "id": 2,
      "filename": "def456.png",
      "url": "https://your-r2-bucket.example.com/def456.png",
      "original_filename": "screenshot.png",
      "name": "Screenshot",
      "description": null,
      "size": 123456,
      "uploaded_at": "2025-12-10T11:00:00Z"
    }
  ]
}`
      },
      errorResponse: {
        status: 500,
        example: `{
  "success": false,
  "error": "Failed to list images: Database connection error"
}`
      },
      curlExample: `curl -X GET ${baseUrl}/list/ \\
  -H "X-API-Key: ${apiKey}"`
    },
    {
      id: 'update',
      method: 'PUT',
      path: '/update/<image_id>/',
      title: 'Update Image Metadata',
      description: 'Update the name and/or description of an existing image.',
      headers: [
        { key: 'X-API-Key', value: apiKey, description: 'Required API key for authentication' },
        { key: 'Content-Type', value: 'application/json', description: 'Required for JSON body' }
      ],
      requestBody: {
        type: 'application/json',
        fields: [
          { name: 'name', type: 'string', required: false, description: 'New name/title for the image' },
          { name: 'description', type: 'string', required: false, description: 'New description for the image' }
        ],
        example: `{
  "name": "Updated Photo Title",
  "description": "Updated description text"
}`
      },
      successResponse: {
        status: 200,
        example: `{
  "success": true,
  "id": 1,
  "filename": "abc123.jpg",
  "url": "https://your-r2-bucket.example.com/abc123.jpg",
  "original_filename": "photo.jpg",
  "name": "Updated Photo Title",
  "description": "Updated description text",
  "size": 245678,
  "uploaded_at": "2025-12-10T10:30:00Z"
}`
      },
      errorResponse: {
        status: 404,
        example: `{
  "success": false,
  "error": "Image with id 999 not found."
}`
      },
      curlExample: `curl -X PUT ${baseUrl}/update/1/ \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Updated Photo Title", "description": "Updated description text"}'`
    },
    {
      id: 'delete',
      method: 'DELETE',
      path: '/delete/<image_id>/',
      title: 'Delete Image',
      description: 'Delete an image from both the database and Cloudflare R2 storage.',
      headers: [
        { key: 'X-API-Key', value: apiKey, description: 'Required API key for authentication' }
      ],
      requestBody: null,
      successResponse: {
        status: 200,
        example: `{
  "success": true,
  "message": "Image 1 deleted successfully."
}`
      },
      errorResponse: {
        status: 404,
        example: `{
  "success": false,
  "error": "Image with id 999 not found."
}`
      },
      curlExample: `curl -X DELETE ${baseUrl}/delete/1/ \\
  -H "X-API-Key: ${apiKey}"`
    }
  ];

  const methodColors = {
    GET: 'bg-success/10 text-success dark:bg-success/20 dark:text-success',
    POST: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
    PUT: 'bg-yellow-neon/10 text-yellow-neon dark:bg-yellow-neon/20 dark:text-yellow-neon',
    DELETE: 'bg-error/10 text-error dark:bg-error/20 dark:text-error'
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="gradient-text text-3xl sm:text-4xl font-bold mb-4">
              API Documentation
            </h1>
            <p className="text-lg text-text-secondary mb-6">
              Complete guide to using the TaskBucket Cloud Image API
            </p>

            {/* Base URL & Authentication */}
            <div className="bg-card rounded-lg border border-purple-neon/20 p-6 mb-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Base URL
              </h2>
              <div className="bg-background rounded p-3 font-mono text-sm text-text-primary mb-6">
                {baseUrl}
              </div>

              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Authentication
              </h2>
              <p className="text-text-secondary mb-3">
                All API requests require an API key passed in the request header:
              </p>
              <div className="bg-card rounded p-3 mb-3">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-text-primary">
                    <span className="text-primary">X-API-Key:</span> {apiKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(apiKey, 'apiKey')}
                    className="ml-4 px-3 py-1 text-xs bg-card border border-purple-neon/10 hover:bg-card/90 rounded transition-colors"
                  >
                    {copiedEndpoint === 'apiKey' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="text-sm text-text-secondary">
                Include this header in every request for authentication.
              </p>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-8">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                id={endpoint.id}
                className="bg-card rounded-lg border border-purple-neon/20 overflow-hidden"
              >
                {/* Endpoint Header */}
                <div className="bg-background px-6 py-4 border-b border-purple-neon/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded font-semibold text-sm ${methodColors[endpoint.method]}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-text-primary font-mono text-sm">
                        {endpoint.path}
                      </code>
                    </div>
                    <a
                      href={`#${endpoint.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Link to this section
                    </a>
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mt-3">
                    {endpoint.title}
                  </h3>
                  <p className="text-text-secondary mt-2">
                    {endpoint.description}
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Headers */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">
                      Request Headers
                    </h4>
                    <div className="space-y-2">
                      {endpoint.headers.map((header, idx) => (
                        <div key={idx} className="bg-card rounded p-3">
                          <div className="flex items-start gap-2">
                            <code className="text-sm text-primary font-semibold">
                              {header.key}:
                            </code>
                            <code className="text-sm text-text-primary flex-1">
                              {header.value}
                            </code>
                          </div>
                          <p className="text-xs text-text-secondary mt-1 ml-2">
                            {header.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Request Body */}
                  {endpoint.requestBody && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">
                        Request Body ({endpoint.requestBody.type})
                      </h4>
                      <div className="space-y-2">
                        {endpoint.requestBody.fields.map((field, idx) => (
                          <div key={idx} className="bg-card rounded p-3">
                            <div className="flex items-center gap-2">
                              <code className="text-sm text-primary font-semibold">
                                {field.name}
                              </code>
                              <span className="text-xs text-text-secondary">
                                ({field.type})
                              </span>
                              {field.required && (
                                <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded">
                                  required
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary mt-1">
                              {field.description}
                            </p>
                          </div>
                        ))}
                      </div>
                      {endpoint.requestBody.example && (
                        <div className="mt-3">
                            <p className="text-xs text-text-secondary mb-2">Example:</p>
                            <pre className="bg-card text-text-primary rounded p-4 text-sm overflow-x-auto">
                              {endpoint.requestBody.example}
                            </pre>
                          </div>
                      )}
                    </div>
                  )}

                  {/* Success Response */}
                  <div>
                    <h4 className="text-sm font-semibold text-success mb-3 uppercase tracking-wide">
                      Success Response ({endpoint.successResponse.status})
                    </h4>
                    <pre className="bg-card text-text-primary rounded p-4 text-sm overflow-x-auto">
                      {endpoint.successResponse.example}
                    </pre>
                  </div>

                  {/* Error Response */}
                  <div>
                    <h4 className="text-sm font-semibold text-error mb-3 uppercase tracking-wide">
                      Error Response ({endpoint.errorResponse.status})
                    </h4>
                    <pre className="bg-card text-text-primary rounded p-4 text-sm overflow-x-auto">
                      {endpoint.errorResponse.example}
                    </pre>
                  </div>

                  {/* cURL Example */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                        cURL Example
                      </h4>
                      <button
                        onClick={() => copyToClipboard(endpoint.curlExample, endpoint.id)}
                        className="px-3 py-1 text-xs bg-card border border-purple-neon/10 hover:bg-card/90 rounded transition-colors"
                      >
                        {copiedEndpoint === endpoint.id ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="bg-card text-text-primary rounded p-4 text-sm overflow-x-auto">
                      {endpoint.curlExample}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Notes */}
          <div className="mt-12 bg-card border border-purple-neon/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Additional Notes
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>All endpoints return JSON responses with a <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">success</code> boolean field.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Image files are stored in Cloudflare R2 with unique filenames to prevent conflicts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Maximum file size: 10MB per image upload.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Supported image formats: JPG, JPEG, PNG, GIF, WebP, BMP</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>All timestamps are in ISO 8601 format (UTC)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ApiDocs;
