import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFarms, getFarm, createFarm } from '../../services/farmApi';

describe('Farm API Service (Component 1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getFarms fetches and returns list of farms', async () => {
    const mockFarms = [
      { id: 'farm-1', name: 'Hilltop Organic Farm', totalAreaHectares: 25.5 },
      { id: 'farm-2', name: 'Valley Tea Estate', totalAreaHectares: 80.0 },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockFarms,
    });

    const result = await getFarms();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Hilltop Organic Farm');
    expect(global.fetch).toHaveBeenCalledWith('/api/farm');
  });

  it('getFarm fetches single farm by id', async () => {
    const mockFarm = { id: 'farm-1', name: 'Hilltop Organic Farm' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockFarm,
    });

    const result = await getFarm('farm-1');
    expect(result.id).toBe('farm-1');
    expect(global.fetch).toHaveBeenCalledWith('/api/farm/farm-1');
  });

  it('createFarm sends POST request with correct payload', async () => {
    const newFarm = { name: 'Sunrise Paddy Fields', totalAreaHectares: 12.0 };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'farm-new', ...newFarm }),
    });

    const result = await createFarm(newFarm);
    expect(result.id).toBe('farm-new');
    expect(global.fetch).toHaveBeenCalledWith('/api/farm', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(newFarm),
    }));
  });

  it('throws descriptive error on 500 failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Database Exception' }),
    });

    await expect(getFarms()).rejects.toThrow('Internal Server Database Exception');
  });
});
