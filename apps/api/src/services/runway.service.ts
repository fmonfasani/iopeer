import * as fs from 'fs';
import * as path from 'path';

export class RunwayService {
  private outputDir = 'outputs';

  async generateVideo(title: string, audioFile: string): Promise<string> {
    await fs.promises.mkdir(this.outputDir, { recursive: true });
    const filePath = path.join(this.outputDir, `video_${Date.now()}.mp4`);

    await fs.promises.writeFile(filePath, `Simulated video for ${title} using audio ${audioFile}`);
    console.log(`️ Video generado para: ${title}`);

    return filePath;
  }
}
