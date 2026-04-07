import { Client } from '@notionhq/client';

let _instance: Client | undefined;

export function createNotionClient(apiKey: string): Client {
  if (!_instance) {
    _instance = new Client({ auth: apiKey });
  }
  return _instance;
}
