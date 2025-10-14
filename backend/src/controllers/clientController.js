import { Client } from '../models/Client.js';
import { getCache, setCache, CacheKeys, invalidateClientCache } from '../utils/cache.js';

// GET /api/clients - Get all clients
export const getAllClients = async (req, res) => {
  try {
    const { search } = req.query;

    // If search query present, bypass cache (dynamic results)
    if (search) {
      const clients = await Client.search(search);
      return res.json(clients);
    }

    // Check cache first
    const cachedClients = getCache(CacheKeys.ALL_CLIENTS);
    if (cachedClients) {
      return res.json(cachedClients);
    }

    // Cache miss - fetch from database
    const clients = await Client.findAll();

    // Store in cache for future requests
    setCache(CacheKeys.ALL_CLIENTS, clients);

    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      error: 'Failed to fetch clients',
      message: error.message
    });
  }
};

// GET /api/clients/:id - Get client by ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        error: 'Client not found',
        message: `Client with ID ${id} does not exist`
      });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      error: 'Failed to fetch client',
      message: error.message
    });
  }
};

// POST /api/clients - Create new client
export const createClient = async (req, res) => {
  try {
    const { companyName, xeroCustomerId, maintenanceContractType, domains } = req.body;

    const client = await Client.create({
      companyName,
      xeroCustomerId,
      maintenanceContractType,
      domains
    });

    // Invalidate cache after mutation
    invalidateClientCache();

    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);

    // Handle duplicate domain error
    if (error.code === '23505' && error.constraint === 'client_domains_domain_key') {
      return res.status(400).json({
        error: 'Domain already exists',
        message: 'This domain is already assigned to another client'
      });
    }

    res.status(500).json({
      error: 'Failed to create client',
      message: error.message
    });
  }
};

// PUT /api/clients/:id - Update client
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, xeroCustomerId, maintenanceContractType, domains } = req.body;

    const client = await Client.update(id, {
      companyName,
      xeroCustomerId,
      maintenanceContractType,
      domains
    });

    // Invalidate cache after mutation
    invalidateClientCache();

    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);

    if (error.message === 'Client not found') {
      return res.status(404).json({
        error: 'Client not found',
        message: `Client with ID ${req.params.id} does not exist`
      });
    }

    // Handle duplicate domain error
    if (error.code === '23505' && error.constraint === 'client_domains_domain_key') {
      return res.status(400).json({
        error: 'Domain already exists',
        message: 'This domain is already assigned to another client'
      });
    }

    res.status(500).json({
      error: 'Failed to update client',
      message: error.message
    });
  }
};

// GET /api/clients/:id/deletion-impact - Get deletion impact counts without deleting
export const getDeletionImpact = async (req, res) => {
  try {
    const { id } = req.params;

    const impact = await Client.getDeletionImpact(id);

    res.json(impact);
  } catch (error) {
    console.error('Get deletion impact error:', error);

    if (error.message === 'Client not found') {
      return res.status(404).json({
        error: 'Client not found',
        message: `Client with ID ${req.params.id} does not exist`
      });
    }

    if (error.message === 'Cannot delete client with generated invoices') {
      return res.status(403).json({
        error: 'Cannot delete client',
        message: 'This client has generated invoices and cannot be deleted',
        hasLockedInvoices: true
      });
    }

    res.status(500).json({
      error: 'Failed to fetch deletion impact',
      message: error.message
    });
  }
};

// DELETE /api/clients/:id - Delete client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Client.delete(id);

    // Invalidate cache after mutation
    invalidateClientCache();

    res.json({
      message: 'Client deleted successfully',
      ...result
    });
  } catch (error) {
    console.error('Delete client error:', error);

    if (error.message === 'Client not found') {
      return res.status(404).json({
        error: 'Client not found',
        message: `Client with ID ${req.params.id} does not exist`
      });
    }

    if (error.message === 'Cannot delete client with generated invoices') {
      return res.status(403).json({
        error: 'Cannot delete client',
        message: 'This client has generated invoices and cannot be deleted'
      });
    }

    res.status(500).json({
      error: 'Failed to delete client',
      message: error.message
    });
  }
};

// GET /api/clients/match-domain?domain={domain} - Find clients by email domain
export const matchDomain = async (req, res) => {
  try {
    const { domain } = req.query;

    // Convert to lowercase for case-insensitive matching
    const normalizedDomain = domain.toLowerCase();

    const clients = await Client.matchByDomain(normalizedDomain);

    // Return empty array if no matches (200 status, not 404)
    res.json(clients);
  } catch (error) {
    console.error('Match domain error:', error);
    res.status(500).json({
      error: 'Failed to match domain',
      message: error.message
    });
  }
};
