export class NotionService {
  private notionApi = 'https://api.notion.com/v1/pages';
  private apiKey = process.env.NOTION_API_KEY;
  private dbId = process.env.NOTION_DB_ID;

  async uploadRecord(title: string, topic: string, videoPath: string) {
    if (!this.apiKey || !this.dbId) {
      throw new Error('NOTION_API_KEY or NOTION_DB_ID environment variables are not defined');
    }

    const payload = {
      parent: { database_id: this.dbId },
      properties: {
        Title: { title: [{ text: { content: title } }] },
        Tema: { rich_text: [{ text: { content: topic } }] },
        Archivo: { rich_text: [{ text: { content: videoPath } }] },
      },
    };

    const response = await fetch(this.notionApi, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Notion request failed with status ${response.status}`);
    }

    console.log('✅ Registro subido a Notion');
  }
}
