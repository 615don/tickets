import { Contact } from '../models/Contact.js';

// GET /api/contacts - Get all contacts
export const getAllContacts = async (req, res) => {
  try {
    const { clientId, search } = req.query;

    const contacts = await Contact.findAll({
      clientId: clientId ? parseInt(clientId) : undefined,
      search
    });

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      error: 'Failed to fetch contacts',
      message: error.message
    });
  }
};

// GET /api/contacts/:id - Get contact by ID
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        message: `Contact with ID ${id} does not exist`
      });
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      error: 'Failed to fetch contact',
      message: error.message
    });
  }
};

// POST /api/contacts - Create new contact
export const createContact = async (req, res) => {
  try {
    const { clientId, name, email } = req.body;

    // Check if email already exists
    const emailExists = await Contact.emailExists(email);
    if (emailExists) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'A contact with this email already exists'
      });
    }

    const contact = await Contact.create({
      clientId,
      name,
      email
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);

    // Handle foreign key constraint (invalid client_id)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Invalid client',
        message: 'The specified client does not exist'
      });
    }

    res.status(500).json({
      error: 'Failed to create contact',
      message: error.message
    });
  }
};

// PUT /api/contacts/:id - Update contact
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, name, email } = req.body;

    // Check if email already exists (excluding current contact)
    const emailExists = await Contact.emailExists(email, id);
    if (emailExists) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'A contact with this email already exists'
      });
    }

    const contact = await Contact.update(id, {
      clientId,
      name,
      email
    });

    res.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);

    if (error.message === 'Contact not found') {
      return res.status(404).json({
        error: 'Contact not found',
        message: `Contact with ID ${req.params.id} does not exist`
      });
    }

    // Handle foreign key constraint (invalid client_id)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Invalid client',
        message: 'The specified client does not exist'
      });
    }

    res.status(500).json({
      error: 'Failed to update contact',
      message: error.message
    });
  }
};

// DELETE /api/contacts/:id - Soft delete contact
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Contact.delete(id);

    res.json({
      message: 'Contact deleted successfully',
      ...result
    });
  } catch (error) {
    console.error('Delete contact error:', error);

    if (error.message === 'Contact not found') {
      return res.status(404).json({
        error: 'Contact not found',
        message: `Contact with ID ${req.params.id} does not exist`
      });
    }

    if (error.message === 'Cannot delete system contact') {
      return res.status(403).json({
        error: 'Cannot delete system contact',
        message: 'System contacts cannot be deleted'
      });
    }

    res.status(500).json({
      error: 'Failed to delete contact',
      message: error.message
    });
  }
};
