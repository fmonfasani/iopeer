import axios from 'axios';

export class NotionService {
  private notionApi = 'https://api.notion.com/v1/pages';
  private apiKey = process.env.NOTION_API_KEY;
  private dbId = process.env.NOTION_DB_ID;

  async uploadRecord(title: string, topic: string, videoPath: string) {
    const payload = {
      parent: { database_id: this.dbId },
      properties: {
        Title: { title: [{ text: { content: title } }] },
        Tema: { rich_text: [{ text: { content: topic } }] },
        Archivo: { rich_text: [{ text: { content: videoPath } }] },
      },
    };

    await axios.post(this.notionApi, payload, {
      headers: {
        Authorization: \`Bearer \${this.apiKey}\`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ Registro subido a Notion');
  }
}
