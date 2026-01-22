import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'STPI Asset Tracker API',
      version: '1.0.0',
      description: 'Complete asset lifecycle management system for STPI branches with procurement, maintenance, and disposal workflows',
      contact: {
        name: 'STPI Development Team',
        email: 'dev@stpi.in'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.stpi.in',
        description: 'Production server'
      }
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Assets', description: 'Asset management operations' },
      { name: 'Procurement', description: 'Procurement request and approval workflow' },
      { name: 'Maintenance', description: 'Asset maintenance tracking' },
      { name: 'Disposal', description: 'Asset disposal management' },
      { name: 'Master Data', description: 'Branches and suppliers management' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        },
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            asset_id: { type: 'string', example: 'HYD010125HD001' },
            asset_name: { type: 'string' },
            asset_type: { type: 'string', enum: ['HSDC Equipment', 'Computer', 'Electrical', 'Office', 'Furniture', 'Fire-Fighting', 'Building'] },
            current_status: { type: 'string', enum: ['Working', 'Not Working', 'Under Repair', 'Obsolete'] },
            branch_id: { type: 'integer' },
            testing_status: { type: 'string', enum: ['Pending', 'Confirmed'] }
          }
        },
        Procurement: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            procurement_id: { type: 'string' },
            item_name: { type: 'string' },
            quantity: { type: 'integer' },
            estimated_cost: { type: 'number' },
            status: { type: 'string', enum: ['Pending', 'Approved', 'Rejected'] }
          }
        },
        Maintenance: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            maintenance_id: { type: 'string' },
            asset_id: { type: 'integer' },
            maintenance_type: { type: 'string', enum: ['Preventive', 'Corrective', 'Emergency'] },
            status: { type: 'string', enum: ['Scheduled', 'In Progress', 'Completed'] },
            cost: { type: 'number' }
          }
        },
        Disposal: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            disposal_id: { type: 'string' },
            asset_id: { type: 'integer' },
            disposal_method: { type: 'string', enum: ['Auction', 'Scrap', 'Donation', 'e-Waste'] },
            status: { type: 'string', enum: ['Pending', 'Approved', 'Rejected', 'Disposed'] }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

export default swaggerJsdoc(options);
