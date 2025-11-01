import path from 'path';
import { promises as fs } from 'fs';

// Define the path to the mock data file
const mockDataPath = path.join(process.cwd(), 'data', 'mockZaps.json');

export interface MockZap {
  id: string;
  name: string;
  status: string;
  trigger: any;
  actions: any[];
  testUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory cache for mock zaps
let mockZapsCache: Record<string, MockZap> = {};
let isCacheInitialized = false;

// Get zaps from the mock data file
async function loadMockZaps(): Promise<Record<string, MockZap>> {
  try {
    const fileContents = await fs.readFile(mockDataPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error: any) {
    // If file doesn't exist, return empty object
    if (error.code === 'ENOENT') {
      return {};
    }
    console.error('Failed to load mock zaps:', error);
    return {};
  }
}

// Save zaps to the mock data file
async function saveMockZapsToFile(zaps: Record<string, MockZap>) {
  try {
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(mockDataPath), { recursive: true });
    // Write the zaps to the file
    await fs.writeFile(mockDataPath, JSON.stringify(zaps, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save mock zaps:', error);
  }
}

// Initialize the mock zaps cache
export async function initializeMockZaps() {
  if (!isCacheInitialized) {
    mockZapsCache = await loadMockZaps();
    isCacheInitialized = true;
  }
  return mockZapsCache;
}

// Get all mock zaps
export async function getMockZaps(): Promise<Record<string, MockZap>> {
  if (!isCacheInitialized) {
    await initializeMockZaps();
  }
  return { ...mockZapsCache };
}

// Get a single mock zap by ID
export async function getMockZap(id: string): Promise<MockZap | undefined> {
  if (!isCacheInitialized) {
    await initializeMockZaps();
  }
  return mockZapsCache[id];
}

// Save or update a mock zap
export async function saveMockZap(zap: MockZap) {
  if (!isCacheInitialized) {
    await initializeMockZaps();
  }
  
  const updatedZap = {
    ...zap,
    updatedAt: new Date().toISOString(),
  };
  
  mockZapsCache[zap.id] = updatedZap;
  
  // Save to file in the background
  saveMockZapsToFile(mockZapsCache).catch(console.error);
  
  return updatedZap;
}

// Delete a mock zap
export async function deleteMockZap(id: string): Promise<boolean> {
  if (!isCacheInitialized) {
    await initializeMockZaps();
  }
  
  if (mockZapsCache[id]) {
    delete mockZapsCache[id];
    // Save to file in the background
    saveMockZapsToFile(mockZapsCache).catch(console.error);
    return true;
  }
  
  return false;
}

// Clear all mock zaps (for testing)
export async function clearMockZaps() {
  mockZapsCache = {};
  await saveMockZapsToFile({});
}
