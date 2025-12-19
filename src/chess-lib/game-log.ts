const bytesToHex = (data: Uint8Array): string => {
  return Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
}

export class GameLog {
  private startTime: number = Date.now();
  private entries: string[] = [];

  public addPosition(data: Uint8Array): void {
    const hex = bytesToHex(data);
    // split the hex string into groups of 8 characters
    const hexGroups = hex.match(/.{1,8}/g) || [];
    const timestamp = Date.now() - this.startTime;
    const entry = `${hexGroups.join('-')} ${timestamp}`;
    this.entries.push(entry);
    console.log(`GameLog entry: ${entry}`);
  }

  public getEntries(): string[] {
    return this.entries;
  }

  public download(filename: string = 'game-log.txt'): void {
    const blob = new Blob([this.entries.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
} 
