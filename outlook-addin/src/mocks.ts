import { Client, Contact, TicketFormData, MatchResult } from "./types";

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock data
const mockClients: Client[] = [
  { id: 1, name: "Acme Corp" },
  { id: 2, name: "Beta Industries" },
  { id: 3, name: "Gamma Solutions" },
];

const mockContacts: Record<number, Contact[]> = {
  1: [
    { id: 10, name: "John Smith", email: "john.smith@acme.com" },
    { id: 11, name: "Jane Doe", email: "jane.doe@acme.com" },
  ],
  2: [
    { id: 20, name: "Bob Johnson", email: "bob@beta.com" },
  ],
  3: [
    { id: 30, name: "Alice Williams", email: "alice@gamma.com" },
    { id: 31, name: "Charlie Brown", email: "charlie@gamma.com" },
  ],
};

export async function mockLoadClients(): Promise<Client[]> {
  await delay(200);
  return mockClients;
}

export async function mockLoadContactsForClient(clientId: number): Promise<Contact[]> {
  await delay(300);
  return mockContacts[clientId] || [];
}

export async function mockMatchEmail(email: string): Promise<MatchResult | null> {
  await delay(500); // Simulate 500ms API call

  // Check for exact email match
  for (const clientId in mockContacts) {
    const contacts = mockContacts[clientId];
    const matchedContact = contacts.find((c) => c.email.toLowerCase() === email.toLowerCase());
    
    if (matchedContact) {
      const client = mockClients.find((c) => c.id === parseInt(clientId));
      if (client) {
        return { client, contact: matchedContact };
      }
    }
  }

  return null;
}

export async function mockCreateTicket(
  data: TicketFormData
): Promise<{ ticketId: number }> {
  await delay(800);

  // Log the contact creation data when no match
  if (data.contactName && data.contactEmail) {
    console.log("Creating new contact:", {
      name: data.contactName,
      email: data.contactEmail,
      clientId: data.clientId,
    });
  }

  // Simulate random failures (20% chance)
  if (Math.random() < 0.2) {
    throw new Error("Network error: Failed to create ticket");
  }

  return { ticketId: Math.floor(Math.random() * 9000) + 1000 };
}
